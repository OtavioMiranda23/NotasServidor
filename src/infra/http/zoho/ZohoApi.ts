import axios from "axios";
import type { AxiosInstance } from "axios";
import { z } from "zod";
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
import { log } from "node:console";
// import htmlPdf from "html-pdf-node";

export interface IBaseConfigApi {
  tableName: string;
  formName: string;
}

export interface IApiNota {
  insertRecord(
    content: object,
    config: IBaseConfigApi,
    attemptsNumber: number
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
}

const ZohoErrorSchema = z.object({
  data: z.object({
    result: z.array(
      z.object({
        code: z.number(),
        error: z.string(),
      })
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
        500
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
      (result) => result.code !== 3000
    );
    if (!errorsResponses.length) {
      console.error("Registros não foram inseridos com sucesso:");
      console.error(errorsResponses);
      return false;
    }
    return true;
  }

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
          404
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
          404
        );
      } else {
        throw error;
      }
    }
  }

  async getRecordByField(
    reportName: string,
    field: { key: string; value: string }
  ) {
    const requestOptions = {
      headers: {
        Authorization: `Zoho-oauthtoken ${this.#accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    };
    const url = `https://www.zohoapis.com/creator/v2.1/data/guillaumon/base-notas-qive/report/${reportName}?${field.key}=${field.value}`;
    const result = await this.#axios.get(url, requestOptions);
    return result;
  }

  async insertRecord(
    content: object,
    config: IBaseConfigApi,
    attemptsNumber: number
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
          500
        );
      }
      return res.data as { result: unknown[] };
    } catch (e: unknown) {
      if (axios.isAxiosError(e)) {
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
            parsed.error
          )}`
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
      const response = await axios.request(config);
      console.log("------------------------");
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
    value: Blob | Buffer | Uint8Array
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
