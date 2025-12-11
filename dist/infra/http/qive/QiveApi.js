"use strict";
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _QiveApi_zohoApi, _QiveApi_createImage, _QiveApi_axios, _QiveApi_idsFoundedNotas, _QiveApi_credentials, _QiveApi_successConfig;
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const zod_1 = require("zod");
const QiveApiError_1 = __importDefault(require("../../errorHandling/QiveApiError"));
const InsertZohoError_1 = __importDefault(require("../../errorHandling/InsertZohoError"));
const formatDateToCustom_1 = __importDefault(require("../../utils/formatDateToCustom"));
const formatDateOnlyDDMMMYYYY_1 = __importDefault(require("../../utils/formatDateOnlyDDMMMYYYY"));
const ResSuccessUpdateQive = zod_1.z.object({
    status: zod_1.z.object({
        code: zod_1.z.number(),
        message: zod_1.z.string(),
    }),
    data: zod_1.z.object({
        result: zod_1.z.object({
            success: zod_1.z.array(zod_1.z.string()),
            failed: zod_1.z.array(zod_1.z.string()),
        }),
    }),
});
const QiveResFailure = zod_1.z.object({
    status: zod_1.z.object({
        code: zod_1.z.number(),
        message: zod_1.z.string(),
    }),
    error: zod_1.z.any().optional(),
});
class QiveApi {
    constructor(zoho, createImage, credentials, successConfig) {
        _QiveApi_zohoApi.set(this, void 0);
        _QiveApi_createImage.set(this, void 0);
        _QiveApi_axios.set(this, axios_1.default);
        _QiveApi_idsFoundedNotas.set(this, void 0);
        _QiveApi_credentials.set(this, void 0);
        _QiveApi_successConfig.set(this, void 0);
        __classPrivateFieldSet(this, _QiveApi_zohoApi, zoho, "f");
        __classPrivateFieldSet(this, _QiveApi_successConfig, successConfig, "f");
        __classPrivateFieldSet(this, _QiveApi_idsFoundedNotas, {
            nfe: { idNota: [], idRecord: [] },
            nfse: { idNota: [], idRecord: [] },
        }, "f");
        __classPrivateFieldSet(this, _QiveApi_credentials, credentials, "f");
        __classPrivateFieldSet(this, _QiveApi_createImage, createImage, "f");
    }
    async updateNota(content, typeNota) {
        let targetUrl = "";
        if (typeNota === "nfe") {
            targetUrl = `https://api.arquivei.com.br/v1/nfe/received/status`;
        }
        else if (typeNota === "nfse") {
            targetUrl = `https://api.arquivei.com.br/v1/nfse/received/status`;
        }
        else
            throw new Error("Parametro typeNota deve ser nfe ou nfse");
        const headers = {
            "X-API-ID": __classPrivateFieldGet(this, _QiveApi_credentials, "f").apiId,
            "X-API-KEY": __classPrivateFieldGet(this, _QiveApi_credentials, "f").apiKey,
        };
        try {
            console.log(`Parametros do update: ${JSON.stringify(content)}`);
            const res = await __classPrivateFieldGet(this, _QiveApi_axios, "f").put(targetUrl, {
                data: typeNota === "nfse"
                    ? content.map((el) => ({
                        access_key: el.access_key,
                        value: el.value,
                    }))
                    : content.map((el) => ({ id: el.id, value: el.value })),
            }, { headers: headers });
            console.log(`Resposta do update${res}`);
        }
        catch (error) {
            console.log(`Erro do update${error}`);
            throw new QiveApiError_1.default("Erro ao atualizar nota", JSON.stringify(error));
        }
    }
    async getReceivesNFe(dataNFe, errorConfig, limit = 50) {
        const options = {
            method: "GET",
            headers: {
                "X-API-ID": __classPrivateFieldGet(this, _QiveApi_credentials, "f").apiId,
                "X-API-KEY": __classPrivateFieldGet(this, _QiveApi_credentials, "f").apiKey,
                "Content-Type": "application/json",
            },
        };
        let targetUrl;
        if (dataNFe.cursor) {
            targetUrl = `https://api.arquivei.com.br/${dataNFe.isV2 ? "v2" : "v1"}/nfe/received?created_at[from]=${dataNFe.dateFrom}&created_at[to]=${dataNFe.dateTo}&cursor=${dataNFe.cursor}&format_type=JSON&limit=${limit}&filter=(NOT_EXISTS status INSERIDA)`;
        }
        else {
            targetUrl = `https://api.arquivei.com.br/${dataNFe.isV2 ? "v2" : "v1"}/nfe/received?created_at[from]=${dataNFe.dateFrom}&created_at[to]=${dataNFe.dateTo}&format_type=JSON&limit=${limit}&filter=(NOT_EXISTS status INSERIDA)`;
        }
        let nextUrl = targetUrl;
        let count = 1;
        let fieldsFormArr;
        while (count > 0) {
            const res = await __classPrivateFieldGet(this, _QiveApi_axios, "f").get(nextUrl, options);
            nextUrl = res.data.page.next;
            count = res.data.count;
            if (!res.data.data.length)
                continue;
            fieldsFormArr = QiveApi.getValues(res.data.data);
            const idsNotas = fieldsFormArr.map((el) => el.id_nota);
            const accessKeys = fieldsFormArr.map((el) => ({
                access_key: el.access_key,
                value: "INSERIDA",
            }));
            __classPrivateFieldGet(this, _QiveApi_idsFoundedNotas, "f").nfe.idNota.push(...idsNotas);
            const field = {
                data: fieldsFormArr,
            };
            const attemptsNumber = 3;
            try {
                const resZ = await __classPrivateFieldGet(this, _QiveApi_zohoApi, "f").insertRecord(field, __classPrivateFieldGet(this, _QiveApi_successConfig, "f"), attemptsNumber);
                const currentBatchIds = resZ.result.map((el) => el.data.ID);
                __classPrivateFieldGet(this, _QiveApi_idsFoundedNotas, "f").nfe.idRecord.push(...currentBatchIds);
                const pdfsBuffer = [];
                for await (const nota of fieldsFormArr) {
                    const pdfBuffer = await __classPrivateFieldGet(this, _QiveApi_createImage, "f").renderizarNotaNfe(nota);
                    pdfsBuffer.push(pdfBuffer);
                }
                for (let i = 0; i < currentBatchIds.length; i++) {
                    const params = {
                        idCreatedRecord: currentBatchIds[i],
                        app_name: "base-notas-qive",
                        form_name: "Copy_of_NFe",
                        report_name: "Copy_of_NFe_Report",
                        field_name: "imagem",
                        buffer: pdfsBuffer[i],
                    };
                    const responseUpload = await __classPrivateFieldGet(this, _QiveApi_zohoApi, "f").uploadFile(params);
                    if (responseUpload?.code !== 3000) {
                        console.error(responseUpload);
                    }
                }
                await this.updateNota(accessKeys, "nfe");
            }
            catch (e) {
                const fieldsError = {
                    data: {
                        Houve_erro: "SIM",
                        Valor_do_erro: JSON.stringify(e),
                    },
                };
                await __classPrivateFieldGet(this, _QiveApi_zohoApi, "f").insertRecord(fieldsError, errorConfig, attemptsNumber);
            }
        }
        const dataNotas = {
            idsNfe: __classPrivateFieldGet(this, _QiveApi_idsFoundedNotas, "f").nfe,
            nextUrl,
        };
        return dataNotas;
    }
    async getReceivesNFSe(dataNFSe, errorConfig, limit = 50) {
        const options = {
            method: "GET",
            headers: {
                "X-API-ID": __classPrivateFieldGet(this, _QiveApi_credentials, "f").apiId,
                "X-API-KEY": __classPrivateFieldGet(this, _QiveApi_credentials, "f").apiKey,
                "Content-Type": "application/json",
            },
        };
        let targetUrl;
        if (dataNFSe.cursor) {
            targetUrl = `https://api.arquivei.com.br/${dataNFSe.isV2 ? "v2" : "v1"}/nfse/received?created_at[from]=${dataNFSe.dateFrom}&created_at[to]=${dataNFSe.dateTo}&cursor=${dataNFSe.cursor}&format_type=JSON&limit=${limit}&filter=(NOT_EXISTS status INSERIDA)`;
        }
        else {
            targetUrl = `https://api.arquivei.com.br/${dataNFSe.isV2 ? "v2" : "v1"}/nfse/received?created_at[from]=${dataNFSe.dateFrom}&created_at[to]=${dataNFSe.dateTo}&format_type=JSON&limit=${limit}&filter=(NOT_EXISTS status INSERIDA)`;
        }
        let nextUrl = targetUrl;
        let count = 1;
        let fieldsFormArr;
        while (count > 0) {
            const res = await __classPrivateFieldGet(this, _QiveApi_axios, "f").get(nextUrl, options);
            nextUrl = res.data.page.next;
            count = res.data.count;
            if (!res.data.data.length)
                continue;
            fieldsFormArr = QiveApi.getValuesNFSe(res.data.data);
            const idsNotas = fieldsFormArr.map((el) => el.IdNota);
            const idsParaAtualizarNotas = fieldsFormArr.map((el) => ({
                id: el.IdNota,
                value: "INSERIDA",
            }));
            const idsRecord = fieldsFormArr.map((el) => el.ID);
            __classPrivateFieldGet(this, _QiveApi_idsFoundedNotas, "f").nfse.idNota.push(...idsNotas);
            const field = {
                data: fieldsFormArr,
            };
            const attemptsNumber = 3;
            try {
                const resZ = await __classPrivateFieldGet(this, _QiveApi_zohoApi, "f").insertRecord(field, __classPrivateFieldGet(this, _QiveApi_successConfig, "f"), attemptsNumber);
                const currentBatchIds = resZ.result.map((el) => el.data.ID);
                __classPrivateFieldGet(this, _QiveApi_idsFoundedNotas, "f").nfse.idRecord.push(...currentBatchIds);
                const pdfNfseBuffers = [];
                for await (const notaNFSe of fieldsFormArr) {
                    const pdfNfseBuffer = await __classPrivateFieldGet(this, _QiveApi_createImage, "f").renderizarNotaNfse(notaNFSe);
                    pdfNfseBuffers.push(pdfNfseBuffer);
                }
                for (let i = 0; i < currentBatchIds.length; i++) {
                    const params = {
                        idCreatedRecord: currentBatchIds[i],
                        app_name: "base-notas-qive",
                        form_name: "Copy_of_NFSe",
                        report_name: "Copy_of_NFSe_Report",
                        field_name: "imagem",
                        buffer: pdfNfseBuffers[i],
                    };
                    const responseNfseUpload = await __classPrivateFieldGet(this, _QiveApi_zohoApi, "f").uploadFile(params);
                    if (responseNfseUpload?.code !== 3000) {
                        console.error(responseNfseUpload);
                    }
                }
                await this.updateNota(idsParaAtualizarNotas, "nfse");
            }
            catch (e) {
                if (e instanceof InsertZohoError_1.default) {
                    try {
                        const fieldsError = {
                            data: {
                                Houve_erro: "SIM",
                                Valor_do_erro: e.data,
                            },
                        };
                        await __classPrivateFieldGet(this, _QiveApi_zohoApi, "f").insertRecord(fieldsError, errorConfig, attemptsNumber);
                    }
                    catch (error) {
                        const errorMessage = "Houve um erro ao inserir dados no formulário 'Logger_NFSe'";
                        throw new InsertZohoError_1.default(errorMessage, error);
                    }
                }
            }
        }
        const dataNotas = {
            idsNfse: __classPrivateFieldGet(this, _QiveApi_idsFoundedNotas, "f").nfse,
            nextUrl,
        };
        return dataNotas;
    }
    static getSubPags(pag) {
        const detPag = pag.detPag;
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
    static getSubformProds(dets) {
        if (Array.isArray(dets) && !dets.length)
            return null;
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
    static getValuesNFSe(data) {
        return data.map((d) => {
            const infNfse = d.xml.Nfse.InfNfse;
            const valoresNfse = infNfse.ValoresNfse;
            const prestadorServico = infNfse.PrestadorServico;
            const identificacaoPrestador = infNfse.PrestadorServico.IdentificacaoPrestador;
            const declaracaoPrestacaoServico = infNfse.DeclaracaoPrestacaoServico;
            const infDeclaracaoPrestacaoServico = infNfse.DeclaracaoPrestacaoServico.InfDeclaracaoPrestacaoServico;
            const rps = infDeclaracaoPrestacaoServico.Rps
                ? infDeclaracaoPrestacaoServico.Rps
                : null;
            const identificacaoRps = rps && rps.IdentificacaoRps ? rps.IdentificacaoRps : null;
            const servicos = infDeclaracaoPrestacaoServico.Servico;
            const prestador = infDeclaracaoPrestacaoServico.Prestador;
            const tomador = infDeclaracaoPrestacaoServico.Tomador;
            const identificacaoTomador = tomador.IdentificacaoTomador;
            return {
                IdNota: d.id,
                Tipo: "nfse",
                Numero: infNfse.Numero,
                CodigoVerificacao: infNfse.CodigoVerificacao,
                DataEmissao: (0, formatDateToCustom_1.default)(infNfse.DataEmissao),
                ValorCredito: infNfse.ValorCredito,
                BaseCalculo: valoresNfse.BaseCalculo,
                Aliquota: valoresNfse.Aliquota,
                ValorIss: valoresNfse.ValorIss,
                PrestadorServicoCnpj: identificacaoPrestador.CpfCnpj.Cnpj,
                PrestadorServicoCPF: identificacaoPrestador.CpfCnpj.Cpf,
                IdentificacaoPrestadorInscricaoMunicipal: identificacaoPrestador.InscricaoMunicipal,
                PrestadorServicoRazaoSocial: prestadorServico.RazaoSocial,
                PrestadorServicoEndereco: {
                    address_line_1: prestadorServico.Endereco.Endereco,
                    address_line_2: prestadorServico.Endereco.Numero,
                    district_city: prestadorServico.Endereco.Complemento,
                    state_province: prestadorServico.Endereco.Bairro,
                    postal_Code: prestadorServico.Endereco.Uf,
                    country: prestadorServico.Endereco.Cep,
                },
                PrestadorServicoEmail: (prestadorServico &&
                    prestadorServico.Contato &&
                    prestadorServico.Contato.Email) ||
                    null,
                RpsNumero: identificacaoRps ? identificacaoRps.Numero : null,
                RpsSerie: identificacaoRps ? identificacaoRps.Serie : null,
                RpsTipo: identificacaoRps ? identificacaoRps.Tipo : null,
                RpsDataEmissao: rps && rps.DataEmissao
                    ? (0, formatDateOnlyDDMMMYYYY_1.default)(rps.DataEmissao)
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
                TomadorEmail: tomador && tomador.Contato && tomador.Contato.Email
                    ? tomador.Contato.Email
                    : null,
                OptanteSimplesNacional: infDeclaracaoPrestacaoServico.OptanteSimplesNacional,
                IncentivoFiscal: infDeclaracaoPrestacaoServico.IncentivoFiscal,
            };
        });
    }
    static getValues(dataArr) {
        return dataArr.map((d) => {
            const xml = d.xml.NFe.infNFe;
            const access_key = d.access_key;
            const { ide } = xml;
            const { emit } = xml;
            const { dest } = xml;
            const total = xml.total.ICMSTot;
            const { enderEmit } = emit;
            const { enderDest } = dest;
            if (!xml.total) {
                console.log(`Imposto não encontrado na nota ${d.xml.NFe.infNFe["@attributes"].Id}`);
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
                ide_dhEmi: (0, formatDateToCustom_1.default)(ide.dhEmi),
                ide_dhSaiEnt: ide.dhSaiEnt ? (0, formatDateToCustom_1.default)(ide.dhSaiEnt) : null,
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
_QiveApi_zohoApi = new WeakMap(), _QiveApi_createImage = new WeakMap(), _QiveApi_axios = new WeakMap(), _QiveApi_idsFoundedNotas = new WeakMap(), _QiveApi_credentials = new WeakMap(), _QiveApi_successConfig = new WeakMap();
exports.default = QiveApi;
