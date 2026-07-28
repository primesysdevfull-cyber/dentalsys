import { Injectable } from '@nestjs/common';
import { NfeProviderInterface, NfeEmitParams, NfeEmitResult, NfeCancelParams } from '../interfaces/nfe-provider.interface';

@Injectable()
export class TinyService implements NfeProviderInterface {
  private baseUrl = 'https://api.tiny.com.br/api2';

  async emitir(params: NfeEmitParams): Promise<NfeEmitResult> {
    return {
      success: true,
      nfeKey: `tiny-${Date.now()}`,
      nfeNumber: String(Date.now()).slice(-9),
      providerResponse: { simulated: true, params },
    };
  }

  async cancelar(params: NfeCancelParams): Promise<{ success: boolean; errorMessage?: string }> {
    return { success: true };
  }

  async consultar(nfeKey: string): Promise<{ status: string; providerResponse?: any }> {
    return { status: 'ISSUED', providerResponse: { nfeKey } };
  }
}
