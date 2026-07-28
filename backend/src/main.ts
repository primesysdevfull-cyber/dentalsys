import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });
  const configService = app.get(ConfigService);

  app.use(helmet());

  app.enableCors({
    origin: configService.get<string>('CORS_ORIGINS')?.split(',') || ['http://localhost:5173'],
    credentials: true,
  });

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('DentalSys API')
    .setDescription('API do Sistema de Gestão para Clínica Odontológica SaaS')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Autenticação e autorização')
    .addTag('users', 'Gestão de usuários')
    .addTag('patients', 'Gestão de pacientes')
    .addTag('appointments', 'Agendamentos')
    .addTag('clinical-records', 'Prontuário eletrônico')
    .addTag('odontogram', 'Odontograma digital')
    .addTag('treatment-plans', 'Planos de tratamento')
    .addTag('billing', 'Gestão financeira')
    .addTag('inventory', 'Gestão de estoque')
    .addTag('reports', 'Relatórios e indicadores')
    .addTag('notifications', 'Notificações e mensagens')
    .addTag('uploads', 'Upload e armazenamento de arquivos')
    .addTag('procedures', 'Catálogo de procedimentos odontológicos (CDT)')
    .addTag('rooms', 'Gestão de salas e consultórios')
    .addTag('professionals', 'Gestão de profissionais e comissões')
    .addTag('payments', 'Pagamentos online (Stripe)')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get<number>('APP_PORT') || 3000;
  await app.listen(port);
  console.log(`🦷 DentalSys API running on: http://localhost:${port}`);
  console.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
}
bootstrap();
