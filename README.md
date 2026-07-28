# DentalSys - Sistema SaaS para Clínica Odontológica

Sistema completo de gestão para clínica odontológica, modelado como SaaS (Software as a Service) com multi-tenancy.

## Funcionalidades

### Core
- **Gestão de Pacientes** - Cadastro completo com histórico médico, convênios, anexos e responsáveis legais
- **Agendamento** - Calendário visual, validação de conflitos, confirmação automática
- **Prontuário Eletrônico** - Registros detalhados de atendimento
- **Odontograma Digital** - Mapeamento interativo dos 32 dentes
- **Planos de Tratamento** - Etapas, custos e previsões personalizados
- **Gestão Financeira** - Receitas, despesas, parcelamentos, inadimplência
- **Gestão de Estoque** - Alertas de estoque baixo e validade
- **Relatórios** - Indicadores de desempenho, ocupação e receita
- **Multi-tenancy** - Cada clínica é um tenant isolado
- **Segurança** - JWT + 2FA, conformidade com LGPD
- **Controle de Acesso** - Perfis: Admin, Dentista, Assistente, Recepcionista, Financeiro

### Novos Módulos
- **WhatsApp/SMS/Email** - Confirmação automática de agendamentos via Evolution API, Twilio e Nodemailer
- **Upload de Arquivos** - Armazenamento em MinIO/S3 ou local, com validação de tipos e tamanho
- **Pagamentos Online** - Integração com Stripe para checkout, webhooks e assinaturas SaaS
- **Notificações** - Sistema de notificações in-app + envio automático de lembretes
- **App Mobile** - Aplicativo React Native (Expo) paraAndroid e iOS

## Stack Tecnológica

### Backend
- **Runtime:** Node.js + TypeScript
- **Framework:** NestJS
- **ORM:** Prisma
- **Banco:** PostgreSQL
- **Auth:** JWT + Passport + TOTP (2FA)
- **Docs:** Swagger/OpenAPI
- **WhatsApp:** Evolution API
- **SMS:** Twilio
- **Email:** Nodemailer (SMTP)
- **Pagamentos:** Stripe
- **Storage:** MinIO / AWS S3

### Frontend (Web)
- **Framework:** React 18 + TypeScript
- **Bundler:** Vite
- **UI:** Tailwind CSS + Radix UI
- **State:** React Query (TanStack)
- **Forms:** React Hook Form + Zod
- **Router:** React Router v6

### Mobile
- **Framework:** React Native (Expo SDK 50)
- **Navigation:** React Navigation 6
- **State:** React Query + AsyncStorage
- **Plataformas:** Android + iOS

### Infraestrutura
- **Containerização:** Docker + Docker Compose
- **Proxy:** Nginx
- **Banco:** PostgreSQL 16
- **Object Storage:** MinIO (compatível S3)
- **WhatsApp:** Evolution API

## Início Rápido

### Pré-requisitos
- Node.js 20+
- PostgreSQL 16+
- Docker + Docker Compose (recomendado)

### Setup com Docker (Recomendado)

```bash
# Subir todos os serviços
docker-compose up -d

# Rodar migrations e seed
docker exec -it dental_sys_api npx prisma migrate dev
docker exec -it dental_sys_api npx prisma db seed

# App Mobile
cd mobile
npm install
npx expo start
```

### Setup Manual

```bash
# Backend
cd backend
npm install
cp .env.example .env
# Configurar variáveis no .env
npx prisma migrate dev
npx prisma db seed
npm run start:dev

# Frontend (outra aba)
cd frontend
npm install
npm run dev

# Mobile (outra aba)
cd mobile
npm install
npx expo start
```

### Acesso

| Serviço       | URL                              |
|---------------|----------------------------------|
| Frontend Web  | http://localhost:5173             |
| API           | http://localhost:3000/api/v1      |
| Swagger       | http://localhost:3000/api/docs    |
| MinIO Console | http://localhost:9001             |
| Evolution API | http://localhost:8080             |
| PostgreSQL    | localhost:5432                    |

### Credenciais Demo

| Perfil        | Email                  | Senha      |
|---------------|------------------------|------------|
| Admin         | admin@clinica.com      | Admin@123  |
| Recepcionista | recepcao@clinica.com   | Recep@123  |

## Estrutura do Projeto

```
dental-sys/
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/             # Autenticação, JWT, 2FA
│   │   │   ├── users/            # Gestão de usuários
│   │   │   ├── tenants/          # Multi-tenancy
│   │   │   ├── patients/         # Cadastro de pacientes
│   │   │   ├── appointments/     # Agendamentos
│   │   │   ├── medical-records/  # Prontuário + Odontograma
│   │   │   ├── billing/          # Gestão financeira
│   │   │   ├── inventory/        # Controle de estoque
│   │   │   ├── reports/          # Relatórios e indicadores
│   │   │   ├── notifications/    # WhatsApp/SMS/Email/In-app
│   │   │   ├── uploads/          # Upload de arquivos (S3/Local)
│   │   │   └── payments/         # Pagamentos Stripe
│   │   ├── common/               # Guards, decorators, pipes
│   │   ├── prisma/               # Prisma service
│   │   └── config/               # Configurações
│   ├── prisma/
│   │   ├── schema.prisma         # Schema do banco (28+ tabelas)
│   │   └── seed.ts               # Dados iniciais
│   └── test/e2e/                 # Testes end-to-end
├── frontend/
│   ├── src/
│   │   ├── components/           # Componentes React
│   │   ├── pages/                # Páginas
│   │   ├── hooks/                # Custom hooks
│   │   ├── services/             # API service
│   │   ├── types/                # TypeScript types
│   │   └── utils/                # Utilitários
│   └── nginx.conf
├── mobile/                       # App React Native (Expo)
│   ├── src/
│   │   ├── api/                  # API clients
│   │   ├── components/           # Componentes mobile
│   │   ├── screens/              # Telas
│   │   ├── navigation/           # Navegação
│   │   ├── context/              # Auth context
│   │   ├── types/                # Types
│   │   └── utils/                # Utilitários
│   └── app.json
├── docker-compose.yml            # Postgres + MinIO + Evolution + Backend + Frontend
└── README.md
```

## API Endpoints (Principais)

### Autenticação
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/register` - Registrar clínica
- `POST /api/v1/auth/refresh` - Renovar token
- `POST /api/v1/auth/2fa/enable` - Ativar 2FA

### Pacientes
- `GET /api/v1/patients` - Listar (com busca e paginação)
- `POST /api/v1/patients` - Cadastrar
- `GET /api/v1/patients/:id` - Detalhes completos
- `PUT /api/v1/patients/:id/medical-history` - Histórico médico

### Agendamentos
- `GET /api/v1/appointments` - Listar
- `POST /api/v1/appointments` - Criar (com validação de conflitos)
- `GET /api/v1/appointments/available-slots` - Horários disponíveis
- `GET /api/v1/appointments/calendar` - Visão calendário

### Prontuário
- `GET /api/v1/odontogram/:patientId` - Odontograma
- `PUT /api/v1/odontogram/:patientId` - Atualizar odontograma
- `POST /api/v1/treatment-plan` - Criar plano de tratamento

### Financeiro
- `GET /api/v1/billing/dashboard` - Dashboard financeiro
- `GET /api/v1/billing/accounts-receivable` - Contas a receber
- `PATCH /api/v1/billing/:id/pay` - Marcar como pago

### Notificações
- `GET /api/v1/notifications` - Listar notificações
- `PATCH /api/v1/notifications/:id/read` - Marcar como lida
- `POST /api/v1/notifications/send-appointment-confirmation/:id` - Enviar confirmação

### Upload
- `POST /api/v1/uploads` - Upload de arquivo (single)
- `POST /api/v1/uploads/multiple` - Upload múltiplo
- `DELETE /api/v1/uploads/:key` - Remover arquivo

### Pagamentos
- `POST /api/v1/payments/checkout` - Criar sessão de checkout
- `POST /api/v1/payments/webhook` - Webhook do Stripe
- `POST /api/v1/payments/refund/:id` - Reembolso

### Relatórios
- `GET /api/v1/reports/appointments` - Relatório de agendamentos
- `GET /api/v1/reports/revenue` - Relatório de receita
- `GET /api/v1/reports/occupancy` - Taxa de ocupação
- `GET /api/v1/reports/professional-performance` - Desempenho por profissional

## Testes

```bash
# Unit tests
cd backend && npm run test

# E2E tests
cd backend && npm run test:e2e

# Coverage
cd backend && npm run test:cov
```

## LGPD e Segurança

- Senhas hasheadas com bcrypt (12 rounds)
- Tokens JWT com expiração curta (15min)
- Refresh tokens com expiração de 7 dias
- Autenticação em dois fatores (TOTP)
- Multi-tenancy com isolamento de dados
- Logs de auditoria em todas as operações sensíveis
- Criptografia em trânsito (TLS)
- Backup automático recomendado
- Arquivos criptografados em repouso (S3)

## Licença

Proprietário - Todos os direitos reservados.
