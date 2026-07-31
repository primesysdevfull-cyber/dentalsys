import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PatientsModule } from './modules/patients/patients.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { ClinicalRecordsModule } from './modules/medical-records/clinical-records.module';
import { BillingModule } from './modules/billing/billing.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { ReportsModule } from './modules/reports/reports.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { MercadoPagoModule } from './modules/mercadopago/mercadopago.module';
import { ProceduresModule } from './modules/procedures/procedures.module';
import { RoomsModule } from './modules/rooms/rooms.module';
import { ProfessionalsModule } from './modules/professionals/professionals.module';
import { NfeModule } from './modules/nfe/nfe.module';
import { InsurancesModule } from './modules/insurances/insurances.module';
import { PrivacyModule } from './modules/privacy/privacy.module';
import { LabModule } from './modules/lab/lab.module';
import { AiModule } from './modules/ai/ai.module';
import { OnlineBookingModule } from './modules/online-booking/online-booking.module';
import { CashFlowModule } from './modules/cash-flow/cash-flow.module';
import { CommissionsModule } from './modules/commissions/commissions.module';
import { RecallModule } from './modules/recall/recall.module';
import { MigrationModule } from './modules/migration/migration.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    TenantsModule,
    PatientsModule,
    AppointmentsModule,
    ClinicalRecordsModule,
    BillingModule,
    InventoryModule,
    ReportsModule,
    NotificationsModule,
    UploadsModule.register(),
    PaymentsModule,
    MercadoPagoModule,
    ProceduresModule,
    RoomsModule,
    ProfessionalsModule,
    NfeModule,
    InsurancesModule,
    PrivacyModule,
    LabModule,
    AiModule,
    OnlineBookingModule,
    MigrationModule,
    RecallModule,
    CashFlowModule,
    CommissionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
