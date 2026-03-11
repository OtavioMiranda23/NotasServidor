import fs from "fs";
import path from "path";

type Municipio = {
  UF: string;
  Nome_UF: string;
  "Região Geográfica Intermediária": string;
  "Nome Região Geográfica Intermediária": string;
  "Região Geográfica Imediata": string;
  "Nome Região Geográfica Imediata": string;
  Município: string;
  "Código Município Completo": string;
  Nome_Município: string;
};

type MunicipioRaw = Partial<Municipio> & {
  '="Nome_Município"'?: string;
  '="Código Município Completo"'?: string;
};

export class Municipios {
  private readonly caminhoArquivo: string;
  private readonly codigoParaNome = new Map<string, string>();

  constructor(caminhoArquivo: string) {
    this.caminhoArquivo = caminhoArquivo ?? this.resolverArquivoMunicipios();
    this.carregarMunicipios();
  }

  public obterNomePorCodigo(
    codigoMunicipio: string | number,
  ): string | undefined {
    const codigoNormalizado = this.normalizarCodigo(String(codigoMunicipio));

    if (!codigoNormalizado) {
      return undefined;
    }

    return this.codigoParaNome.get(codigoNormalizado);
  }

  private resolverArquivoMunicipios(): string {
    const aPartirDoCwd = path.resolve(process.cwd(), "municipios.json");
    if (fs.existsSync(aPartirDoCwd)) {
      return aPartirDoCwd;
    }

    return path.resolve(__dirname, "../../../municipios.json");
  }

  private carregarMunicipios(): void {
    const conteudo = fs.readFileSync(this.caminhoArquivo, "utf-8");
    const municipios = JSON.parse(conteudo) as MunicipioRaw[];

    for (const municipio of municipios) {
      const codigoBruto =
        municipio["Código Município Completo"] ??
        municipio['="Código Município Completo"'];
      const nomeBruto =
        municipio.Nome_Município ?? municipio['="Nome_Município"'];

      const codigo = this.normalizarCodigo(codigoBruto);
      const nome = this.normalizarTexto(nomeBruto);

      if (!codigo || !nome) {
        continue;
      }

      this.codigoParaNome.set(codigo, nome);
    }
  }

  private normalizarCodigo(valor?: string): string | undefined {
    const texto = this.normalizarTexto(valor);
    if (!texto) {
      return undefined;
    }

    const apenasDigitos = texto.replace(/\D/g, "");
    return apenasDigitos || undefined;
  }

  private normalizarTexto(valor?: string): string | undefined {
    if (!valor) {
      return undefined;
    }

    const texto = valor.trim();
    if (!texto) {
      return undefined;
    }

    if (texto.startsWith('="') && texto.endsWith('"')) {
      return texto.slice(2, -1).trim() || undefined;
    }

    return texto;
  }
}
