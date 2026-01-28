"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const ZohoApi_1 = __importDefault(require("./infra/http/zoho/ZohoApi"));
const getNFe_1 = __importDefault(require("./application/usecases/getNFe"));
const getNFSe_1 = __importDefault(require("./application/usecases/getNFSe"));
const nfeController_1 = __importDefault(require("./controllers/nfeController"));
const nfseController_1 = __importDefault(require("./controllers/nfseController"));
const disableNfses_1 = __importDefault(require("./application/usecases/disableNfses"));
const getCancelledNFSe_1 = require("./application/usecases/getCancelledNFSe");
const QiveApi_1 = __importDefault(require("./infra/http/qive/QiveApi"));
const createImage_1 = __importDefault(require("./application/usecases/createImage"));
const updateLastCursor_1 = require("./application/usecases/updateLastCursor");
const getLastCursor_1 = require("./application/usecases/getLastCursor");
const getCancelledNFe_1 = require("./application/usecases/getCancelledNFe");
const disableNfes_1 = __importDefault(require("./application/usecases/disableNfes"));
const baseDir = process.pkg
    ? path_1.default.dirname(process.execPath)
    : process.cwd();
const envPath = path_1.default.join(baseDir, ".env");
async function main() {
    console.log("=== APLICAÇÃO INICIADA ===");
    console.log("Timestamp:", new Date().toISOString());
    console.log("Diretório atual:", process.cwd());
    console.log("Arquivo executável:", process.execPath);
    console.log("Caminho do .env:", envPath);
    try {
        console.log("\nCarregando arquivo .env...");
        dotenv_1.default.config({ path: envPath });
        console.log("✓ Arquivo .env carregado");
        const requiredEnvs = [
            "ZOHO_AUTH_BASE_URL",
            "ZOHO_CLIENT_ID",
            "ZOHO_CLIENT_SECRET",
            "ZOHO_REFRESH_TOKEN",
            "QIVE_X_API_ID",
            "X_API_KEY",
            "DATE_TO_SEARCH",
        ];
        console.log("\nValidando variáveis de ambiente...");
        const missingEnvs = requiredEnvs.filter((env) => {
            if (env !== "DATE_TO_SEARCH") {
                return !process.env[env];
            }
        });
        if (missingEnvs.length > 0) {
            console.error("\n❌ ERRO: Variáveis de ambiente ausentes:");
            missingEnvs.forEach((env) => console.error(`  ✗ ${env}`));
            console.error("\nSOLUÇÃO:");
            console.error(`1. Certifique-se de que existe um arquivo .env em: ${envPath}`);
            console.error("2. Verifique se todas as variáveis necessárias estão presentes");
            console.error("3. Copie o arquivo .env.dev e renomeie para .env");
            return;
        }
        console.log("✓ Todas as variáveis de ambiente validadas com sucesso");
        requiredEnvs.forEach((env) => console.log(`  ✓ ${env}`));
        const credentialsZoho = {
            authBaseUrl: process.env.ZOHO_AUTH_BASE_URL || "",
            clientId: process.env.ZOHO_CLIENT_ID || "",
            clientSecret: process.env.ZOHO_CLIENT_SECRET || "",
            refreshToken: process.env.ZOHO_REFRESH_TOKEN || "",
            grantType: process.env.ZOHO_GRANT_TYPE || "refresh_token",
        };
        const successNFeConfig = {
            formName: process.env.SUCCESS_NFE_FORM_NAME || "Copy_of_NFe",
            tableName: process.env.TABLE_NAME || "base-notas-qive",
        };
        const successNFSeConfig = {
            formName: process.env.SUCCESS_NFSE_FORM_NAME || "Copy_of_NFSe",
            tableName: process.env.TABLE_NAME || "base-notas-qive",
        };
        const credentialsQive = {
            apiId: process.env.QIVE_X_API_ID || "",
            apiKey: process.env.X_API_KEY || "",
        };
        const errorNFeConfig = {
            formName: process.env.ERROR_NFE_FORM_NAME || "Copy_Logger_NFe_Cursor",
            tableName: process.env.TABLE_NAME || "base-notas-qive",
        };
        const errorNFSeConfig = {
            formName: process.env.ERROR_NFSE_FORM_NAME || "Copy_Logger_NFSe_Cursor",
            tableName: process.env.TABLE_NAME || "base-notas-qive",
        };
        console.log("VARIAVEIS");
        let dateToSearch = process.env.DATE_TO_SEARCH;
        if (!process.env.DATE_TO_SEARCH ||
            process.env.DATE_TO_SEARCH?.trim().length === 0) {
            dateToSearch = undefined;
        }
        console.log(credentialsZoho, successNFeConfig, successNFSeConfig, credentialsQive, errorNFeConfig, errorNFSeConfig, { dateToSearch });
        console.log("\nInicializando ZohoApi...");
        const createImage = new createImage_1.default();
        const zohoApi = await ZohoApi_1.default.init(credentialsZoho);
        const qive = new QiveApi_1.default(zohoApi, createImage, credentialsQive, successNFeConfig);
        console.log("✓ ZohoApi inicializada com sucesso");
        console.log("\nCriando use cases...");
        const getNFe = new getNFe_1.default(zohoApi, credentialsQive, successNFeConfig);
        const getNFSe = new getNFSe_1.default(zohoApi, credentialsQive, successNFSeConfig);
        const disableNfses = new disableNfses_1.default(zohoApi);
        const disableNfes = new disableNfes_1.default(zohoApi);
        const getCancelledNFSe = new getCancelledNFSe_1.GetCancelledNFSe(qive);
        const getCancelledNFe = new getCancelledNFe_1.GetCancelledNFe(qive);
        const getLastCursor = new getLastCursor_1.GetLastCursor(zohoApi);
        const updateLastCursor = new updateLastCursor_1.UpdateLastCursor(zohoApi);
        console.log("✓ Use cases criados");
        console.log("\nCriando controllers...");
        const nfeController = new nfeController_1.default(getNFe, dateToSearch, getCancelledNFe, disableNfes, getLastCursor, updateLastCursor);
        const nfseController = new nfseController_1.default(getNFSe, dateToSearch, getCancelledNFSe, disableNfses, getLastCursor, updateLastCursor);
        console.log("✓ Controllers criados");
        console.log(dateToSearch);
        console.log("\n=== PROCESSANDO NFe ===");
        const nfeUpdateCancelledResult = await nfeController.updateCancelledNFe();
        const nfeResult = await nfeController.createNFe(errorNFeConfig);
        if (nfeResult.status === 200) {
            console.log("✓ NFe processada com sucesso:");
            console.log(JSON.stringify(nfeResult.data, null, 2));
        }
        else {
            console.error("✗ Erro ao processar NFe:");
            console.error(JSON.stringify(nfeResult.error, null, 2));
        }
        console.log("\n=== PROCESSANDO NFSe ===");
        const createNfseResult = await nfseController.createNFSe(errorNFSeConfig);
        const nfseUpdateCancelledResult = await nfseController.updateCancelledNFSe();
        if (createNfseResult.status === 200) {
            console.log("✓ NFSe processada com sucesso:");
            console.log(JSON.stringify(createNfseResult.data, null, 2));
        }
        else {
            console.error("✗ Erro ao processar NFSe:");
            console.error(JSON.stringify(createNfseResult.error, null, 2));
        }
        if (nfseUpdateCancelledResult === 200) {
            console.log("✓ NFSe canceladas atualizadas com sucesso.");
        }
        else if (nfseUpdateCancelledResult === 204) {
            console.log("Nenhuma NFSe cancelada para atualizar.");
        }
        else {
            console.error("✗ Erro ao atualizar NFSe canceladas.");
        }
        if (nfeUpdateCancelledResult === 200) {
            console.log("✓ NFe canceladas atualizadas com sucesso.");
        }
        else if (nfeUpdateCancelledResult === 204) {
            console.log("Nenhuma NFe cancelada para atualizar.");
        }
        else {
            console.error("✗ Erro ao atualizar NFe canceladas.");
        }
        console.log("\n✓ PROCESSAMENTO CONCLUÍDO COM SUCESSO!");
    }
    catch (error) {
        console.error("\n❌ ERRO CRÍTICO NA EXECUÇÃO:");
        console.error("Tipo:", error.name);
        console.error("Mensagem:", error.message);
        console.error("\nStack trace completo:");
        console.error(error.stack);
        console.error("\nDetalhes JSON:");
        console.error(JSON.stringify({
            error: error.message || "Erro interno do servidor",
            stack: error.stack,
            timestamp: new Date().toISOString(),
        }, null, 2));
    }
}
(async () => {
    try {
        await main();
    }
    catch (error) {
        console.error("\n✗ ERRO NÃO TRATADO NO NÍVEL MAIS ALTO:");
        console.error(error);
    }
    finally {
        process.exit(0);
    }
})();
