// Type para o objeto de endereço (usado para Prestador e Tomador)
export type Endereco = {
  address_line_1: string;
  address_line_2: string;
  district_city: string;
  state_province: string;
  postal_Code: string;
  country: string;
};

// Type para o retorno de cada item processado na função getValuesNFSe
export type NFSeProcessada = {
  IdNota: string;
  Tipo: "nfse";
  Numero: string;
  CodigoVerificacao: string;
  DataEmissao: string;
  ValorCredito: string;
  BaseCalculo: string;
  Aliquota: string;
  ValorIss: string;
  PrestadorServicoCnpj: string;
  PrestadorServicoCPF: string;
  IdentificacaoPrestadorInscricaoMunicipal: string;
  PrestadorServicoRazaoSocial: string;
  PrestadorServicoEndereco: Endereco;
  PrestadorServicoEmail: string | undefined;
  RpsNumero: string | undefined;
  RpsSerie: string | undefined;
  RpsTipo: string | undefined;
  RpsDataEmissao: string | undefined;
  RpsStatus: string | undefined;
  Competencia: string;
  ServicoValores: any;
  IssRetido: any;
  ItemListaServico: string;
  ItemListaServicoDescricao: string | undefined;
  Discriminacao: string;
  ExigibilidadeISS: string;
  CodigoMunicipio: string;
  NomeMunicipio: string;
  MunicipioIncidencia: string;
  NomeMunicipioIncidencia: string | undefined;
  PrestadorCpnj: string;
  PrestadorCpf: string;
  PrestadorInscricaoMunicipal: string;
  TomadorCnpj: string;
  TomadorCpf: string;
  TomadorInscricaoMunicipal: string;
  TomadorRazaoSocial: string;
  TomadorEndereco: Endereco;
  TomadorEmail: string | null;
  OptanteSimplesNacional: string;
  IncentivoFiscal: string;
};

// Type para o parâmetro de entrada (dados do XML)
export type NFSeRaw = {
  id: string;
  xml: {
    Nfse: {
      InfNfse: {
        Numero: string;
        CodigoVerificacao: string;
        DataEmissao: string;
        ValorCredito: string;
        ValoresNfse: {
          BaseCalculo: string;
          Aliquota: string;
          ValorIss: string;
        };
        PrestadorServico: {
          RazaoSocial: string;
          IdentificacaoPrestador: {
            CpfCnpj: { Cnpj: string; Cpf: string };
            InscricaoMunicipal: string;
          };
          Endereco: {
            Endereco: string;
            Numero: string;
            Complemento: string;
            Bairro: string;
            Uf: string;
            Cep: string;
          };
          Contato?: { Email: string };
        };
        DeclaracaoPrestacaoServico: {
          Competencia: string;
          OptanteSimplesNacional: string;
          IncentivoFiscal: string;
          InfDeclaracaoPrestacaoServico: {
            Rps?: {
              IdentificacaoRps: {
                Numero: string;
                Serie: string;
                Tipo: string;
              };
              DataEmissao: string;
              Status: string;
            };
            Servico: {
              ItemListaServico: string;
              Valores: any;
              IssRetido: any;
              Discriminacao: string;
              ExigibilidadeISS: string;
              CodigoMunicipio: string;
              MunicipioIncidencia: string;
            };
            Prestador: {
              CpfCnpj: { Cnpj: string; Cpf: string };
              InscricaoMunicipal: string;
            };
            Tomador: {
              RazaoSocial: string;
              IdentificacaoTomador: {
                CpfCnpj: { Cnpj: string; Cpf: string };
                InscricaoMunicipal: string;
              };
              Endereco: {
                Endereco: string;
                Numero: string;
                Bairro: string;
                CodigoMunicipio: string;
                Uf: string;
                Cep: string;
              };
              Contato?: { Email: string };
            };
          };
        };
      };
    };
  };
};
