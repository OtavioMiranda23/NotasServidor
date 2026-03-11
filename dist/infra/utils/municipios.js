"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Municipios = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class Municipios {
    constructor(caminhoArquivo) {
        this.codigoParaNome = new Map();
        this.caminhoArquivo = caminhoArquivo ?? this.resolverArquivoMunicipios();
        this.carregarMunicipios();
    }
    obterNomePorCodigo(codigoMunicipio) {
        const codigoNormalizado = this.normalizarCodigo(String(codigoMunicipio));
        if (!codigoNormalizado) {
            return undefined;
        }
        return this.codigoParaNome.get(codigoNormalizado);
    }
    resolverArquivoMunicipios() {
        const aPartirDoCwd = path_1.default.resolve(process.cwd(), "municipios.json");
        if (fs_1.default.existsSync(aPartirDoCwd)) {
            return aPartirDoCwd;
        }
        return path_1.default.resolve(__dirname, "../../../municipios.json");
    }
    carregarMunicipios() {
        const conteudo = fs_1.default.readFileSync(this.caminhoArquivo, "utf-8");
        const municipios = JSON.parse(conteudo);
        for (const municipio of municipios) {
            const codigoBruto = municipio["Código Município Completo"] ??
                municipio['="Código Município Completo"'];
            const nomeBruto = municipio.Nome_Município ?? municipio['="Nome_Município"'];
            const codigo = this.normalizarCodigo(codigoBruto);
            const nome = this.normalizarTexto(nomeBruto);
            if (!codigo || !nome) {
                continue;
            }
            this.codigoParaNome.set(codigo, nome);
        }
    }
    normalizarCodigo(valor) {
        const texto = this.normalizarTexto(valor);
        if (!texto) {
            return undefined;
        }
        const apenasDigitos = texto.replace(/\D/g, "");
        return apenasDigitos || undefined;
    }
    normalizarTexto(valor) {
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
exports.Municipios = Municipios;
