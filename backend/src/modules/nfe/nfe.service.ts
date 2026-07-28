import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BlingService } from './providers/bling.service';
import { TinyService } from './providers/tiny.service';
import { NfeProviderInterface } from './interfaces/nfe-provider.interface';

@Injectable()
export class NfeService {
  constructor(
    private prisma: PrismaService,
    private blingService: BlingService,
    private tinyService: TinyService,
  ) {}

  private getProvider(providerName: string): NfeProviderInterface {
    switch (providerName) {
      case 'BLING': return this.blingService;
      case 'TINY': return this.tinyService;
      default: throw new BadRequestException(`Provedor NF-e inválido: ${providerName}`);
    }
  }

  async emitir(tenantId: string, transactionId: string, providerName?: string) {
    const transaction = await this.prisma.financialTransaction.findFirst({
      where: { id: transactionId, tenantId },
      include: { patient: true },
    });
    if (!transaction) throw new NotFoundException('Transação não encontrada');
    if (transaction.status !== 'PAID') throw new BadRequestException('Apenas transações pagas podem emitir NF-e');

    const config = await this.prisma.nfeConfig.findFirst({
      where: {
        tenantId,
        ...(providerName ? { provider: providerName as any } : {}),
        isActive: true,
      },
    });
    if (!config) {
      throw new NotFoundException(
        providerName
          ? `Configuração ${providerName} não encontrada ou inativa`
          : 'Nenhuma configuração NF-e ativa encontrada. Configure Bling ou Tiny primeiro.',
      );
    }

    const patient = transaction.patient;
    if (!patient?.cpf) throw new BadRequestException('Paciente não possui CPF cadastrado');

    const provider = this.getProvider(config.provider);
    const result = await provider.emitir({
      cpfCnpj: patient.cpf,
      nome: patient.name,
      endereco: patient.address || '',
      cidade: patient.city || '',
      estado: patient.state || '',
      cep: patient.zipCode || '',
      telefone: patient.phone || '',
      email: patient.email || '',
      valor: Number(transaction.totalAmount),
      descricao: transaction.description,
    });

    const invoice = await this.prisma.nfeInvoice.create({
      data: {
        tenantId,
        nfeConfigId: config.id,
        transactionId: transaction.id,
        provider: config.provider,
        status: result.success ? 'ISSUED' : 'ERROR',
        nfeKey: result.nfeKey,
        nfeNumber: result.nfeNumber,
        xmlUrl: result.xmlUrl,
        danfeUrl: result.danfeUrl,
        providerResponse: result.providerResponse,
        errorMessage: result.errorMessage,
        issuedAt: result.success ? new Date() : null,
      },
    });

    return invoice;
  }

  async cancelar(tenantId: string, invoiceId: string, reason: string) {
    const invoice = await this.prisma.nfeInvoice.findFirst({
      where: { id: invoiceId, tenantId },
    });
    if (!invoice) throw new NotFoundException('Nota fiscal não encontrada');
    if (invoice.status !== 'ISSUED') throw new BadRequestException('Nota fiscal não está emitida');
    if (!invoice.nfeKey) throw new BadRequestException('Nota fiscal sem chave para cancelamento');

    const config = await this.prisma.nfeConfig.findFirst({
      where: { tenantId, provider: invoice.provider },
    });
    if (!config) throw new NotFoundException('Configuração do provedor não encontrada');

    const provider = this.getProvider(invoice.provider);
    const result = await provider.cancelar({ nfeKey: invoice.nfeKey, reason });

    return this.prisma.nfeInvoice.update({
      where: { id: invoiceId },
      data: {
        status: result.success ? 'CANCELLED' : 'ERROR',
        cancelReason: reason,
        cancelledAt: result.success ? new Date() : null,
        errorMessage: result.errorMessage,
      },
    });
  }

  async listar(tenantId: string, transactionId?: string) {
    const where: any = { tenantId };
    if (transactionId) where.transactionId = transactionId;

    return this.prisma.nfeInvoice.findMany({
      where,
      include: {
        transaction: {
          select: { id: true, description: true, totalAmount: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async consultar(tenantId: string, invoiceId: string) {
    const invoice = await this.prisma.nfeInvoice.findFirst({
      where: { id: invoiceId, tenantId },
    });
    if (!invoice) throw new NotFoundException('Nota fiscal não encontrada');
    if (!invoice.nfeKey) throw new NotFoundException('Nota fiscal sem chave de consulta');

    const config = await this.prisma.nfeConfig.findFirst({
      where: { tenantId, provider: invoice.provider },
    });
    if (!config) throw new NotFoundException('Configuração do provedor não encontrada');

    const provider = this.getProvider(invoice.provider);
    const result = await provider.consultar(invoice.nfeKey);

    return result;
  }
}
