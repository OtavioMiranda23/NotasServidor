import QiveApiError from "../../infra/errorHandling/QiveApiError";
import htmlPdf from "html-pdf-node";
export type NotaNFe = {
  id_nota?: string;
  Tipo?: string;
  ide_mod?: string;
  ide_serie?: string;
  ide_nNF?: string;
  ide_dhEmi?: string;
  ide_tpNF?: string;
  ide_natOp?: string;
  ide_cNF?: string;
  emit_xNome?: string;
  CNPJ_Emitente?: string;
  emit_xLgr?: string;
  emit_nro?: string;
  emit_xBairro?: string;
  emit_UF?: string;
  dest_XNome?: string;
  dest_CNPJ?: string;
  dest_xLgr?: string;
  dest_nro?: string;
  dest_xBairro?: string;
  dest_xMun?: string;
  dest_UF?: string;
  vProd?: string;
  vDesc?: string;
  vTotTrib?: string;
  vNF?: string;
  vICMS?: string;
  vIPI?: string;
  vFrete?: string;
  vSeg?: string;
  vOutro?: string;
  ID?: string;
  subProds?: NotaProduto[];
  [key: string]: unknown;
};

type NotaProduto = {
  cProd?: string;
  xProd?: string;
  NCM?: string;
  uCom?: string;
  qCom?: string;
  vUnCom?: string;
  vProd?: string;
};

export type NotaNFSe = {
  Aliquota?: string;
  BaseCalculo?: string;
  CodigoVerificacao?: string;
  PrestadorServicoCnpj?: string;
  DataEmissao?: string;
  Discriminacao?: string;
  ID?: string;
  IdNota?: string;
  Numero?: string;
  PrestadorCpnj?: string;
  PrestadorInscricaoMunicipal?: string;
  PrestadorServicoEndereco?: { zc_display_value: string };
  PrestadorServicoRazaoSocial?: string;
  ValorCredito?: string;
  ValorIss?: string;
  RpsNumero?: string;
  ServicoValores?: string;
  Tipo?: "nfse";
  TomadorRazaoSocial?: string;
  TomadorCnpj?: string;
  TomadorEndereco?: { zc_display_value: string };
  X509Certificate?: string;
  [key: string]: unknown;
};

type NFSeImpostos = {
  aliquota: string | null;
  csll: string | null;
  cofins: string | null;
  pis: string | null;
  valorServico: string | null;
  inss: string | null;
  iss: string | null;
};

export default class CreateImage {
  constructor(private readonly pdfOptions = { format: "A4" as const }) {}

  public async renderizarNotaNfe(nota: NotaNFe) {
    try {
      const htmlText = this.buildNFeTemplate(nota);
      const options = { format: "A4" };
      const file = { content: htmlText };

      const pdfBuffer = htmlPdf.generatePdf(file, options);
      return pdfBuffer;
    } catch (error) {
      throw new QiveApiError(
        "Erro ao renderizar arquivo da NFe",
        JSON.stringify(error)
      );
    }
  }

  public async renderizarNotaNfse(nota: NotaNFSe) {
    try {
      const htmlText = this.buildNFSeTemplate(nota);
      const options = { format: "A4" };
      const file = { content: htmlText };

      const pdfBuffer = await htmlPdf.generatePdf(file, options);
      return pdfBuffer;
    } catch (error) {
      throw new QiveApiError(
        "Erro ao renderizar arquivo da NFSe",
        JSON.stringify(error)
      );
    }
  }

  private buildNFeTemplate(nota: NotaNFe): string {
    const formatCurrency = (value?: string) => {
      if (!value) return "-";
      const parsed = Number(value);
      if (Number.isNaN(parsed)) return value;
      return parsed.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      });
    };

    return `
    <html lang="pt-BR">
      <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <style>
    /* Estilos para NFe (Nota Fiscal Eletrônica de Produtos) */
.detalhe-documento-nfe {
  background: #fff;
  padding: 8px;
  font-family: 'Arial', 'Helvetica', sans-serif;
  font-size: 11px;
  line-height: 1.3;
  max-width: 900px;
  margin: 0 auto;
  color: #000;
}

/* Cabeçalho da NFe */
.nfe-cabecalho {
  display: grid;
  grid-template-columns: 2fr 1fr;
  border: 1px solid #000;
}

.nfe-titulo {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.nfe-titulo-principal {
  font-size: 14px;
  font-weight: bold;
}

.nfe-chave-acesso {
  display: flex;
  flex-direction: column;
  text-align: center;
  gap: 5px;
}

.nfe-dt-emissao {
  padding: 4px;
}

.nfe-dt-emissao:nth-child(2) {
  border-top: 1px solid #000;
  border-bottom: 1px solid #000;
}

.nfe-wrapper-data {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border-left: 1px solid #000;
}

.nfe-wrapper-data label {
  font-size: 9px;
  text-transform: uppercase;
}

.nfe-info-direita {
  flex: 1;
  text-align: center;
}

.nfe-numero-serie {
  display: flex;

}

.nfe-numero-serie div {
  display: flex;
}

.nfe-numero-serie .label {
  font-size: 9px;
  font-weight: bold;
  display: block;
  margin-bottom: 3px;
}

.nfe-numero-serie .valor {
  font-size: 12px;
  font-weight: bold;
}

/* Seções da NFe */
.nfe-secao {
  border: 1px solid #000;
}

.nfe-secao-titulo {
  padding: 6px 12px;
  font-weight: bold;
  font-size: 10px;
  text-transform: uppercase;
  border-bottom: 1px solid #000;
}

.nfe-secao-conteudo {
  padding: 12px;
}

/* Grid de informações da NFe */
.nfe-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px 20px;
  margin-bottom: 10px;
}

.nfe-grid.tres-colunas {
  grid-template-columns: 1fr 1fr 1fr;
}

.nfe-grid.quatro-colunas {
  grid-template-columns: 1fr 1fr 1fr 1fr;
}

.nfe-grid.uma-coluna {
  grid-template-columns: 1fr;
}

.nfe-campo {
  display: flex;
  flex-direction: column;
}

.nfe-campo .label {
  font-size: 9px;
  font-weight: bold;
  margin-bottom: 3px;
  color: #333;
  text-transform: uppercase;
}

.nfe-campo .valor {
  font-size: 10px;
  padding: 3px 0;
  min-height: 16px;
  color: #000;
}

.nfe-campo .valor.destaque {
  font-weight: bold;
  font-size: 11px;
}

/* Tabela de produtos */
.nfe-produtos {
  border: 1px solid #000;
  margin: 14px 0;
}

.nfe-produtos-titulo {
  padding: 6px 12px;
  font-weight: bold;
  font-size: 10px;
  text-transform: uppercase;
  border-bottom: 1px solid #000;
}

.nfe-tabela-produtos {
  width: 100%;
  border-collapse: collapse;
  font-size: 9px;
}

.nfe-tabela-produtos th {
  background: #f5f5f5;
  padding: 6px 4px;
  text-align: left;
  font-weight: bold;
  font-size: 8px;
  border-bottom: 1px solid #000;
}

.nfe-tabela-produtos th:last-child {
  border-right: none;
}

.nfe-tabela-produtos td {
  padding: 6px 4px;
  vertical-align: top;
}

.nfe-tabela-produtos td:last-child {
  border-right: none;
}

.nfe-tabela-produtos tr:last-child td {
  border-bottom: none;
}

/* Totais da NFe */
.nfe-totais {
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.nfe-totais-grupo {
  border: 1px solid #000;
}

.nfe-totais-titulo {
  padding: 6px 10px;
  font-weight: bold;
  font-size: 10px;
  text-transform: uppercase;
  border-bottom: 1px solid #000;
}

.nfe-totais-conteudo {
  padding: 10px;
}

.nfe-totais-linha {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
  padding: 2px 0;
  border-bottom: 1px dotted #ccc;
}

.nfe-totais-linha:last-child {
  border-bottom: none;
  font-weight: bold;
  margin-top: 5px;
  padding-top: 5px;
  border-top: 1px solid #000;
}

.nfe-totais-label {
  font-size: 9px;
  color: #333;
}

.nfe-totais-valor {
  font-size: 9px;
  font-weight: bold;
  color: #000;
}

/* Informações adicionais */
.nfe-info-adicional {
  border: 1px solid #000;
}

.nfe-info-adicional-titulo {
  padding: 6px 12px;
  font-weight: bold;
  font-size: 10px;
  text-transform: uppercase;
  border-bottom: 1px solid #000;
}

.nfe-info-adicional-conteudo {
  padding: 10px;
  min-height: 60px;
  font-size: 9px;
  line-height: 1.4;
}

/* Rodapé da NFe */
.nfe-rodape {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding-top: 10px;
  font-size: 8px;
  color: #666;
}

/* Responsividade para NFe */
@media (max-width: 768px) {
  .detalhe-documento-nfe {
    padding: 15px;
    font-size: 10px;
  }

  .nfe-cabecalho {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }

  .nfe-titulo,
  .nfe-chave-acesso,
  .nfe-info-direita {
    flex: none;
  }

  .nfe-grid,
  .nfe-grid.tres-colunas,
  .nfe-grid.quatro-colunas {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .nfe-totais {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .nfe-tabela-produtos {
    font-size: 8px;
  }

  .nfe-tabela-produtos th,
  .nfe-tabela-produtos td {
    padding: 4px 2px;
  }
}
</style>

      </head>
      <body>
    <div class="detalhe-documento-nfe">
          <!-- Cabeçalho da NFe -->
          <div class="nfe-cabecalho">
            <div class="nfe-titulo">
              <span class="nfe-titulo-principal">NOTA FISCAL ELETRÔNICA</span>
            </div>
            <div class="nfe-chave-acesso">
              <div class="nfe-wrapper-data">
                <div class="nfe-dt-emissao">
                  <label class="label">Nº:</label>
                  <span class="valor">${this.safeValue(nota.ide_nNF)}</span>
                </div>
                <div class="nfe-dt-emissao">
                  <label class="label">Série:</label>
                  <span class="valor">${this.safeValue(nota.ide_serie)}</span>
                </div>
                <div class="nfe-dt-emissao">
                  <label>Data de Emissão:</label>
                  <span>${this.formatDataHora(nota.ide_dhEmi)}</span>
                </div>
              </div>
            </div>
          </div>
          <!-- Emitente -->
          <div class="nfe-secao">
            <div class="nfe-secao-titulo">Dados do Emitente</div>
            <div class="nfe-secao-conteudo">
              <div class="nfe-grid uma-coluna">
                <div class="nfe-campo">
                  <span class="label">Nome/Razão Social</span>
                  <span class="valor destaque">${this.safeValue(
                    nota.emit_xNome
                  )}</span>
                </div>
              </div>
              <div class="nfe-grid tres-colunas">
                <div class="nfe-campo">
                  <span class="label">CNPJ/CPF</span>
                  <span class="valor">${this.formatCNPJ(
                    nota.CNPJ_Emitente
                  )}</span>
                </div>
                <div class="nfe-campo">
                  <span class="label">UF</span>
                  <span class="valor">${this.safeValue(nota.emit_UF)}</span>
                </div>
              </div>
              <div class="nfe-grid uma-coluna">
                <div class="nfe-campo">
                  <span class="label">Endereço</span>
                  <span class="valor">${this.safeValue(
                    nota.emit_xLgr
                  )}, ${this.safeValue(nota.emit_nro)} - ${this.safeValue(
      nota.emit_xBairro
    )}</span>
                </div>
              </div>
            </div>
          </div>
          <!-- Destinatário -->
          <div class="nfe-secao">
            <div class="nfe-secao-titulo">Dados do Destinatário</div>
            <div class="nfe-secao-conteudo">
              <div class="nfe-grid uma-coluna">
                <div class="nfe-campo">
                  <span class="label">Nome/Razão Social</span>
                  <span class="valor destaque">${this.safeValue(
                    nota.dest_XNome
                  )}</span>
                </div>
              </div>
              <div class="nfe-grid tres-colunas">
                <div class="nfe-campo">
                  <span class="label">CNPJ/CPF</span>
                  <span class="valor">${this.formatCNPJ(nota.dest_CNPJ)}</span>
                </div>
                <div class="nfe-campo">
                  <span class="label">Data de Emissão</span>
                  <span class="valor">${this.formatDataHora(
                    nota.ide_dhEmi
                  )}</span>
                </div>
                <div class="nfe-campo">
                  <span class="label">Tipo de Operação</span>
                  <span class="valor">${
                    nota.ide_tpNF === "1" ? "SAÍDA" : "ENTRADA"
                  }</span>
                </div>
              </div>
              <div class="nfe-grid uma-coluna">
                <div class="nfe-campo">
                  <span class="label">Endereço</span>
                  <span class="valor">${this.safeValue(
                    nota.dest_xLgr
                  )}, ${this.safeValue(nota.dest_nro)} - ${this.safeValue(
      nota.dest_xBairro
    )}, ${this.safeValue(nota.dest_xMun)} - ${this.safeValue(
      nota.dest_UF
    )}</span>
                </div>
              </div>
            </div>
          </div>
          <!-- Produtos/Serviços -->
          <div class="nfe-produtos">
            <div class="nfe-produtos-titulo">Dados dos Produtos / Serviços</div>
            <table class="nfe-tabela-produtos">
              <thead>
                <tr>
                  <th style="width: 8%">Código</th>
                  <th style="width: 35%">Descrição do Produto / Serviço</th>
                  <th style="width: 8%">NCM</th>
                  <th style="width: 6%">UN</th>
                  <th style="width: 8%">Qtde</th>
                  <th style="width: 10%">Valor Unit.</th>
                  <th style="width: 10%">Valor Total</th>
                </tr>
              </thead>
              <tbody>
              ${(nota.subProds || [])
                .map(
                  (produto) => `
                  <tr>
                    <td>${this.safeValue(produto.cProd)}</td>
                    <td><strong>${this.safeValue(produto.xProd)}</strong></td>
                    <td>${this.safeValue(produto.NCM)}</td>
                    <td>${this.safeValue(produto.uCom)}</td>
                    <td>${this.safeValue(produto.qCom)}</td>
                    <td>${formatCurrency(produto.vUnCom)}</td>
                    <td><strong>${formatCurrency(produto.vProd)}</strong></td>

                  </tr>`
                )
                .join("")}
              </tbody>
            </table>
          </div>
          <!-- Totais -->
          <div class="nfe-totais">
            <div class="nfe-totais-grupo">
              <div class="nfe-totais-titulo">Cálculo do Imposto</div>
              <div class="nfe-totais-conteudo">
                <div class="nfe-totais-linha">
                  <span class="nfe-totais-label">Base de Cálculo do ICMS:</span>
                  <span class="nfe-totais-valor">${formatCurrency(
                    nota.vProd
                  )}</span>
                </div>
                <div class="nfe-totais-linha">
                  <span class="nfe-totais-label">Valor do ICMS:</span>
                  <span class="nfe-totais-valor">${formatCurrency(
                    nota.vICMS as string
                  )}</span>
                </div>
                <div class="nfe-totais-linha">
                  <span class="nfe-totais-label">Valor do IPI:</span>
                  <span class="nfe-totais-valor">${formatCurrency(
                    nota.vIPI as string
                  )}</span>
                </div>
                <div class="nfe-totais-linha">
                  <span class="nfe-totais-label">Valor Total dos Produtos:</span>
                  <span class="nfe-totais-valor">${formatCurrency(
                    nota.vProd
                  )}</span>
                </div>
              </div>
            </div>
            <div class="nfe-totais-grupo">
              <div class="nfe-totais-titulo">Totais da NFe</div>
              <div class="nfe-totais-conteudo">
                <div class="nfe-totais-linha">
                  <span class="nfe-totais-label">Valor Total dos Produtos:</span>
                  <span class="nfe-totais-valor">${formatCurrency(
                    nota.vProd
                  )}</span>
                </div>
                <div class="nfe-totais-linha">
                  <span class="nfe-totais-label">Valor do Frete:</span>
                  <span class="nfe-totais-valor">${formatCurrency(
                    nota.vFrete as string
                  )}</span>
                </div>
                <div class="nfe-totais-linha">
                  <span class="nfe-totais-label">Valor do Seguro:</span>
                  <span class="nfe-totais-valor">${formatCurrency(
                    nota.vSeg as string
                  )}</span>
                </div>
                <div class="nfe-totais-linha">
                  <span class="nfe-totais-label">Desconto:</span>
                  <span class="nfe-totais-valor">${formatCurrency(
                    nota.vDesc
                  )}</span>
                </div>
                <div class="nfe-totais-linha">
                  <span class="nfe-totais-label">Outras Despesas:</span>
                  <span class="nfe-totais-valor">${formatCurrency(
                    nota.vOutro as string
                  )}</span>
                </div>
                <div class="nfe-totais-linha">
                  <span class="nfe-totais-label">VALOR TOTAL DA NFe:</span>
                  <span class="nfe-totais-valor">${formatCurrency(
                    nota.vNF
                  )}</span>
                </div>
              </div>
            </div>
          </div>
          <!-- Informações Adicionais -->
          <div class="nfe-info-adicional">
            <div class="nfe-info-adicional-titulo">Informações Adicionais de Interesse do Contribuinte</div>
            <div class="nfe-info-adicional-conteudo">
              <strong>Natureza da Operação:</strong> ${this.safeValue(
                nota.ide_natOp
              )}<br>
              <strong>Código da NFe:</strong> ${this.safeValue(
                nota.ide_cNF
              )}<br>
            </div>
            <div class="certificado-x509">
              <span>Chave de integridade da NFe: ${this.safeValue(
                nota.ID
              )}</span>
            </div>
          </div>
          <!-- Rodapé -->
          <div class="nfe-rodape">
            <div>
              <strong>NFe nº ${this.safeValue(
                nota.ide_nNF
              )} - Série ${this.safeValue(nota.ide_serie)}</strong><br>
              Emitida em: ${this.formatDataHora(nota.ide_dhEmi)}
            </div>
            <div style="text-align: right;">
              <strong>Modelo:</strong> ${this.safeValue(nota.ide_mod)}<br>
              <strong>UF:</strong> ${this.safeValue(nota.emit_UF)}
            </div>
          </div>
        </div>
</body>
    </html>`;
  }

  private safeValue<T>(value: T, fallback: string = "-"): string {
    if (value === null || value === undefined || value === "") {
      return fallback;
    }
    return String(value);
  }

  private formatCNPJ(cnpj?: string): string {
    if (!cnpj) return "-";
    return cnpj.replace(
      /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
      "$1.$2.$3/$4-$5"
    );
  }

  private formatDataHora(dataHora?: string): string {
    if (!dataHora) return "-";
    try {
      const date = new Date(dataHora);
      return (
        date.toLocaleDateString("pt-BR") +
        " " +
        date.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    } catch {
      return dataHora;
    }
  }

  private mapearImpostosNFSe(jsonEntrada?: string): NFSeImpostos | null {
    if (!jsonEntrada?.length) return null;
    try {
      const json = JSON.parse(jsonEntrada);
      return {
        aliquota: json["Aliquota"] || null,
        csll: json["ValorCsll"] || null,
        cofins: json["ValorCofins"] || null,
        pis: json["ValorPis"] || null,
        valorServico: json["ValorServicos"] || null,
        inss: json["ValorInss"] || null,
        iss: json["ValorIss"] || null,
      };
    } catch (error) {
      return null;
    }
  }

  private buildNFSeTemplate(nota: NotaNFSe): string {
    const formatCurrency = (value?: string) => {
      if (!value) return "-";
      const parsed = Number(value);
      if (Number.isNaN(parsed)) return value;
      return parsed.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      });
    };

    const impostos = this.mapearImpostosNFSe(nota.ServicoValores);

    return `
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          /* Estilos para NFSe (Nota Fiscal de Serviços Eletrônica) - Modelo São Paulo */
          .wrapper-nfse-cabecalho {
            display: grid;
            grid-template-columns: 2fr 1fr;
            border: 1px solid #000;
          }
          .detalhe-documento-nfse {
            background: #fff;
            padding: 8px;
            font-family: 'Arial', 'Helvetica', sans-serif;
            font-size: 11px;
            line-height: 1.2;
            max-width: 900px;
            margin: 0 auto;
            color: #000;
          }

          /* Cabeçalho principal da NFSe */
          .nfse-cabecalho-principal {
            text-align: center;
            align-self: center;
          }

          .nfse-titulo-principal {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 5px;
            text-transform: uppercase;
          }

          .nfse-subtitulo {
            font-size: 12px;
            font-weight: normal;
            margin-bottom: 15px;
          }

          /* Container de informações principais (número, data, código) */
          .nfse-info-principais {
            display: flex;
            flex-direction: column;
            border-left: 1px solid #000;
          }

          .nfse-info-item {
            text-align: center;
          }

          .nfse-info-item:nth-child(2) {
            border-top: 1px solid #000;
            border-bottom: 1px solid #000;
          }

          .nfse-info-item:last-child {
            border-right: none;
          }

          .nfse-info-item .label {
            font-size: 8px;
            text-transform: uppercase;
          }

          .nfse-info-item .valor {
            display: flex;
            flex-direction: column;
            font-size: 11px;
            font-weight: bold;
          }

          /* Seções de dados */
          .nfse-secao {
            border: 1px solid #000;
          }

          .nfse-secao-cabecalho {
            padding: 6px 10px;
            font-weight: bold;
            font-size: 12px;
            text-transform: uppercase;
            text-align: center;
            border-bottom: 1px solid #000;
          }

          .nfse-secao-conteudo {
            padding: 10px;
          }

          /* Grid de campos */
          .nfse-grid-campos {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px 20px;
            margin-bottom: 10px;
          }

          .nfse-grid-campos.tres-colunas {
            grid-template-columns: 1fr 1fr 1fr;
          }

          .nfse-grid-campos.uma-coluna {
            grid-template-columns: 1fr;
          }

          .nfse-campo .label {
            font-size: 9px;
            margin-bottom: 2px;
            color: #333;
            text-transform: uppercase;
          }

          .nfse-campo .valor {
            font-size: 11px;
            padding: 2px 0;
            color: #000;
            font-weight: bold;
          }

          .nfse-campo .valor.destaque {
            font-weight: bold;
            font-size: 11px;
          }

          /* Seção de valores com destaque */
          .nfse-valores-fiscais {
            border: 1px solid #000;
          }

          .nfse-valores-container {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr 1fr;
            gap: 0;
          }

          .nfse-valor-fiscal {
            min-width: 136px;
            padding: 8px 5px;
            text-align: center;
            border-right: 1px solid #000;
            border-top: 1px solid #000;
          }

          .nfse-valor-fiscal .label {
            font-size: 8px;
            font-weight: bold;
            display: block;
            margin-bottom: 3px;
            text-transform: uppercase;
            color: #333;
          }

          .nfse-valor-fiscal .valor {
            font-size: 10px;
            font-weight: bold;
            color: #000;
          }

          /* Discriminação dos serviços */
          .nfse-discriminacao {
            border: 1px solid #000;
          }

          .nfse-discriminacao-cabecalho {
            padding: 6px 10px;
            font-weight: bold;
            font-size: 10px;
            text-transform: uppercase;
            text-align: center;
            border-bottom: 1px solid #000;
          }

          .nfse-discriminacao-conteudo {
            padding: 10px;
            min-height: 80px;
            font-size: 10px;
            line-height: 1.3;
            white-space: pre-wrap;
            font-family: 'Arial', sans-serif;
          }

          /* Observações e outras informações */
          .nfse-observacoes {
            border: 1px solid #000;
          }

          .nfse-observacoes-cabecalho {
            padding: 6px 10px;
            font-weight: bold;
            font-size: 10px;
            text-transform: uppercase;
            text-align: center;
            border-bottom: 1px solid #000;
          }

          .nfse-observacoes-conteudo {
            padding: 10px;
            min-height: 50px;
            font-size: 9px;
            line-height: 1.3;
          }

          /* Rodapé da NFSe */
          .nfse-rodape {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 20px;
            padding-top: 10px;
            font-size: 9px;
            color: #666;
          }

          .nfse-rodape-esquerda {
            text-align: left;
          }

          .nfse-rodape-direita {
            text-align: right;
          }

          /* Informações de autenticidade */
          .nfse-autenticidade {
            text-align: center;
            margin-top: 15px;
            padding: 8px;
            background: #f9f9f9;
            border: 1px solid #ddd;
            font-size: 9px;
            color: #666;
          }

          .wrapper-tipo-documento {
            display: flex;
            gap: 8px;
          }
        </style>
      </head>
      <body>
        <div class="detalhe-documento-nfse">
          <!-- Cabeçalho Principal -->
          <div class="wrapper-nfse-cabecalho">
            <div class="nfse-cabecalho-principal">
              <span class="nfse-titulo-principal">Nota Fiscal de Serviços Eletrônica - NFSe</span>
            </div>

            <!-- Informações Principais -->
            <div class="nfse-info-principais">
              <div class="nfse-info-item">
                <span class="label">Número da Nota</span>
                <span class="valor">${this.safeValue(nota.Numero)}</span>
              </div>
              <div class="nfse-info-item">
                <span class="label">Data e Hora de Emissão</span>
                <span class="valor">${this.formatDataHora(
                  nota.DataEmissao
                )}</span>
              </div>
              <div class="nfse-info-item">
                <span class="label">Código de Verificação</span>
                <span class="valor">${this.safeValue(
                  nota.CodigoVerificacao
                )}</span>
              </div>
            </div>
          </div>

          <!-- Prestador de Serviços -->
          <div class="nfse-secao">
            <div class="nfse-secao-cabecalho">Prestador de Serviços</div>
            <div class="nfse-secao-conteudo">
              <div class="nfse-grid-campos">
                <div class="nfse-campo">
                  <span class="label">CPF/CNPJ:</span>
                  <span class="valor destaque">${this.formatCNPJ(
                    nota.PrestadorServicoCnpj
                  )}</span>
                </div>
                <div class="nfse-campo">
                  <span class="label">Inscrição Municipal:</span>
                  <span class="valor">${this.safeValue(
                    nota.PrestadorInscricaoMunicipal
                  )}</span>
                </div>
              </div>
              <div class="nfse-grid-campos uma-coluna">
                <div class="nfse-campo">
                  <span class="label">Nome/Razão Social:</span>
                  <span class="valor destaque">${this.safeValue(
                    nota.PrestadorServicoRazaoSocial
                  )}</span>
                </div>
              </div>
              <div class="nfse-grid-campos uma-coluna">
                <div class="nfse-campo">
                  <span class="label">Endereço:</span>
                  <span class="valor">${this.safeValue(
                    nota.PrestadorServicoEndereco?.zc_display_value
                  )}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Tomador de Serviços -->
          <div class="nfse-secao">
            <div class="nfse-secao-cabecalho">Tomador de Serviços</div>
            <div class="nfse-secao-conteudo">
              <div class="nfse-grid-campos">
                <div class="nfse-campo">
                  <span class="label">CPF/CNPJ:</span>
                  <span class="valor destaque">${this.formatCNPJ(
                    nota.TomadorCnpj
                  )}</span>
                </div>
                <div class="nfse-campo">
                  <span class="label">RPS Número:</span>
                  <span class="valor">${this.safeValue(nota.RpsNumero)}</span>
                </div>
              </div>
              <div class="nfse-grid-campos uma-coluna">
                <div class="nfse-campo">
                  <span class="label">Nome/Razão Social:</span>
                  <span class="valor destaque">${this.safeValue(
                    nota.TomadorRazaoSocial
                  )}</span>
                </div>
              </div>
              <div class="nfse-grid-campos uma-coluna">
                <div class="nfse-campo">
                  <span class="label">Endereço:</span>
                  <span class="valor">${this.safeValue(
                    nota.TomadorEndereco?.zc_display_value
                  )}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Valores da NFSe -->
          <div class="nfse-valores-fiscais">
            <div class="nfse-secao-cabecalho">Valor total do serviço: ${formatCurrency(
              nota.BaseCalculo
            )}</div>
            <div class="nfse-valores-container">
              <div class="nfse-valor-fiscal">
                <span class="label">Alíquota (%)</span>
                <span>${impostos?.aliquota || "-"}</span>
              </div>
              <div class="nfse-valor-fiscal">
                <span class="label">ISS (R$)</span>
                <span>${impostos?.iss || "-"}</span>
              </div>
              <div class="nfse-valor-fiscal">
                <span class="label">INSS (R$)</span>
                <span>${impostos?.inss || "-"}</span>
              </div>
              <div class="nfse-valor-fiscal">
                <span class="label">IR (R$)</span>
                <span>${impostos?.valorServico || "-"}</span>
              </div>
              <div class="nfse-valor-fiscal">
                <span class="label">CSLL (R$)</span>
                <span>${impostos?.csll || "-"}</span>
              </div>
              <div class="nfse-valor-fiscal">
                <span class="label">COFINS (R$)</span>
                <span>${impostos?.cofins || "-"}</span>
              </div>
              <div class="nfse-valor-fiscal">
                <span class="label">PIS (R$)</span>
                <span>${impostos?.pis || "-"}</span>
              </div>
              <div class="nfse-valor-fiscal">
                <span class="label">Base de Cálculo</span>
                <span class="valor">${formatCurrency(nota.BaseCalculo)}</span>
              </div>
            </div>
          </div>

          <!-- Discriminação dos Serviços -->
          <div class="nfse-discriminacao">
            <div class="nfse-discriminacao-cabecalho">Discriminação dos Serviços</div>
            <div class="nfse-discriminacao-conteudo">${this.safeValue(
              nota.Discriminacao
            )}</div>
          </div>

          <!-- Outras Informações -->
          <div class="nfse-observacoes">
            <div class="nfse-observacoes-cabecalho">Outras Informações</div>
            <div class="nfse-observacoes-conteudo">
              Valor do Crédito: ${formatCurrency(nota.ValorCredito)}<br>
            </div>
          </div>
        </div>
      </body>
    </html>`;
  }
}
