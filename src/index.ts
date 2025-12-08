import readline from "readline";
import dotenv from "dotenv";
import path from "path";
import ZohoApi from "./infra/http/zoho/ZohoApi";
import GetNFe from "./application/usecases/getNFe";
import GetNFSe from "./application/usecases/getNFSe";
import NFeController from "./controllers/nfeController";
import NFSeController from "./controllers/nfseController";

// Carregar variáveis de ambiente do diretório do executável (funciona com node e com pkg)
const baseDir = (process as any).pkg
  ? path.dirname(process.execPath)
  : process.cwd();

const envPath = path.join(baseDir, ".env");

async function main() {
  console.log("=== APLICAÇÃO INICIADA ===");
  console.log("Timestamp:", new Date().toISOString());
  console.log("Diretório atual:", process.cwd());
  console.log("Arquivo executável:", process.execPath);
  console.log("Caminho do .env:", envPath);

  // PAUSA IMEDIATA - Console fica aberto aqui
  // await pauseConsole(
  //   "\n>>> Verificação inicial OK. Pressione Enter para carregar variáveis..."
  // );

  try {
    console.log("\nCarregando arquivo .env...");
    dotenv.config({ path: envPath });
    console.log("✓ Arquivo .env carregado");

    // await pauseConsole(
    //   "\n>>> .env carregado. Pressione Enter para validar variáveis..."
    // );

    // Validar variáveis críticas
    const requiredEnvs = [
      "ZOHO_AUTH_BASE_URL",
      "ZOHO_CLIENT_ID",
      "ZOHO_CLIENT_SECRET",
      "ZOHO_REFRESH_TOKEN",
      "QIVE_X_API_ID",
      "X_API_KEY",
    ];

    console.log("\nValidando variáveis de ambiente...");
    const missingEnvs = requiredEnvs.filter((env) => !process.env[env]);

    if (missingEnvs.length > 0) {
      console.error("\n❌ ERRO: Variáveis de ambiente ausentes:");
      missingEnvs.forEach((env) => console.error(`  ✗ ${env}`));
      console.error("\nSOLUÇÃO:");
      console.error(
        `1. Certifique-se de que existe um arquivo .env em: ${envPath}`
      );
      console.error(
        "2. Verifique se todas as variáveis necessárias estão presentes"
      );
      console.error("3. Copie o arquivo .env.dev e renomeie para .env");
      return;
    }

    console.log("✓ Todas as variáveis de ambiente validadas com sucesso");
    requiredEnvs.forEach((env) => console.log(`  ✓ ${env}`));

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
    console.log("VARIAVEIS");

    console.log(
      credentialsZoho,
      successNFeConfig,
      successNFSeConfig,
      credentialsQive,
      errorNFeConfig,
      errorNFSeConfig
    );
    console.log("\nInicializando ZohoApi...");
    const zohoApi = await ZohoApi.init(credentialsZoho);
    console.log("✓ ZohoApi inicializada com sucesso");

    console.log("\nCriando use cases...");
    const getNFe = new GetNFe(zohoApi, credentialsQive, successNFeConfig);
    const getNFSe = new GetNFSe(zohoApi, credentialsQive, successNFSeConfig);
    console.log("✓ Use cases criados");

    console.log("\nCriando controllers...");
    const nfeController = new NFeController(getNFe);
    const nfseController = new NFSeController(getNFSe);
    console.log("✓ Controllers criados");

    console.log("\n=== PROCESSANDO NFe ===");
    const nfeResult = await nfeController.createNFe(errorNFeConfig);

    if (nfeResult.status === 200) {
      console.log("✓ NFe processada com sucesso:");
      console.log(JSON.stringify(nfeResult.data, null, 2));
    } else {
      console.error("✗ Erro ao processar NFe:");
      console.error(JSON.stringify(nfeResult.error, null, 2));
    }

    console.log("\n=== PROCESSANDO NFSe ===");
    const nfseResult = await nfseController.createNFSe(errorNFSeConfig);

    if (nfseResult.status === 200) {
      console.log("✓ NFSe processada com sucesso:");
      console.log(JSON.stringify(nfseResult.data, null, 2));
    } else {
      console.error("✗ Erro ao processar NFSe:");
      console.error(JSON.stringify(nfseResult.error, null, 2));
    }

    console.log("\n✓ PROCESSAMENTO CONCLUÍDO COM SUCESSO!");
  } catch (error: any) {
    console.error("\n❌ ERRO CRÍTICO NA EXECUÇÃO:");
    console.error("Tipo:", error.name);
    console.error("Mensagem:", error.message);
    console.error("\nStack trace completo:");
    console.error(error.stack);
    console.error("\nDetalhes JSON:");
    console.error(
      JSON.stringify(
        {
          error: error.message || "Erro interno do servidor",
          stack: error.stack,
          timestamp: new Date().toISOString(),
        },
        null,
        2
      )
    );
  }
}

(async () => {
  try {
    await main();
  } catch (error: any) {
    console.error("\n✗ ERRO NÃO TRATADO NO NÍVEL MAIS ALTO:");
    console.error(error);
  } finally {
    // SEMPRE aguardar antes de fechar
    process.exit(0);
  }
})();
//// filepath: c:\Users\otavio.miranda\projects\pdfGenerator\src\index.ts
// ...existing code...
// import readline from "readline";

// async function pauseConsole(message: string) {
//   return new Promise<void>((resolve) => {
//     const rl = readline.createInterface({
//       input: process.stdin,
//       output: process.stdout,
//     });

//     rl.question(message, () => {
//       rl.close();
//       resolve();
//     });
//   });
// }

// async function main() {
//   console.log("=== TESTE PKG SIMPLES ===");
//   console.log("Timestamp:", new Date().toISOString());
//   console.log("process.cwd():", process.cwd());
//   console.log("process.execPath:", process.execPath);

//   await pauseConsole("\n>>> Teste OK. Pressione Enter para sair...");
// }

// (async () => {
//   try {
//     await main();
//   } catch (err) {
//     console.error("Erro inesperado:", err);
//   } finally {
//     await pauseConsole(
//       "\n=== FIM DO PROGRAMA ===\nPressione Enter para fechar o console..."
//     );
//   }
// })();
// // ...existing code...
