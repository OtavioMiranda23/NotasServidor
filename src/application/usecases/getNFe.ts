import QiveApi, {
  CredentialsQive,
  DataNFe,
} from "../../infra/http/qive/QiveApi";
import { IApiNota, IBaseConfigApi } from "../../infra/http/zoho/ZohoApi";
import CreateImage from "./createImage";

export default class GetNFe {
  private zoho: IApiNota;
  private credentials: CredentialsQive;
  private successConfig: IBaseConfigApi;

  constructor(
    zoho: IApiNota,
    credentials: CredentialsQive,
    successConfig: IBaseConfigApi
  ) {
    this.zoho = zoho;
    this.credentials = credentials;
    this.successConfig = successConfig;
  }

  public async execute(dataNFe: DataNFe, errorConfig: IBaseConfigApi) {
    const createImage = new CreateImage();
    const qive = new QiveApi(
      this.zoho,
      createImage,
      this.credentials,
      this.successConfig
    );
    const result = await qive.getReceivesNFe(dataNFe, errorConfig);
    return result;
  }
}
