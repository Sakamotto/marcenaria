# PRD - Sistema de Gestão para Marcenaria (MVP)

**Versão:** 1.1  
**Data:** 2025-11-07  
**Produto:** Kanban + Tarefas + Calendário + Dashboard + Orçamentos  
**Público-alvo:** Pequenas e médias marcenarias (até 10 funcionários)

---

## 1. Introdução

Sistema web sob medida para gerenciar o fluxo de projetos (móveis planejados), tarefas operacionais, prazos e **orçamentos**. Substitui planilhas e papéis, centralizando informações e evitando atrasos.

## 2. Objetivos do MVP

- Organizar os projetos em um **quadro Kanban** visual.
- Permitir **tarefas datadas** dentro de cada projeto.
- Mostrar as tarefas em **calendário** (semanal/mensal).
- Exibir um **dashboard de pendências** (o que vence hoje/amanhã/atrasado).
- Oferecer cadastro simples de **clientes** e **projetos**.
- **Permitir múltiplos orçamentos por projeto** (versões), com campos de itens, valores e indicação de aprovado.
- **Modo Oficina**: Visão simplificada e de leitura das tarefas e status dos projetos para uso dos marceneiros no galpão, evitando que alterem orçamentos acidentalmente.
- **Upload de Arquivos e Documentos**: Armazenamento de imagens (JPEG/PNG/WEBP) e documentos (PDF) na nuvem (Supabase Storage) associados a cada projeto, facilitando o acesso rápido a plantas e fotos da obra.

**Não-Objetivos (fora do MVP):**  
- Controle financeiro/estoque avançado.  
- App mobile nativo (site responsivo já basta).  
- Integração com WhatsApp/email.  
- Múltiplos usuários com permissões complexas (apenas um usuário administrador no MVP).

## 3. Personas

| Persona | Papel | Dor principal |
|---------|-------|----------------|
| **Marceneiro(a)** | Executa os projetos | Não lembra prazos, perde anotações de clientes, não vê o que fazer hoje. |
| **Atendente (opcional)** | Faz orçamentos e acompanha clientes | Precisa saber em que fase cada projeto está sem incomodar a produção. |

## 4. Requisitos Funcionais

### 4.1. Módulo de Clientes
- CRUD (criar, ler, editar, desativar) de clientes.
- Campos mínimos: nome, telefone, e-mail, endereço da obra.
- Um cliente pode ter **múltiplos projetos**.

### 4.2. Módulo de Projetos (Kanban)
- Cada projeto pertence a um cliente.
- Status do projeto representado por **colunas do Kanban** (configuráveis pelo usuário).
- Colunas padrão sugeridas:
  - Lead (contato inicial)
  - Orçamento enviado
  - Negociação
  - Aprovado
  - Em produção
  - Instalação
  - Finalizado
- Drag-and-drop para mover projetos entre colunas.
- Campos do projeto: nome, descrição, valor total (opcional, preenchido automaticamente a partir do orçamento aprovado), data de criação.

### 4.3. Módulo de Orçamentos (dentro do projeto)
- Cada projeto pode conter **múltiplos orçamentos** (versões).
- Cada orçamento possui:
  - Número/versão (ex: "V1", "V2", ou data automática).
  - Data de criação.
  - Lista de itens com entrada 100% manual (cada item: descrição, quantidade, valor unitário, valor total calculado).
  - Valor total do orçamento.
  - Campo booleano: **"Aprovado?"** (apenas um orçamento por projeto pode ser marcado como aprovado).
  - Campo texto: observações (ex: "cliente pediu troca de puxador").
- Funcionalidades:
  - Criar novo orçamento a partir de uma cópia do anterior (útil para alterações).
  - Gerar visualização web dedicada e limpa do orçamento com estilos de impressão (CSS print media query) para salvamento em PDF direto pelo navegador.
  - Exibir na lista de orçamentos qual é o aprovado.
- **Regra de negócio**: quando um orçamento é marcado como "Aprovado", o campo "valor total" do projeto é atualizado automaticamente.

### 4.4. Módulo de Tarefas
- Cada tarefa pertence a um projeto.
- Atributos: título, descrição (opcional), **data de vencimento**, **status** (pendente / concluída).
- Exibição direta como checklist de tarefas pendentes e concluídas dentro da página de detalhes do projeto (sem lógicas complexas de ocultação).

### 4.5. Módulo de Calendário
- Visualização mensal/semanal/diária (toggle simples).
- Mostra todas as tarefas (não concluídas) com data de vencimento.
- Clicar em uma tarefa abre um modal para editar/completar.
- Suporte a arrastar tarefa para outra data (reagendamento rápido).

### 4.6. Dashboard (Página inicial)
- Cards resumo:
  - Projetos por status (ex: 3 em orçamento, 2 em produção).
  - Tarefas atrasadas (vencidas e não concluídas).
  - Tarefas que vencem **hoje**.
  - Tarefas que vencem **amanhã**.
  - **Orçamentos pendentes de envio** (projetos com status "Lead" ou "Orçamento enviado" que não têm nenhum orçamento criado – opcional, mas útil).
- Lista das próximas 5 tarefas ordenadas por data mais próxima.
- Gráfico de distribuição de projetos por status (barra ou pizza) usando Chart.js (via ng2-charts ou integração direta).

### 4.7. Funcionalidades Transversais
- Busca global por cliente, projeto ou tarefa.
- Filtro de projetos por status.
- Responsivo (funciona no celular – versão mobile do Kanban pode ser lista de colunas empilhadas).

### 4.8. Módulo de Arquivos e Documentos
- Cada projeto possui uma aba dedicada a "Arquivos".
- Permite o upload de múltiplos arquivos de imagem (JPEG, PNG, WEBP) e documentos (PDF).
- Limite padrão de tamanho (ex: até 10MB por arquivo).
- Cada arquivo possui um título/descrição opcional.
- Os arquivos são armazenados com segurança na nuvem (Supabase Storage).
- Usuários podem visualizar prévias das imagens, baixar documentos ou deletar anexos indesejados.

## 5. Requisitos Não Funcionais

| Categoria | Requisito |
|-----------|------------|
| **Tecnologia adotada** | Frontend: Angular (latest) + Custom Vanilla CSS (gradients & glassmorphism). Backend: Node.js (TypeScript) + Express + Prisma ORM. Banco de dados: PostgreSQL. |
| **Performance** | O Kanban deve carregar até 100 projetos sem lag perceptível (<2s). |
| **Segurança** | Autenticação baseada em JWT (JSON Web Token) via Angular Interceptor. Apenas conta administrativa e visão simplificada "Modo Oficina" (sem 2FA). |
| **Backup** | Exportação manual dos dados em JSON/CSV (botão administrativo). |
| **Manutenibilidade** | Código comentado e estrutura de pastas clara. |

## 6. Fluxos Principais

### Fluxo A – Novo projeto + orçamento + aprovação
1. Usuário clica em “Novo Projeto”.
2. Seleciona um cliente existente ou cadastra novo.
3. Preenche nome do projeto e status inicial (padrão: “Lead”).
4. Dentro do projeto, clica em “Novo Orçamento”.
5. Adiciona itens (descrição, quantidade, valor unitário). Sistema calcula total.
6. Salva o orçamento (versão 1). O projeto permanece em “Lead”.
7. Envia o orçamento por fora (ex: WhatsApp). No sistema, move o projeto para “Orçamento enviado”.
8. Cliente pede alteração: cria novo orçamento (cópia do V1, modifica itens) – vira V2.
9. Cliente aprova o V2: usuário marca V2 como “Aprovado”. Projeto muda para status “Aprovado” automaticamente (ou manualmente, a critério).

### Fluxo B – Tarefas vinculadas ao orçamento aprovado
1. Após aprovação, usuário cria tarefas baseadas nos itens do orçamento (ex: “Comprar MDF 15mm”).
2. As tarefas aparecem no calendário e dashboard.

### Fluxo C – Movimentação no Kanban + conclusão de tarefas
1. Usuário arrasta projeto da coluna “Orçamento enviado” para “Aprovado”.
2. Sistema não altera tarefas automaticamente, mas pode sugerir (futuro).
3. Usuário marca tarefa como concluída no calendário ou dentro do projeto.
4. Tarefa concluída some do Dashboard de pendências.

## 7. Interface (Telas Mínimas)

| Tela | Componentes principais |
|------|------------------------|
| **Login** | Campo usuário/senha, botão entrar. |
| **Dashboard** | Cards resumo (incluindo alerta de orçamentos sem envio), lista de próximas tarefas, gráfico simples. |
| **Kanban** | Colunas fixas + cartões de projeto (título + cliente + qtd tarefas pendentes + orçamento aprovado? – badge). |
| **Detalhe do Projeto** | Abas: **Resumo**, **Orçamentos**, **Tarefas**. Na aba Orçamentos: lista de versões, botão “Novo Orçamento”, visualizar e marcar aprovado. |
| **Formulário de Orçamento** | Lista de itens dinâmica (add/remove linha), campos descrição, qtde, valor unitário, total linha, total geral. Botão “Salvar versão” e “Salvar como cópia”. |
| **Calendário** | Grade mensal/semanal, cada dia com lista de tarefas (ou bolinhas indicadoras). |
| **Clientes** | Listagem + botão “Novo Cliente”. |

## 8. Critérios de Sucesso do MVP

- [ ] Usuário consegue cadastrar 5 clientes e 10 projetos em menos de 10 minutos.
- [ ] Para um projeto, é possível criar pelo menos 2 versões de orçamento e marcar uma como aprovada.
- [ ] O Kanban reflete imediatamente o movimento de projetos.
- [ ] O Dashboard mostra tarefas atrasadas com precisão.
- [ ] Um marceneiro real, após 1 semana de uso, relata que não perdeu nenhum prazo e que os orçamentos ficaram organizados.
- [ ] O sistema não apresenta erro crítico durante a navegação básica.

## 9. Possíveis Melhorias Futuras (Pós-MVP)

- Exportar orçamento em PDF formatado.
- Múltiplos usuários com perfis (admin, produção, atendimento).
- Notificações por e-mail ou WhatsApp.
- Relatório de produtividade (tarefas concluídas por semana).
- Template de itens de orçamento por tipo de móvel (ex: “Armário de cozinha” já vem com lista de materiais sugerida).
- Integração com impressoras de etiqueta.

## 10. Estimativa de Esforço (para planejamento)

| Atividade | Dias (1 dev full-time) |
|-----------|------------------------|
| Backend (CRUD clientes, projetos, tarefas, orçamentos com itens dinâmicos) | 4 |
| Frontend – Kanban drag-and-drop | 2 |
| Frontend – Calendário | 2 |
| Frontend – Dashboard + cards | 1 |
| Frontend – Formulário de orçamento com linhas dinâmicas | 1 |
| Autenticação + responsividade | 1 |
| Testes e ajustes | 1 |
| **Total** | **12 dias úteis (~2,5 semanas)** |

> *Observação:* Se usar ferramentas low-code (NocoBase/Directus), o tempo cai para 3-4 dias de configuração, mas a parte de orçamento com itens dinâmicos pode exigir plugins adicionais.

---

**Aprovado por:**  
(seu nome / cliente)  

**Próximos passos:**  
- Escolher stack técnica.  
- Criar protótipo navegável (Figma ou lápis).  
- Iniciar desenvolvimento pelo módulo de clientes + projetos + orçamentos (base de dados principal).