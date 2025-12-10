import axios, { AxiosInstance } from "axios";
import { z } from "zod";
import { IApiNota, IBaseConfigApi } from "../zoho/ZohoApi";
import QiveApiError from "../../errorHandling/QiveApiError";
import InsertZohoError from "../../errorHandling/InsertZohoError";
import formatDateToCustom from "../../utils/formatDateToCustom";
import formatDateOnlyDDMMMYYYY from "../../utils/formatDateOnlyDDMMMYYYY";
import CreateImage from "../../../application/usecases/createImage";
import path from "node:path";
import { buffer } from "node:stream/consumers";

type FoundedNotas = {
  nfe: { idNota: string[]; idRecord: string[] };
  nfse: { idNota: string[]; idRecord: string[] };
};

export type CredentialsQive = {
  apiId: string;
  apiKey: string;
};

type UpdateNota = {
  typeNota: "nfe" | "nfse";
  propertyName: string;
  propertyValue: string;
  idNota: string;
};

export type DataNFe = {
  dateFrom: string;
  dateTo: string;
  cursor?: string;
  isV2: boolean;
};

export type DataReturnedNfeNotas = {
  idsNfe: FoundedNotas["nfe"];
  nextUrl: string;
};

export type DataReturnedNfseNotas = {
  idsNfse: FoundedNotas["nfse"];
  nextUrl: string;
};

type DataNFSe = {
  dateFrom: string;
  dateTo: string;
  cursor?: string;
  isV2: boolean;
};

const ResSuccessUpdateQive = z.object({
  status: z.object({
    code: z.number(),
    message: z.string(),
  }),
  data: z.object({
    result: z.object({
      success: z.array(z.string()),
      failed: z.array(z.string()),
    }),
  }),
});

const QiveResFailure = z.object({
  status: z.object({
    code: z.number(),
    message: z.string(),
  }),
  error: z.any().optional(),
});

export default class QiveApi {
  readonly #zohoApi: IApiNota;
  readonly #createImage: CreateImage;
  #axios: AxiosInstance = axios;
  #idsFoundedNotas!: FoundedNotas;
  #credentials!: CredentialsQive;
  #successConfig: IBaseConfigApi;

  constructor(
    zoho: IApiNota,
    createImage: CreateImage,
    credentials: CredentialsQive,
    successConfig: IBaseConfigApi
  ) {
    this.#zohoApi = zoho;
    this.#successConfig = successConfig;
    this.#idsFoundedNotas = {
      nfe: { idNota: [], idRecord: [] },
      nfse: { idNota: [], idRecord: [] },
    };
    this.#credentials = credentials;
    this.#createImage = createImage;
  }

  async updateNota(
    content: { access_key?: string; id?: string; value: string }[],
    typeNota: "nfe" | "nfse"
  ) {
    let targetUrl: string = "";
    if (typeNota === "nfe") {
      targetUrl = `https://api.arquivei.com.br/v1/nfe/received/status`;
    } else if (typeNota === "nfse") {
      targetUrl = `https://api.arquivei.com.br/v1/nfse/received/status`;
    } else throw new Error("Parametro typeNota deve ser nfe ou nfse");
    const headers = {
      "X-API-ID": this.#credentials.apiId,
      "X-API-KEY": this.#credentials.apiKey,
    };
    try {
      const res = await this.#axios.put(
        targetUrl,
        {
          data: content,
        },
        { headers: headers }
      );
      console.log(res);
    } catch (error) {
      throw new QiveApiError("Erro ao atualizar nota", JSON.stringify(error));
    }
  }

  async getReceivesNFe(
    dataNFe: DataNFe,
    errorConfig: IBaseConfigApi,
    limit: number = 50
  ) {
    const options = {
      method: "GET",
      headers: {
        "X-API-ID": this.#credentials.apiId,
        "X-API-KEY": this.#credentials.apiKey,
        "Content-Type": "application/json",
      },
    };
    let targetUrl;
    if (dataNFe.cursor) {
      targetUrl = `https://api.arquivei.com.br/${
        dataNFe.isV2 ? "v2" : "v1"
      }/nfe/received?created_at[from]=${dataNFe.dateFrom}&created_at[to]=${
        dataNFe.dateTo
      }&cursor=${
        dataNFe.cursor
      }&format_type=JSON&limit=${limit}&filter=(NOT_EXISTS status INSERIDA)`;
    } else {
      targetUrl = `https://api.arquivei.com.br/${
        dataNFe.isV2 ? "v2" : "v1"
      }/nfe/received?created_at[from]=${dataNFe.dateFrom}&created_at[to]=${
        dataNFe.dateTo
      }&format_type=JSON&limit=${limit}&filter=(NOT_EXISTS status INSERIDA)`;
    }

    // if (dataNFe.cursor) {
    //   targetUrl = `https://api.arquivei.com.br/${
    //     dataNFe.isV2 ? "v2" : "v1"
    //   }/nfe/received?created_at[from]=${dataNFe.dateFrom}&created_at[to]=${
    //     dataNFe.dateTo
    //   }&cursor=${dataNFe.cursor}&format_type=JSON&limit=${limit}`;
    // } else {
    //   targetUrl = `https://api.arquivei.com.br/${
    //     dataNFe.isV2 ? "v2" : "v1"
    //   }/nfe/received?created_at[from]=${dataNFe.dateFrom}&created_at[to]=${
    //     dataNFe.dateTo
    //   }&format_type=JSON&limit=${limit}`;
    // }

    let nextUrl = targetUrl;
    let count = 1;
    let fieldsFormArr;
    while (count > 0 && count < 2) {
      const res = await this.#axios.get(nextUrl, options);
      nextUrl = res.data.page.next;
      count += 1;
      if (!res.data.data.length) continue;
      fieldsFormArr = QiveApi.getValues(res.data.data);
      const idsNotas: string[] = fieldsFormArr.map((el: any) => el.id_nota);
      const accessKeys: { access_key: string; value: string }[] =
        fieldsFormArr.map((el: any) => ({
          access_key: el.access_key,
          value: "INSERIDA",
        }));
      this.#idsFoundedNotas.nfe.idNota.push(...idsNotas);
      const field = {
        data: fieldsFormArr,
      };
      const attemptsNumber = 3;
      try {
        const pdfsBuffer: Buffer<ArrayBufferLike>[] = [];
        for await (const nota of fieldsFormArr) {
          const pdfBuffer = await this.#createImage.renderizarNotaNfe(nota);
          //@ts-ignore
          pdfsBuffer.push(pdfBuffer);
        }
        const resZ = await this.#zohoApi.insertRecord(
          field,
          this.#successConfig,
          attemptsNumber
        );
        resZ.result.forEach((el: any) => {
          this.#idsFoundedNotas.nfe.idRecord.push(el.data.ID);
        });
        for await (const [
          index,
          notaId,
        ] of this.#idsFoundedNotas.nfe.idRecord.entries()) {
          const params = {
            idCreatedRecord: notaId,
            app_name: "base-notas-qive",
            form_name: "Copy_of_NFe",
            report_name: "Copy_of_NFe_Report",
            field_name: "imagem",
            buffer: pdfsBuffer[index],
          };
          const responseUpload = await this.#zohoApi.uploadFile(params);
          if (responseUpload?.code !== 3000) {
            console.error(responseUpload);
          }
        }
        await this.updateNota(accessKeys, "nfe");
      } catch (e) {
        const fieldsError = {
          data: {
            Houve_erro: "SIM",
            Valor_do_erro: JSON.stringify(e),
          },
        };
        await this.#zohoApi.insertRecord(
          fieldsError,
          errorConfig,
          attemptsNumber
        );
      }
    }
    const dataNotas: DataReturnedNfeNotas = {
      idsNfe: this.#idsFoundedNotas.nfe,
      nextUrl,
    };
    return dataNotas;
  }

  async getReceivesNFSe(
    dataNFSe: DataNFSe,
    errorConfig: IBaseConfigApi,
    limit: number = 50
  ) {
    const options = {
      method: "GET",
      headers: {
        "X-API-ID": this.#credentials.apiId,
        "X-API-KEY": this.#credentials.apiKey,
        "Content-Type": "application/json",
      },
    };
    let targetUrl;
    if (dataNFSe.cursor) {
      targetUrl = `https://api.arquivei.com.br/${
        dataNFSe.isV2 ? "v2" : "v1"
      }/nfse/received?created_at[from]=${dataNFSe.dateFrom}&created_at[to]=${
        dataNFSe.dateTo
      }&cursor=${
        dataNFSe.cursor
      }&format_type=JSON&limit=${limit}&filter=(NOT_EXISTS status INSERIDA)`;
    } else {
      targetUrl = `https://api.arquivei.com.br/${
        dataNFSe.isV2 ? "v2" : "v1"
      }/nfse/received?created_at[from]=${dataNFSe.dateFrom}&created_at[to]=${
        dataNFSe.dateFrom
      }&format_type=JSON&limit=${limit}&filter=(NOT_EXISTS status INSERIDA)`;
    }
    let nextUrl = targetUrl;
    let count = 1;
    let fieldsFormArr;
    while (count > 0) {
      const res = await this.#axios.get(nextUrl, options);
      nextUrl = res.data.page.next;
      count = res.data.count;
      if (!res.data.data.length) continue;
      fieldsFormArr = QiveApi.getValuesNFSe(res.data.data);
      const idsNotas = fieldsFormArr.map((el: any) => el.IdNota);
      const idsParaAtualizarNotas: { id: string; value: string }[] =
        fieldsFormArr.map((el: any) => ({
          id: el.id,
          value: "INSERIDA",
        }));
      const idsRecord = fieldsFormArr.map((el: any) => el.ID);
      this.#idsFoundedNotas.nfse.idNota.push(...idsNotas);
      const field = {
        data: fieldsFormArr,
      };
      const attemptsNumber = 3;
      try {
        const resZ = await this.#zohoApi.insertRecord(
          field,
          this.#successConfig,
          attemptsNumber
        );
        resZ.result.forEach((el: any) => {
          this.#idsFoundedNotas.nfse.idRecord.push(el.data.ID);
        });
        const pdfNfseBuffers: Buffer<ArrayBufferLike>[] = [];
        for await (const notaNFSe of fieldsFormArr) {
          const pdfNfseBuffer = await this.#createImage.renderizarNotaNfse(
            notaNFSe
          );
          //@ts-ignore
          pdfNfseBuffers.push(pdfNfseBuffer);
        }
        for await (const [
          index,
          notaId,
        ] of this.#idsFoundedNotas.nfse.idRecord.entries()) {
          const params = {
            idCreatedRecord: notaId,
            app_name: "base-notas-qive",
            form_name: "Copy_of_NFSe",
            report_name: "Copy_of_NFSe_Report",
            field_name: "imagem",
            buffer: pdfNfseBuffers[index],
          };
          const responseNfseUpload = await this.#zohoApi.uploadFile(params);
          if (responseNfseUpload?.code !== 3000) {
            console.error(responseNfseUpload);
          }
        }

        await this.updateNota(idsParaAtualizarNotas, "nfse");
      } catch (e) {
        if (e instanceof InsertZohoError) {
          try {
            const fieldsError = {
              data: {
                Houve_erro: "SIM",
                Valor_do_erro: e.data,
              },
            };
            await this.#zohoApi.insertRecord(
              fieldsError,
              errorConfig,
              attemptsNumber
            );
          } catch (error: unknown) {
            const errorMessage =
              "Houve um erro ao inserir dados no formulário 'Logger_NFSe'";
            throw new InsertZohoError(errorMessage, error);
          }
        }
      }
    }
    const dataNotas: DataReturnedNfseNotas = {
      idsNfse: this.#idsFoundedNotas.nfse,
      nextUrl,
    };
    return dataNotas;
  }

  static getSubPags(pag: any) {
    const detPag: { tPag: number; xPag: string; indPag: string; vPag: string } =
      pag.detPag;
    if (Array.isArray(detPag)) {
      return detPag.map(() => {
        return {
          tPag: detPag.tPag,
          xPag: detPag.xPag,
          indPag: detPag.indPag,
        };
      });
    }
    return [
      {
        tPag: detPag.tPag,
        xPag: detPag.xPag,
        indPag: detPag.indPag,
      },
    ];
  }

  static getSubformProds(dets: any) {
    if (Array.isArray(dets) && !dets.length) return null;
    if (Array.isArray(dets)) {
      return dets.map((item) => {
        const { prod } = item;
        return {
          cProd: prod.cProd,
          xProd: prod.xProd,
          xPed: prod.xPed,
          cEAN: prod.cEAN,
          NCM: prod.NCM,
          CEST: prod.CEST,
          CFOP: prod.CFOP,
          uCom: prod.uCom,
          qCom: prod.qCom,
          vUnCom: parseFloat(prod.vUnCom).toFixed(2),
          vProd: prod.vProd,
          cEANTrib: prod.cEANTrib,
          uTrib: prod.uTrib,
          qTrib: parseFloat(prod.qTrib).toFixed(2),
          vUnTrib: parseFloat(prod.vUnTrib).toFixed(2),
          indTot: prod.indTot,
          impostos: item.imposto,
        };
      });
    }
    if (dets.prod) {
      const { prod } = dets;
      return [
        {
          cProd: prod.cProd,
          xProd: prod.xProd,
          xPed: prod.xPed,
          cEAN: prod.cEAN,
          NCM: prod.NCM,
          CEST: prod.CEST,
          CFOP: prod.CFOP,
          uCom: prod.uCom,
          qCom: prod.qCom,
          vUnCom: parseFloat(prod.vUnCom).toFixed(2),
          vProd: prod.vProd,
          cEANTrib: prod.cEANTrib,
          uTrib: prod.uTrib,
          qTrib: parseFloat(prod.qTrib).toFixed(2),
          vUnTrib: parseFloat(prod.vUnTrib).toFixed(2),
          indTot: prod.indTot,
          impostos: dets.imposto,
        },
      ];
    }
    return null;
  }

  static getValuesNFSe(data: any) {
    return data.map((d: any) => {
      const infNfse = d.xml.Nfse.InfNfse;
      const valoresNfse = infNfse.ValoresNfse;
      const prestadorServico = infNfse.PrestadorServico;
      const identificacaoPrestador =
        infNfse.PrestadorServico.IdentificacaoPrestador;
      const declaracaoPrestacaoServico = infNfse.DeclaracaoPrestacaoServico;
      const infDeclaracaoPrestacaoServico =
        infNfse.DeclaracaoPrestacaoServico.InfDeclaracaoPrestacaoServico;
      const rps = infDeclaracaoPrestacaoServico.Rps
        ? infDeclaracaoPrestacaoServico.Rps
        : null;
      const identificacaoRps =
        rps && rps.IdentificacaoRps ? rps.IdentificacaoRps : null;
      const servicos = infDeclaracaoPrestacaoServico.Servico;
      const prestador = infDeclaracaoPrestacaoServico.Prestador;
      const tomador = infDeclaracaoPrestacaoServico.Tomador;
      const identificacaoTomador = tomador.IdentificacaoTomador;
      return {
        IdNota: d.id,
        Tipo: "nfse",
        Numero: infNfse.Numero,
        CodigoVerificacao: infNfse.CodigoVerificacao,
        DataEmissao: formatDateToCustom(infNfse.DataEmissao),
        ValorCredito: infNfse.ValorCredito,
        BaseCalculo: valoresNfse.BaseCalculo,
        Aliquota: valoresNfse.Aliquota,
        ValorIss: valoresNfse.ValorIss,
        PrestadorServicoCnpj: identificacaoPrestador.CpfCnpj.Cnpj,
        PrestadorServicoCPF: identificacaoPrestador.CpfCnpj.Cpf,
        IdentificacaoPrestadorInscricaoMunicipal:
          identificacaoPrestador.InscricaoMunicipal,
        PrestadorServicoRazaoSocial: prestadorServico.RazaoSocial,
        PrestadorServicoEndereco: {
          address_line_1: prestadorServico.Endereco.Endereco,
          address_line_2: prestadorServico.Endereco.Numero,
          district_city: prestadorServico.Endereco.Complemento,
          state_province: prestadorServico.Endereco.Bairro,
          postal_Code: prestadorServico.Endereco.Uf,
          country: prestadorServico.Endereco.Cep,
        },
        PrestadorServicoEmail:
          (prestadorServico &&
            prestadorServico.Contato &&
            prestadorServico.Contato.Email) ||
          null,
        RpsNumero: identificacaoRps ? identificacaoRps.Numero : null,
        RpsSerie: identificacaoRps ? identificacaoRps.Serie : null,
        RpsTipo: identificacaoRps ? identificacaoRps.Tipo : null,
        RpsDataEmissao:
          rps && rps.DataEmissao
            ? formatDateOnlyDDMMMYYYY(rps.DataEmissao)
            : null,
        RpsStatus: rps && rps.Status ? rps.Status : null,
        Competencia: declaracaoPrestacaoServico.Competencia,
        ServicoValores: servicos.Valores,
        IssRetido: servicos.IssRetido,
        ItemListaServico: servicos.ItemListaServico,
        Discriminacao: servicos.Discriminacao,
        ExigibilidadeISS: servicos.ExigibilidadeISS,
        PrestadorCpnj: prestador.CpfCnpj.Cnpj,
        PrestadorCpf: prestador.CpfCnpj.Cpf,
        PrestadorInscricaoMunicipal: prestador.InscricaoMunicipal,
        TomadorCnpj: identificacaoTomador.CpfCnpj.Cnpj,
        TomadorCpf: identificacaoTomador.CpfCnpj.Cpf,
        TomadorInscricaoMunicipal: identificacaoTomador.InscricaoMunicipal,
        TomadorRazaoSocial: tomador.RazaoSocial,
        TomadorEndereco: {
          address_line_1: tomador.Endereco.Endereco,
          address_line_2: tomador.Endereco.Numero,
          district_city: tomador.Endereco.Bairro,
          state_province: tomador.Endereco.CodigoMunicipio,
          postal_Code: tomador.Endereco.Uf,
          country: tomador.Endereco.Cep,
        },
        TomadorEmail:
          tomador && tomador.Contato && tomador.Contato.Email
            ? tomador.Contato.Email
            : null,
        OptanteSimplesNacional:
          infDeclaracaoPrestacaoServico.OptanteSimplesNacional,
        IncentivoFiscal: infDeclaracaoPrestacaoServico.IncentivoFiscal,
      };
    });
  }

  static getValues(dataArr: any) {
    return dataArr.map((d: any) => {
      const xml = d.xml.NFe.infNFe;
      const access_key = d.access_key;
      const { ide } = xml;
      const { emit } = xml;
      const { dest } = xml;
      const total = xml.total.ICMSTot;
      const { enderEmit } = emit;
      const { enderDest } = dest;
      if (!xml.total) {
        console.log(
          `Imposto não encontrado na nota ${d.xml.NFe.infNFe["@attributes"].Id}`
        );
      }
      return {
        access_key,
        id_nota: d.xml.NFe.infNFe["@attributes"].Id,
        Tipo: "nfe",
        ide_cUF: d.xml.NFe.infNFe.ide.cUF,
        ide_cNF: d.xml.NFe.infNFe.ide.cNF,
        ide_natOp: ide.natOp,
        ide_mod: ide.mod,
        ide_serie: ide.serie,
        ide_nNF: ide.nNF,
        ide_dhEmi: formatDateToCustom(ide.dhEmi),
        ide_dhSaiEnt: ide.dhSaiEnt ? formatDateToCustom(ide.dhSaiEnt) : null,
        ide_tpNF: ide.tpNF,
        ide_idDest: ide.idDest,
        ide_cMunFG: ide.cMunFG,
        ide_tpImp: ide.tpImp,
        ide_tpEmis: ide.tpEmis,
        ide_cDV: ide.cDV,
        ide_tpAmb: ide.tpAmb,
        ide_finNFe: ide.finNFe,
        ide_indFinal: ide.indFinal,
        ide_indPres: ide.indPres,
        ide_indIntermed: ide.indIntermed,
        ide_procEmi: ide.procEmi,
        ide_verProc: ide.verProc,
        CNPJ_Emitente: emit.CNPJ,
        emit_xNome: emit.xNome,
        emit_xLgr: enderEmit.xLgr,
        emit_nro: enderEmit.nro,
        emit_xCpl: enderEmit.xCpl,
        emit_xBairro: enderEmit.xBairro,
        emit_cMun: enderEmit.cMun,
        xMun: enderEmit.xMun,
        emit_UF: enderEmit.UF,
        emit_CEP: enderEmit.CEP,
        emit_cPais: enderEmit.cPais,
        emit_xPais: enderEmit.xPais,
        emit_fone: enderEmit.fone,
        emit_IE: emit.IE,
        emit_CRT: emit.CRT,
        dest_CNPJ: dest.CNPJ,
        dest_XNome: dest.xNome,
        dest_xLgr: enderDest.xLgr,
        dest_nro: enderDest.nro,
        dest_xCpl: enderDest.xCpl,
        dest_xBairro: enderDest.xBairro,
        dest_cMun: enderDest.cMun,
        dest_xMun: enderDest.xMun,
        dest_UF: enderDest.UF,
        dest_CEP: enderDest.CEP,
        dest_cPais: enderDest.cPais,
        dest_xPais: enderDest.xPais,
        vBC: total.vBC,
        vICMS: total.vICMS,
        vFCP: total.vFCP,
        vBCST: total.vBCST,
        vST: total.vST,
        vFCPST: total.vFCPST,
        vFCPSTRet: total.vFCPSTRet,
        vProd: total.vProd,
        vFrete: total.vFrete,
        vSeg: total.vSeg,
        total_vII: total.vII,
        vIPI: total.vIPI,
        vIPIDevol: total.vIPIDevol,
        vPIS: total.vPIS,
        vCOFINS: total.vCOFINS,
        vOutro: total.vOutro,
        vNF: total.vNF,
        vTotTrib: total.vTotTrib,
        transporte: xml.transp,
        infAdic: xml.infAdic,
        vICMSDeson: total.vICMSDeson,
        vDesc: total.vDesc,
        infAdProd: xml.det.infAdProd || null,
        imposto: xml.total || null,
        subProds: QiveApi.getSubformProds(xml.det),
        subPags: QiveApi.getSubPags(xml.pag),
      };
    });
  }
}
