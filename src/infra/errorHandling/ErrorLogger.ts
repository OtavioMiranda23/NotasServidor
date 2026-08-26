import ZohoApi, { IZohoLinksNames } from "../http/zoho/ZohoApi";

const ERROR_LOG_CONFIG: Omit<IZohoLinksNames, "reportName"> = {
  appName: "base-notas-qive",
  formName: "Log_Backend_Notas",
};

export default class ErrorLogger {
  constructor(private readonly zoho: ZohoApi) {}

  async log(error: unknown, source: string, tipo: "ERRO" | "ALERTA" = "ERRO"): Promise<void> {
    try {
      const entry = this.buildEntry(error, source, tipo);
      await this.zoho.saveRecord({ data: entry }, ERROR_LOG_CONFIG);
    } catch (logError) {
      console.error("Falha ao gravar log de erro no Zoho:", logError);
    }
  }

  async execute<T>(fn: () => Promise<T>, source: string): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      await this.log(error, source);
      throw error;
    }
  }

  private buildEntry(error: unknown, source: string, tipo: "ERRO" | "ALERTA") {
    let errorMessage = "Erro desconhecido";
    let stackTrace = "";

    if (error instanceof Error) {
      errorMessage = `[${source}] ${error.message}`;
      stackTrace = error.stack || "";
    } else if (typeof error === "string") {
      errorMessage = `[${source}] ${error}`;
    }

    return {
      Tipo1: tipo,
      ErrorMessage: errorMessage,
      Stracktrace: stackTrace,
    };
  }
}
