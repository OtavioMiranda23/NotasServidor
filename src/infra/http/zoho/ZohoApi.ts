import axios from "axios";
import type { AxiosInstance } from "axios";
import { set, z } from "zod";
import sleep from "../../utils/sleep";
import InsertZohoError from "../../errorHandling/InsertZohoError";
import ZohoGenericError from "../../errorHandling/ZohoGenericError";
import ZohoNotFoundRecords from "../../errorHandling/ZohoNotFoundRecords";
import FormData from "form-data";
import fs from "node:fs/promises";
import path from "node:path";
import { Blob } from "buffer";
import { blob } from "node:stream/consumers";
import { Readable } from "node:stream";
import { error, log } from "node:console";
// import htmlPdf from "html-pdf-node";
/**
 *
 * @deprecated Uso não recomendado devido a erro na tableName que está utilizado como appName. Utilizar IZohoLinksNames no lugar.
 */
export interface IBaseConfigApi {
  //tableName é o nome da aplicação no zoho
  tableName: string;
  formName: string;
}

export interface IZohoLinksNames {
  appName: string;
  formName: string;
  reportName: string;
}

export interface IApiNota {
  /**
   *
   * @deprecated Uso não recomendado devido a problemas com ZOD. Utilize saveRecord() no lugar.
   */
  insertRecord(
    content: object,
    config: IBaseConfigApi,
    attemptsNumber: number,
  ): Promise<{ result: unknown[] }>;
  saveRecord(
    content: { data: { [key: string]: any } },
    linkNames: Omit<IZohoLinksNames, "reportName">,
  ): Promise<{ result: unknown[] }>;
  saveRecords(
    contents: { data: { [key: string]: any }[] },
    linkNames: Omit<IZohoLinksNames, "reportName">,
  ): Promise<{ result: unknown[] }>;
  uploadFile(data: {
    idCreatedRecord: string;
    app_name: string;
    form_name: string;
    report_name: string;
    field_name: string;
    blob?: Blob | Buffer | Uint8Array | Array<Blob | Buffer | Uint8Array>;
    filePath?: string;
  }): Promise<{ code: number }>;
  findItemsByIds(reportName: string, ids: string[]): Promise<any[]>;
  updateItemsByIds(
    reportName: string,
    content: { data: { [key: string]: string } },
    ids: string[],
  ): Promise<string[]>;
  findAllItems(
    linksNames: Omit<IZohoLinksNames, "formName">,
    criteria?: string,
  ): Promise<{ success: boolean; data: unknown[] }>;
}

const ZohoErrorSchema = z.object({
  data: z.object({
    result: z.array(
      z.object({
        code: z.number(),
        error: z.string(),
      }),
    ),
  }),
});

type ZohoResponseType = z.infer<typeof ZohoErrorSchema>;

const AxiosErrorSchema = z.object({
  response: z.object({
    status: z.number(),
    data: z.any().optional(),
  }),
});

export type ZohoCredentials = {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  grantType: string;
  authBaseUrl: string;
};

export default class ZohoApi implements IApiNota {
  #axios: AxiosInstance = axios;
  #accessToken: string | null = null;
  #credentials: ZohoCredentials;
  constructor(credentials: ZohoCredentials) {
    this.#credentials = credentials;
  }

  static async init(credentials: ZohoCredentials) {
    const attempt = 1;
    const instance = new ZohoApi(credentials);
    await instance.updateTokenWithRetry(attempt, 3);
    return instance;
  }

  async updateToken() {
    if (
      !this.#credentials.refreshToken ||
      !this.#credentials.clientId ||
      !this.#credentials.clientSecret
    ) {
      throw new ZohoGenericError(
        "Missing Zoho credentials",
        "Erro ao atualizar token",
        500,
      );
    }
    const authUrl = `${this.#credentials.authBaseUrl}?client_id=${
      this.#credentials.clientId
    }&client_secret=${this.#credentials.clientSecret}&refresh_token=${
      this.#credentials.refreshToken
    }&grant_type=${this.#credentials.grantType}`;
    try {
      const response = await this.#axios.post(authUrl);
      this.#accessToken = response.data.access_token;
    } catch (error) {
      console.error(`ERROR TOKEN: ${error}`);
      this.#accessToken = null;
    }
  }

  private async updateTokenWithRetry(attempt: number, attemptNumber: number) {
    while (this.#accessToken == null && attempt < attemptNumber) {
      await sleep(1000);
      await this.updateToken();
      attempt++;
    }
  }

  private static isInvalidResponse(res: ZohoResponseType): boolean {
    const errorsResponses = res.data.result.filter(
      (result) => result.code !== 3000,
    );
    if (!errorsResponses.length) {
      console.error("Registros não foram inseridos com sucesso:");
      console.error(errorsResponses);
      return false;
    }
    return true;
  }

  async findAllItems(
    linksNames: Omit<IZohoLinksNames, "formName">,
    criteria?: string,
  ): Promise<{ success: boolean; data: unknown[] }> {
    const url =
      `https://www.zohoapis.com/creator/v2.1/data/guillaumon/` +
      `${linksNames.appName}/report/${linksNames.reportName}`;

    let finalResult: { success: boolean; data: unknown[] } = {
      success: false,
      data: [],
    };

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        // Garante que temos um token antes da requisição
        if (!this.#accessToken) {
          await this.updateTokenWithRetry(0, 3);
        }

        if (!this.#accessToken) {
          throw new Error("accessToken is null");
        }

        console.log(`findAllItems URL: ${url}`);
        console.log(`findAllItems criteria: ${criteria ?? "nenhum"}`);
        console.log(`Tentativa: ${attempt + 1}`);

        const result = await this.#axios.get(url, {
          headers: {
            Authorization: `Zoho-oauthtoken ${this.#accessToken}`,
            Accept: "application/json",
          },
          params: criteria
            ? {
                criteria,
              }
            : undefined,
          timeout: 15000,
        });

        const data = result.data;

        console.log(`findAllItems result: ${JSON.stringify(data)}`);

        if (data.code !== 3000) {
          finalResult = {
            success: false,
            data,
          };
          break;
        }

        finalResult = {
          success: true,
          data: data.data,
        };
        break;
      } catch (error) {
        finalResult = {
          success: false,
          data: [],
        };
      }
    }

    return finalResult;
  }
  //     console.error(
  //       `Erro ao buscar todos os itens (tentativa ${attempt + 1}):`,
  //     );

  //     if (axios.isAxiosError(error)) {
  //       console.error("Status:", error.response?.status);
  //       console.error("Data:", error.response?.data);
  //       console.error("Message:", error.message);

  //       // Token expirado/inválido
  //       if (error.response?.status === 401) {
  //         console.warn("401 recebido. Renovando token do Zoho...");

  //         this.#accessToken = null;

  //         await this.updateTokenWithRetry(0, 3);

  //         if (!this.#accessToken) {
  //           throw new Error(
  //             "Falha ao renovar o token do Zoho após receber 401",
  //           );
  //         }

  //         // Se foi a primeira tentativa, repete a requisição
  //         if (attempt === 0) {
  //           continue;
  //         }
  //       }

  //       // Registro não encontrado
  //       if (error.response?.data?.code === 9280) {
  //         return {
  //           success: false,
  //           data: [],
  //         };
  //       }

  //       // Timeout
  //       if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
  //         throw new Error("Timeout ao buscar itens no Zoho");
  //       }
  //     }

  //     throw error;
  //   }
  // }

  // throw new Error(
  //   "Não foi possível buscar itens após as tentativas disponíveis",
  // );

  async deleteAllRecordsNFeTest(query: string) {
    const requestOptions = {
      headers: {
        Authorization: `Zoho-oauthtoken ${this.#accessToken}`,
        "Content-Type": "application/json",
      },
      data: {
        criteria: `${query}`,
      },
    };

    const url = `https://www.zohoapis.com/creator/v2.1/data/guillaumon/base-notas-qive/report/Copy_of_NFe_Report`;
    try {
      const result = await this.#axios.delete(url, requestOptions);
      return result;
    } catch (error) {
      if (
        axios.isAxiosError(error) &&
        (error.status === 404 || error.response?.status === 404)
      ) {
        console.error(error.response?.data);
        throw new ZohoNotFoundRecords(
          `Erro ao buscar registro: ${error.response?.data}`,
          error,
          404,
        );
      } else {
        throw error;
      }
    }
  }

  async deleteAllRecordsNFSeTest(query: string) {
    const requestOptions = {
      headers: {
        Authorization: `Zoho-oauthtoken ${this.#accessToken}`,
        "Content-Type": "application/json",
      },
      data: {
        criteria: `${query}`,
      },
    };

    const url = `https://www.zohoapis.com/creator/v2.1/data/guillaumon/base-notas-qive/report/Copy_of_NFSe_Report`;
    try {
      const result = await this.#axios.delete(url, requestOptions);
      return result;
    } catch (error) {
      if (
        axios.isAxiosError(error) &&
        (error.status === 404 || error.response?.status === 404)
      ) {
        console.error(error.response?.data);
        throw new ZohoNotFoundRecords(
          `Erro ao buscar registro: ${error.response?.data}`,
          error,
          404,
        );
      } else {
        throw error;
      }
    }
  }

  async findItemsByIds(reportName: string, ids: string[]) {
    const requestOptions = {
      headers: {
        Authorization: `Zoho-oauthtoken ${this.#accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    };
    const results = [];
    for await (const id of ids) {
      const url = `https://www.zohoapis.com/creator/v2.1/data/guillaumon/base-notas-qive/report/${reportName}/${id}`;
      const result = await this.#axios.get(url, requestOptions);
      if (result.data.code === 3000) {
        results.push(...result.data.data);
      }
    }
    return results;
  }

  async updateItemsByIds(
    reportName: string,
    content: { data: { [key: string]: string } },
    ids: string[],
  ) {
    try {
      const requestOptions = {
        headers: {
          Authorization: `Zoho-oauthtoken ${this.#accessToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      };
      const results: string[] = [];
      for await (const id of ids) {
        const url = `https://www.zohoapis.com/creator/v2.1/data/guillaumon/base-notas-qive/report/${reportName}/${id}`;
        const result = await this.#axios.patch(url, content, requestOptions);
        const data = result.data as {
          code: number;
          data: { ID: string };
          message: string;
        };
        console.log(`Update Zoho ID ${id}: ${JSON.stringify(data)}`);
        if (data.code === 3000) {
          results.push(data.data.ID);
        }
      }
      return results;
    } catch (error) {
      console.error("Erro ao atualizar itens por IDs:");
      if (axios.isAxiosError(error)) {
        console.log(error.response?.data);
        throw error;
      }
      console.error(error);
      throw error;
    }
  }

  async updateItemsByIdsWithCriteria(
    reportName: string,
    contents: { criteria: string; data: { [key: string]: string } }[],
  ) {
    try {
      const requestOptions = {
        headers: {
          Authorization: `Zoho-oauthtoken ${this.#accessToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      };
      const results: string[] = [];
      const url = `https://www.zohoapis.com/creator/v2.1/data/guillaumon/base-notas-qive/report/${reportName}`;
      for await (const [index, content] of contents.entries()) {
        console.log(`Item numero ${index + 1} de ${contents.length}`);
        const result = await this.#axios.patch(url, content, requestOptions);
        const data = result.data as {
          result: [
            {
              code: number;
              data: { ID: string };
              message: string;
            },
          ];
        };
        console.log(`Update Zoho Item ${index + 1}: ${JSON.stringify(data)}`);
        if (
          Object.keys(data).length > 0 &&
          data &&
          data.result[0].code &&
          data.result[0].code === 3000
        ) {
          results.push(data.result[0].data.ID);
        }
      }
      return results;
    } catch (error) {
      console.error("Erro ao atualizar itens por IDs:");
      console.error(JSON.stringify(error, null, 2));
      if (axios.isAxiosError(error)) {
        console.log(error.response?.data);
        throw error;
      }
      console.error(error);
      throw error;
    }
  }

  async getRecordByField(
    reportName: string,
    field: { key: string; value: string },
  ) {
    const requestOptions = {
      headers: {
        Authorization: `Zoho-oauthtoken ${this.#accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    };
    const url = `https://www.zohoapis.com/creator/v2.1/data/guillaumon/base-notas-qive/report/${reportName}?${field.key}=${field.value}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    const result = await this.#axios.get(url, {
      ...requestOptions,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return result;
  }
  /**
   *
   * @deprecated Uso não recomendado devido a problemas com ZOD. Utilize saveRecord() no lugar.
   */
  async insertRecord(
    content: object,
    config: IBaseConfigApi,
    attemptsNumber: number,
  ): Promise<{ result: unknown[] }> {
    const attempt = 0;
    if (!this.#accessToken) {
      await this.updateTokenWithRetry(attempt, attemptsNumber);
    }
    if (!this.#accessToken) {
      throw new Error("accessToken is null");
    }
    const url = `https://www.zohoapis.com/creator/v2.1/data/guillaumon/${config.tableName}/form/${config.formName}`;

    const requestOptions = {
      headers: {
        Authorization: `Zoho-oauthtoken ${this.#accessToken}`,
        "Content-Type": "application/json",
      },
    };
    try {
      const res = await this.#axios.post(url, content, requestOptions);
      if (ZohoApi.isInvalidResponse(res)) {
        throw new InsertZohoError(
          "Algum item não retornou 3000:",
          res.data,
          500,
        );
      }
      return res.data as { result: unknown[] };
    } catch (e: unknown) {
      console.error("Erro ao inserir registro no Zoho:");
      //@ts-ignore
      console.error(e.data.result);
      if (axios.isAxiosError(e)) {
        console.error(e.response?.data);
        throw e;
      }
      const parsed = ZohoErrorSchema.safeParse(e);
      if (parsed.success) {
        parsed.data.data.result.forEach((err) => {
          if (err.code !== 3000) {
            throw new InsertZohoError("Erro ao salvar no Zoho", err, 400);
          }
        });
      } else {
        console.error("Zod validation erro:");
        console.error(parsed.error);
        throw new Error(
          `Zod error, verifique o nome da tabela: ${JSON.stringify(
            parsed.error,
          )}`,
        );
      }
      const axiosParsed = AxiosErrorSchema.safeParse(e);
      if (axiosParsed.success) {
        const error = axiosParsed.data;
        if (error?.response.status === 401) {
          await this.updateTokenWithRetry(attempt, attemptsNumber);
          if (this.#accessToken === null) throw new Error("Erro 401");
        }
      }
      throw e;
    }
  }

  async saveRecord(
    content: { data: { [key: string]: any } },
    linkNames: Omit<IZohoLinksNames, "reportName">,
  ): Promise<{ result: unknown[] }> {
    const attempt = 0;
    if (!this.#accessToken) {
      await this.updateTokenWithRetry(attempt, 3);
    }
    if (!this.#accessToken) {
      throw new Error("accessToken is null");
    }
    const url = `https://www.zohoapis.com/creator/v2.1/data/guillaumon/${linkNames.appName}/form/${linkNames.formName}`;

    const requestOptions = {
      headers: {
        Authorization: `Zoho-oauthtoken ${this.#accessToken}`,
        "Content-Type": "application/json",
      },
    };
    try {
      const res = await this.#axios.post(url, content, requestOptions);
      return res.data as { result: unknown[] };
    } catch (e: unknown) {
      if (axios.isAxiosError(e)) {
        console.error(e.response?.data);
        throw e;
      }
      console.error("Erro inesperado:");
      console.error(e);
      throw e;
    }
  }

  async saveRecords(
    contents: { data: { [key: string]: any }[] },
    linkNames: Omit<IZohoLinksNames, "reportName">,
  ): Promise<{ result: unknown[] }> {
    const attempt = 0;
    if (!this.#accessToken) {
      await this.updateTokenWithRetry(attempt, 3);
    }
    if (!this.#accessToken) {
      throw new Error("accessToken is null");
    }
    const url = `https://www.zohoapis.com/creator/v2.1/data/guillaumon/${linkNames.appName}/form/${linkNames.formName}`;

    const requestOptions = {
      headers: {
        Authorization: `Zoho-oauthtoken ${this.#accessToken}`,
        "Content-Type": "application/json",
      },
    };
    try {
      const res = await this.#axios.post(url, contents, requestOptions);
      console.log(`Resutado record salvo: `);
      console.log(res);
      const resultVerificationZohoReq = this.verifyErrorZohoReq(res.data);
      if (resultVerificationZohoReq.hasError) {
        const errorMessage = resultVerificationZohoReq.errorValue.toString();
        console.error(errorMessage);
        throw new Error(errorMessage);
      }
      return res.data as { result: unknown[] };
    } catch (e: unknown) {
      if (axios.isAxiosError(e)) {
        console.error(e.response?.data);
        throw e;
      }
      console.error("Erro inesperado:");
      console.error(e);
      throw e;
    }
  }

  private verifyErrorZohoReq(dataResult: {
    code: number;
    result: [{ code: number; error: string[] }];
  }): {
    hasError: boolean;
    errorValue: string[];
  } {
    if (dataResult.code != 3000) return { hasError: false, errorValue: [] };
    const hasError = dataResult.result.some((r) => r.code != 3000);
    if (!hasError) {
      return { hasError, errorValue: [""] };
    }
    const errors = dataResult.result.flatMap((r) => r.error);
    return { hasError: true, errorValue: errors };
  }

  public async uploadFile(data: {
    idCreatedRecord: string;
    app_name: string;
    report_name: string;
    field_name: string;
    buffer?: Blob | Buffer | Uint8Array | Array<Blob | Buffer | Uint8Array>;
  }) {
    if (!this.#accessToken) {
      throw new Error("accessToken is null ao fazer upload de arquivo");
    }
    const url = `https://www.zohoapis.com/creator/v2.1/data/guillaumon/${data.app_name}/report/${data.report_name}/${data.idCreatedRecord}/${data.field_name}/upload`;
    if (!Buffer.isBuffer(data.buffer)) {
      console.error(data);

      throw new Error("Buffer inválido para upload");
    }
    try {
      let formData = new FormData();
      formData.append("file", Readable.from([data.buffer]), {
        filename: `${data.idCreatedRecord}.pdf`,
        contentType: "application/pdf",
      });
      let config = {
        method: "post",
        maxBodyLength: Infinity,
        url: url,
        headers: {
          Authorization: `Zoho-oauthtoken ${this.#accessToken}`,
          ...formData.getHeaders(),
        },
        data: formData,
      };
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      const response = await axios.request({
        ...config,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      console.log(
        `Buffer criado para a nota ${data.idCreatedRecord}: ${data.buffer.length} bytes`,
      );
      console.log(
        `Resposta do id da nota ${data.idCreatedRecord} upload Zoho:`,
      );
      console.log(JSON.stringify(response.data));

      if (response.data?.code && response.data.code !== 3000) {
        throw new Error(`Erro Zoho: ${JSON.stringify(response.data)}`);
      }

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Axios error:", error.message);
        console.error("Status:", error.response?.status);
        console.error("Data:", error.response?.data);
      } else {
        console.error("Erro genérico no upload:", error);
      }
      throw error;
    }
  }

  private async resolveUploadBuffer(data: {
    blob?: Blob | Buffer | Uint8Array | Array<Blob | Buffer | Uint8Array>;
    filePath?: string;
  }): Promise<{ buffer: Buffer; filename: string }> {
    if (data.filePath || !data.blob) {
      const candidatePath = data.filePath
        ? data.filePath
        : path.resolve(process.cwd(), "mapa_we193.pdf");
      const absolutePath = path.isAbsolute(candidatePath)
        ? candidatePath
        : path.resolve(process.cwd(), candidatePath);
      const bufferFromFile = await fs.readFile(absolutePath);
      return {
        buffer: bufferFromFile,
        filename: path.basename(absolutePath),
      };
    }

    const source = Array.isArray(data.blob) ? data.blob[0] : data.blob;
    const buffer = await this.convertToBuffer(source);
    return { buffer, filename: "nota.pdf" };
  }

  private async convertToBuffer(
    value: Blob | Buffer | Uint8Array,
  ): Promise<Buffer> {
    if (Buffer.isBuffer(value)) {
      return value;
    }
    if (value instanceof Uint8Array) {
      return Buffer.from(value);
    }
    if (value instanceof Blob) {
      return Buffer.from(await value.arrayBuffer());
    }
    throw new Error("Tipo de arquivo para upload não suportado");
  }
}
