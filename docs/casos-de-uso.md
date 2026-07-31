# Casos de Uso — DentalSys

Casos de uso descritos com base nas permissões reais do sistema (controles de acesso por perfil no frontend e backend).

## Perfis de Acesso

| Perfil | Acesso no sistema |
|--------|-------------------|
| **RECEPTIONIST** | Dashboard, Pacientes, Agendamentos, Agenda, Financeiro, Pagamentos, Convênios, Procedimentos, Salas, Profissionais |
| **DENTIST** | Dashboard, Notificações, Pacientes, Agendamentos, Prontuário, Convênios, Lab, Procedimentos, Profissionais |
| **ADMIN** | Acesso total — todas as telas e módulos |

---

## 🛎️ Recepcionista

### Cadastro e atendimento de pacientes
1. **Registrar novo paciente** com dados pessoais, contato, convênio e dados médicos básicos.
2. **Buscar paciente** por nome/telefone/CPF para ver a ficha completa (histórico, anexos, responsáveis).
3. **Anexar documentos** (autorizações, laudos) ao prontuário do paciente.
4. **Cadastrar responsável legal** (guardião) para pacientes menores.

### Agenda e agendamentos
5. **Criar agendamento** selecionando paciente, profissional, sala, procedimento e horário — visualizando apenas os horários livres.
6. **Confirmar / remarcar / cancelar** consultas pelo calendário da Agenda.
7. **Registrar ausência** (no-show) de paciente que não compareceu.
8. **Consultar a agenda do dia** e acompanhar o status de cada atendimento (agendado → confirmado → em atendimento → concluído).

### Financeiro
9. **Lançar faturamento** de um atendimento/procedimento (gerar conta a receber do paciente).
10. **Registrar pagamento** (à vista ou parcelado) e emitir comprovante.
11. **Verificar contas a receber e pendências** do paciente no momento do atendimento.
12. **Gerar pedido de pagamento online** (PIX/boleto/cartão via Mercado Pago) para o paciente pagar à distância.

### Cadastros básicos
13. **Consultar convênios** e ver quais procedimentos cada um cobre.
14. **Visualizar listas de procedimentos, salas e profissionais** para orientar pacientes.

---

## 🦷 Dentista

### Atendimento clínico
1. **Consultar a agenda do dia** e abrir a ficha do paciente direto do agendamento.
2. **Registrar prontuário** da consulta: diagnóstico, procedimento realizado, prescrições, observações e retorno.
3. **Preencher o odontograma** — selecionar múltiplos dentes e aplicar condições (cárie, restauração, coroa, extração, etc.) com alertas médicos (alergias, doenças crônicas, medicações).
4. **Registrar/editar anamnese** e histórico médico do paciente antes de procedimentos.

### Planejamento
5. **Criar plano de tratamento/orçamento** com título, descrição, profissional responsável, validade e itens (procedimento, dente, valor unitário, quantidade, subtotal automático).
6. **Obter aprovação do plano** (aceitar) — o sistema gera automaticamente o lançamento financeiro.
7. **Iniciar e concluir planos** à medida que os tratamentos avançam.

### Operação
8. **Solicitar exames/ordens ao laboratório** e acompanhar o status.
9. **Consultar procedimentos** e seus valores/tempos para montar orçamentos.
10. **Ver lista de profissionais** e convênios para decidir o melhor encaminhamento.
11. **Receber notificações** (lembretes de retorno, resultados de exames, alertas de estoque).

---

## 🧑‍💼 Administrador

### Gestão de usuários e acesso
1. **Criar usuários** (ADMIN, DENTIST, ASSISTANT, RECEPTIONIST, FINANCIAL) com limites de atendimento/dia.
2. **Ativar/desativar usuários** e controlar permissões por perfil.

### Gestão financeira
3. **Analisar DRE (Financeiro Avançado)** — receitas por categoria, despesas, deduções de comissões e resultado por período (mês/trimestre/ano).
4. **Acompanhar o fluxo de caixa** e fazer o **fechamento diário** (encerrar o dia com entrada/saída/saldo).
5. **Gerenciar comissões dos profissionais** — cadastrar taxa, criar comissões, pagar/cancelar, ver resumo a pagar.
6. **Emitir NF-e/NFS-e** e configurar a emissão fiscal.
7. **Configurar o token Mercado Pago** da clínica para receber pagamentos online.
8. **Aprovar/recusar transações** e acompanhar contas a receber/pagar.

### Operação da clínica
9. **Gerenciar profissionais** (CRO, especialidade, comissão, horários) e **salas**.
10. **Gerenciar estoque** — itens, movimentações, alertas de estoque baixo e validade.
11. **Cadastrar procedimentos** com valores, durações e convênios.
12. **Cadastrar convênios** e tabelas de preço.

### Automação e comunicação
13. **Configurar WhatsApp** (número, templates) e **notificações** (lembretes de consulta, cobranças).
14. **Criar campanhas de recall** — busca pacientes (ausentes, aniversariantes, tratamento incompleto) e dispara mensagens em massa.
15. **Usar IA para transcrição** de consultas e sugestões de prontuário.

### Conformidade e dados
16. **Gerenciar LGPD/Privacidade** — consentimentos, exportar dados, anonimizar paciente.
17. **Migrar dados** — exportar/importar pacientes, agendamentos e procedimentos.
18. **Configurar a clínica** (dados, aparência, segurança/2FA, agendamento online).
