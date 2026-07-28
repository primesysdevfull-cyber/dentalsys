import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'DentalSys API - Sistema de Gestão para Clínica Odontológica';
  }
}
