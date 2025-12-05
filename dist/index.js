"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const readline_1 = __importDefault(require("readline"));
const ZohoApi_1 = __importDefault(require("./infra/http/zoho/ZohoApi"));
const getNFe_1 = __importDefault(require("./application/usecases/getNFe"));
const getNFSe_1 = __importDefault(require("./application/usecases/getNFSe"));
const nfeController_1 = __importDefault(require("./controllers/nfeController"));
const nfseController_1 = __importDefault(require("./controllers/nfseController"));
async function main() {
    try {
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
        const zohoApi = await ZohoApi_1.default.init(credentialsZoho);
        const getNFe = new getNFe_1.default(zohoApi, credentialsQive, successNFeConfig);
        const getNFSe = new getNFSe_1.default(zohoApi, credentialsQive, successNFSeConfig);
        const nfeController = new nfeController_1.default(getNFe);
        const nfseController = new nfseController_1.default(getNFSe);
        const nfeResult = await nfeController.createNFe(errorNFeConfig);
        if (nfeResult.status === 200) {
            console.log(JSON.stringify(nfeResult.data));
        }
        else {
            console.error(JSON.stringify(nfeResult.error));
        }
        const dataNFSe = {
            dateFrom: process.env.DATE_FROM || "",
            dateTo: process.env.DATE_TO || "",
            cursor: process.env.CURSOR || "",
            isV2: process.env.IS_V2 === "true",
        };
        const nfseResult = await nfseController.createNFSe(errorNFSeConfig);
        if (nfseResult.status === 200) {
            console.log(JSON.stringify(nfseResult.data));
        }
        else {
            console.error(JSON.stringify({
                error: 'Tipo de nota inválido. Use "nfe" ou "nfse"',
                timestamp: new Date().toISOString(),
            }));
        }
    }
    catch (error) {
        console.error("Erro na execução:", error);
        console.error(JSON.stringify({
            error: error.message || "Erro interno do servidor",
            stack: error.stack,
            timestamp: new Date().toISOString(),
        }));
    }
}
async function waitForExitSignal() {
    const pauseOnExitEnv = process.env.PAUSE_ON_EXIT;
    const pauseOnExit = pauseOnExitEnv === undefined || pauseOnExitEnv.toLowerCase() === "true";
    if (!pauseOnExit) {
        return;
    }
    await new Promise((resolve) => {
        const rl = readline_1.default.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        rl.question("Execução finalizada. Pressione Enter para fechar...", () => {
            rl.close();
            resolve();
        });
    });
}
(async () => {
    await main();
    await waitForExitSignal();
})();
