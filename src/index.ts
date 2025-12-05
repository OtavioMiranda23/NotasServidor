import readline from "readline";
import ZohoApi from "./infra/http/zoho/ZohoApi";
import GetNFe from "./application/usecases/getNFe";
import GetNFSe from "./application/usecases/getNFSe";
import NFeController from "./controllers/nfeController";
import NFSeController from "./controllers/nfseController";

async function main() {
  try {
    // Configurações de credenciais do Zoho
    const credentialsZoho = {
      authBaseUrl: process.env.ZOHO_AUTH_BASE_URL || "",
      clientId: process.env.ZOHO_CLIENT_ID || "",
      clientSecret: process.env.ZOHO_CLIENT_SECRET || "",
      refreshToken: process.env.ZOHO_REFRESH_TOKEN || "",
      grantType: process.env.ZOHO_GRANT_TYPE || "refresh_token",
    };

    // Configurações dos formulários de sucesso
    const successNFeConfig = {
      formName: process.env.SUCCESS_NFE_FORM_NAME || "Copy_of_NFe",
      tableName: process.env.TABLE_NAME || "base-notas-qive",
    };

    const successNFSeConfig = {
      formName: process.env.SUCCESS_NFSE_FORM_NAME || "Copy_of_NFSe",
      tableName: process.env.TABLE_NAME || "base-notas-qive",
    };

    // Configurações de credenciais do Qive
    const credentialsQive = {
      apiId: process.env.QIVE_X_API_ID || "",
      apiKey: process.env.X_API_KEY || "",
    };

    // Configurações dos formulários de erro
    const errorNFeConfig = {
      formName: process.env.ERROR_NFE_FORM_NAME || "Copy_Logger_NFe_Cursor",
      tableName: process.env.TABLE_NAME || "base-notas-qive",
    };

    const errorNFSeConfig = {
      formName: process.env.ERROR_NFSE_FORM_NAME || "Copy_Logger_NFSe_Cursor",
      tableName: process.env.TABLE_NAME || "base-notas-qive",
    };

    // Inicializar ZohoApi
    const zohoApi = await ZohoApi.init(credentialsZoho);

    // Criar use cases
    const getNFe = new GetNFe(zohoApi, credentialsQive, successNFeConfig);
    const getNFSe = new GetNFSe(zohoApi, credentialsQive, successNFSeConfig);

    // Criar controllers
    const nfeController = new NFeController(getNFe);
    const nfseController = new NFSeController(getNFSe);

    // Processar requisição NFe

    const nfeResult = await nfeController.createNFe(errorNFeConfig);

    if (nfeResult.status === 200) {
      console.log(JSON.stringify(nfeResult.data));
    } else {
      console.error(JSON.stringify(nfeResult.error));
    }

    // Processar requisição NFSe
    const dataNFSe = {
      dateFrom: process.env.DATE_FROM || "",
      dateTo: process.env.DATE_TO || "",
      cursor: process.env.CURSOR || "",
      isV2: process.env.IS_V2 === "true",
    };

    const nfseResult = await nfseController.createNFSe(errorNFSeConfig);

    if (nfseResult.status === 200) {
      console.log(JSON.stringify(nfseResult.data));
    } else {
      console.error(
        JSON.stringify({
          error: 'Tipo de nota inválido. Use "nfe" ou "nfse"',
          timestamp: new Date().toISOString(),
        })
      );
    }
  } catch (error: any) {
    console.error("Erro na execução:", error);
    console.error(
      JSON.stringify({
        error: error.message || "Erro interno do servidor",
        stack: error.stack,
        timestamp: new Date().toISOString(),
      })
    );
  }
}

async function waitForExitSignal() {
  const pauseOnExitEnv = process.env.PAUSE_ON_EXIT;
  const pauseOnExit =
    pauseOnExitEnv === undefined || pauseOnExitEnv.toLowerCase() === "true";

  if (!pauseOnExit) {
    return;
  }

  await new Promise<void>((resolve) => {
    const rl = readline.createInterface({
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
