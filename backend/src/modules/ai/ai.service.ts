import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { TranscribeAudioDto, GenerateClinicalSuggestionDto } from './dto/ai.dto';

@Injectable()
export class AiService {
  private openaiApiKey: string | null;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.openaiApiKey = this.config.get('OPENAI_API_KEY') || null;
  }

  async transcribe(tenantId: string, userId: string, dto: TranscribeAudioDto) {
    const transcription = await this.prisma.aiTranscription.create({
      data: {
        tenantId,
        userId,
        clinicalRecordId: dto.clinicalRecordId,
        audioUrl: dto.audioUrl,
        durationSeconds: dto.durationSeconds,
        originalText: 'Transcrição simulada: Paciente relatou dor no dente 26. Procedimento de restauração realizado sem intercorrências.',
        processedText: 'Paciente submetido a restauração no dente 26. Queixa de dor prévia. Procedimento concluído com sucesso.',
        summary: 'Restauração dente 26 - sucesso',
        suggestions: [
          { type: 'diagnosis', text: 'Cárie dentária (K02)' },
          { type: 'procedure', text: 'Restauração de dente permanente' },
          { type: 'next', text: 'Retorno em 6 meses para revisão' },
        ],
        model: 'whisper-1',
        status: 'COMPLETED',
      },
    });

    return transcription;
  }

  async generateSuggestion(tenantId: string, dto: GenerateClinicalSuggestionDto) {
    const patient = await this.prisma.patient.findFirst({
      where: { id: dto.patientId, tenantId },
      select: { id: true, name: true, birthDate: true },
    });
    if (!patient) throw new BadRequestException('Paciente não encontrado');

    const age = patient.birthDate
      ? Math.floor((Date.now() - new Date(patient.birthDate).getTime()) / 31557600000)
      : 'N/A';

    const diagnoses = [
      'Cárie de dentina (CID K02.1)',
      'Pulpite irreversível (CID K04.0)',
      'Doença periodontal crônica (CID K05.3)',
      'Abscesso periapical (CID K04.7)',
      'Lesão de erosão dental (CID K03.2)',
      'Sensibilidade dentinária generalizada (CID K03.8)',
      'Gengivite induzida por placa (CID K05.1)',
      'Fratura coronária não complicada (CID S02.5)',
    ];

    const prescriptions = [
      'Analgésico se dor (Paracetamol 750mg 6/6h por 3 dias)',
      'Anti-inflamatório (Ibuprofeno 600mg 8/8h por 5 dias) + bochecho com clorexidina 0,12% 12/12h por 7 dias',
      'Amoxicilina 500mg 8/8h por 7 dias + Paracetamol 750mg se dor',
      'Bochecho com flúor 0,05% diário ao deitar + pasta dental com flúor 1450ppm',
      'Nimesulida 100mg 12/12h por 3 dias + compressa fria nas primeiras 24h',
      'Prescrição: Óleo de cravo (eugenol) tópico no dente afetado se dor + retorno em 24h',
    ];

    const diagIndex = (patient.name.length + (dto.notes?.length || 0)) % diagnoses.length;
    const prescIndex = (dto.notes?.length || 0 + (dto.procedureName?.length || 0)) % prescriptions.length;

    return {
      suggestedDiagnosis: diagnoses[diagIndex],
      suggestedProcedure: dto.procedureName || 'Restauração com resina composta',
      suggestedPrescription: prescriptions[prescIndex],
      suggestedObservations: dto.notes
        ? `Paciente ${patient.name}, ${age} anos. ${dto.notes}. Procedimento proposto: ${dto.procedureName || 'avaliação'}. Conduta definida conforme quadro clínico.`
        : `Paciente ${patient.name}, ${age} anos. Procedimento realizado sem intercorrências. Boa evolução.`,
      aiModel: 'gpt-4 (simulado)',
      disclaimer: 'Sugestão gerada por IA. Revise antes de registrar.',
    };
  }

  async listTranscriptions(tenantId: string) {
    return this.prisma.aiTranscription.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, name: true } } },
    });
  }
}
