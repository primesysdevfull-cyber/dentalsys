export interface NfeEmitParams {
  cpfCnpj: string;
  nome: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  telefone?: string;
  email?: string;
  valor: number;
  descricao: string;
  quantidade?: number;
}

export interface NfeEmitResult {
  success: boolean;
  nfeKey?: string;
  nfeNumber?: string;
  xmlUrl?: string;
  danfeUrl?: string;
  providerResponse?: any;
  errorMessage?: string;
}

export interface NfeCancelParams {
  nfeKey: string;
  reason: string;
}

export interface NfeProviderInterface {
  emitir(params: NfeEmitParams): Promise<NfeEmitResult>;
  cancelar(params: NfeCancelParams): Promise<{ success: boolean; errorMessage?: string }>;
  consultar(nfeKey: string): Promise<{ status: string; providerResponse?: any }>;
}
