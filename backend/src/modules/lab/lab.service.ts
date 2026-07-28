import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLabOrderDto, UpdateLabOrderDto, ImportExamDto } from './dto/lab.dto';

@Injectable()
export class LabService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, status?: string, type?: string) {
    const where: any = { tenantId };
    if (status) where.status = status;
    if (type === 'import') where.isImport = true;
    else if (type === 'order') where.isImport = false;
    return this.prisma.labOrder.findMany({
      where,
      include: {
        patient: { select: { id: true, name: true } },
        professional: { select: { id: true, name: true } },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const order = await this.prisma.labOrder.findFirst({
      where: { id, tenantId },
      include: { patient: { select: { id: true, name: true } }, professional: { select: { id: true, name: true } }, items: true },
    });
    if (!order) throw new NotFoundException('Pedido de laboratório não encontrado');
    return order;
  }

  async create(tenantId: string, dto: CreateLabOrderDto) {
    const { items, ...data } = dto;
    return this.prisma.labOrder.create({
      data: {
        tenantId,
        ...data,
        deliveryDate: dto.deliveryDate ? new Date(dto.deliveryDate) : null,
        items: items ? { create: items.map((i) => ({ ...i, quantity: i.quantity || 1 })) } : undefined,
      },
      include: { patient: { select: { id: true, name: true } }, professional: { select: { id: true, name: true } }, items: true },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateLabOrderDto) {
    await this.findOne(tenantId, id);
    return this.prisma.labOrder.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.status && { status: dto.status as any }),
        ...(dto.deliveryDate && { deliveryDate: new Date(dto.deliveryDate) }),
        ...(dto.totalCost !== undefined && { totalCost: dto.totalCost }),
      },
      include: { patient: { select: { id: true, name: true } }, professional: { select: { id: true, name: true } }, items: true },
    });
  }

  async importExam(tenantId: string, dto: ImportExamDto, file?: Express.Multer.File) {
    let fileUrl = dto.fileUrl;
    let fileName = dto.fileName;

    if (file) {
      const uploadDir = require('path').join(process.cwd(), 'uploads', 'lab');
      require('fs').mkdirSync(uploadDir, { recursive: true });
      const ext = require('path').extname(file.originalname);
      const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
      require('fs').writeFileSync(require('path').join(uploadDir, name), file.buffer);
      fileUrl = `/uploads/lab/${name}`;
      fileName = file.originalname;
    }

    return this.prisma.labOrder.create({
      data: {
        tenantId,
        patientId: dto.patientId,
        professionalId: dto.professionalId || null,
        labName: dto.labName,
        examType: dto.examType,
        fileUrl,
        fileName,
        examDate: dto.examDate ? new Date(dto.examDate) : null,
        notes: dto.notes,
        status: 'COMPLETED',
        isImport: true,
        totalCost: 0,
        items: {
          create: { description: `Exame: ${dto.examType}` },
        },
      },
      include: {
        patient: { select: { id: true, name: true } },
        professional: { select: { id: true, name: true } },
        items: true,
      },
    });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    await this.prisma.labOrder.delete({ where: { id } });
    return { message: 'Pedido removido com sucesso' };
  }
}
