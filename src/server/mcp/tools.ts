/**
 * Life4Billion MCP Tools Definition
 * Exactly 23 Standardized Tools: 18 READ tools + 5 WRITE tools.
 * Explicit schemas, descriptions, and parameter validations for Claude and ChatGPT.
 */

import { McpTool } from "./types";

export const LIFE4BILLION_MCP_TOOLS: McpTool[] = [
  // ==========================================
  // FINANCE TOOLS (8 READ)
  // ==========================================
  {
    name: "get_financial_summary",
    category: "finance",
    type: "read",
    description: "Retorna o resumo financeiro consolidado do usuário autenticado no Life4Billion, incluindo total de receitas, despesas totais, despesas fixas vs variáveis, saldo líquido, status da reserva de emergência e patrimônio líquido.",
    inputSchema: {
      type: "object",
      properties: {
        period: {
          type: "string",
          description: "Período de referência no formato YYYY-MM (ex: '2026-09'). Se omitido, utiliza o mês atual."
        }
      }
    }
  },
  {
    name: "get_income",
    category: "finance",
    type: "read",
    description: "Lista os lançamentos de receitas (entradas financeiras) do usuário autenticado, com filtros opcionais de período e categoria.",
    inputSchema: {
      type: "object",
      properties: {
        period: {
          type: "string",
          description: "Período no formato YYYY-MM (ex: '2026-09')."
        },
        category: {
          type: "string",
          description: "Filtrar por categoria específica de receita (ex: 'Salário', 'Dividendos', 'Vendas', 'Investimentos')."
        },
        limit: {
          type: "number",
          description: "Número máximo de lançamentos a retornar (padrão: 50)."
        }
      }
    }
  },
  {
    name: "get_expenses",
    category: "finance",
    type: "read",
    description: "Lista as despesas e saídas financeiras do usuário autenticado, com categorização e distinção entre custos fixos e variáveis.",
    inputSchema: {
      type: "object",
      properties: {
        period: {
          type: "string",
          description: "Período no formato YYYY-MM (ex: '2026-09')."
        },
        category: {
          type: "string",
          description: "Filtrar por categoria (ex: 'Moradia', 'Alimentação', 'Transporte', 'Lazer', 'Saúde')."
        },
        expense_type: {
          type: "string",
          enum: ["fixed", "variable"],
          description: "Filtrar por despesas 'fixed' (fixas) ou 'variable' (variáveis)."
        },
        limit: {
          type: "number",
          description: "Número máximo de despesas a retornar (padrão: 50)."
        }
      }
    }
  },
  {
    name: "get_monthly_expenses",
    category: "finance",
    type: "read",
    description: "Retorna o histórico consolidado de despesas mensais agrupadas por mês dos últimos 3 a 12 meses, útil para análise de tendências e variações.",
    inputSchema: {
      type: "object",
      properties: {
        months_count: {
          type: "number",
          description: "Quantidade de meses anteriores a incluir (padrão: 6, máximo: 12)."
        }
      }
    }
  },
  {
    name: "get_budget",
    category: "finance",
    type: "read",
    description: "Retorna os orçamentos mensais definidos pelo usuário, com limites estabelecidos, valores já gastos no período e percentual consumido por categoria.",
    inputSchema: {
      type: "object",
      properties: {
        period: {
          type: "string",
          description: "Período de competência do orçamento no formato YYYY-MM (ex: '2026-09')."
        },
        category: {
          type: "string",
          description: "Filtrar por categoria específica de orçamento."
        }
      }
    }
  },
  {
    name: "get_upcoming_bills",
    category: "finance",
    type: "read",
    description: "Lista as contas a pagar, vencimentos de boletos, faturas de cartão, assinaturas e parcelas de dívidas nos próximos dias.",
    inputSchema: {
      type: "object",
      properties: {
        days_ahead: {
          type: "number",
          description: "Janela de dias futuros a consultar a partir de hoje (padrão: 30 dias)."
        }
      }
    }
  },
  {
    name: "get_emergency_reserve",
    category: "finance",
    type: "read",
    description: "Consulta o status atual da reserva de emergência do usuário (saldo acumulado, meta financeira estipulada, percentual de conclusão e prazo).",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "get_net_worth",
    category: "finance",
    type: "read",
    description: "Calcula o patrimônio líquido consolidado do usuário no Life4Billion (ativos totais, saldos de contas e reserva menos passivos, saldo devedor de cartões e dívidas).",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },

  // ==========================================
  // GOALS TOOLS (1 READ, 2 WRITE)
  // ==========================================
  {
    name: "get_goals",
    category: "goals",
    type: "read",
    description: "Lista as metas ativas, concluídas ou em progresso do usuário autenticado no Life4Billion com progresso percentual e prazos.",
    inputSchema: {
      type: "object",
      properties: {
        category: {
          type: "string",
          enum: ["personal", "fitness", "business", "financial"],
          description: "Filtrar por categoria de meta ('personal', 'fitness', 'business', 'financial')."
        },
        status: {
          type: "string",
          enum: ["in_progress", "completed", "failed"],
          description: "Filtrar por status da meta."
        }
      }
    }
  },
  {
    name: "create_goal",
    category: "goals",
    type: "write",
    description: "Cadastra uma nova meta para o usuário autenticado no Life4Billion. Retorna a confirmação e os dados da meta cadastrada.",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Título ou descrição da meta (ex: 'Reserva de Emergência de R$ 50.000', 'Comprar Carro', 'Meta de Faturamento')."
        },
        target_value: {
          type: "number",
          description: "Valor alvo numérico a ser alcançado."
        },
        current_value: {
          type: "number",
          description: "Valor atual inicial já acumulado (padrão: 0)."
        },
        unit: {
          type: "string",
          description: "Unidade de medida (ex: 'R$', 'USD', 'kg', 'km', '%'). Padrão: 'R$'."
        },
        deadline: {
          type: "string",
          description: "Data limite para conclusão no formato YYYY-MM-DD (ex: '2026-12-31')."
        },
        category: {
          type: "string",
          enum: ["personal", "fitness", "business", "financial"],
          description: "Categoria da meta ('personal', 'fitness', 'business' ou 'financial')."
        }
      },
      required: ["name", "target_value", "deadline", "category"]
    }
  },
  {
    name: "update_goal",
    category: "goals",
    type: "write",
    description: "Atualiza o progresso, valor acumulado ou status de uma meta existente do usuário autenticado no Life4Billion.",
    inputSchema: {
      type: "object",
      properties: {
        goal_id: {
          type: "string",
          description: "Identificador único da meta existente a ser atualizada."
        },
        current_value: {
          type: "number",
          description: "Novo valor acumulado até o momento."
        },
        target_value: {
          type: "number",
          description: "Novo valor alvo, se alterado."
        },
        status: {
          type: "string",
          enum: ["in_progress", "completed", "failed"],
          description: "Novo status da meta."
        }
      },
      required: ["goal_id"]
    }
  },

  // ==========================================
  // HABITS TOOLS (2 READ, 2 WRITE)
  // ==========================================
  {
    name: "get_habits",
    category: "habits",
    type: "read",
    description: "Lista os hábitos cadastrados pelo usuário autenticado, com frequência (diária/semanal), sequência atual ininterrupta (streak) e data do último cumprimento.",
    inputSchema: {
      type: "object",
      properties: {
        frequency: {
          type: "string",
          enum: ["daily", "weekly"],
          description: "Filtrar por frequência ('daily' ou 'weekly')."
        }
      }
    }
  },
  {
    name: "get_habit_progress",
    category: "habits",
    type: "read",
    description: "Analisa o progresso e a taxa de adesão aos hábitos da rotina semanal e diária do usuário.",
    inputSchema: {
      type: "object",
      properties: {
        period: {
          type: "string",
          enum: ["current_week", "current_month"],
          description: "Período de análise de adesão (padrão: 'current_week')."
        }
      }
    }
  },
  {
    name: "create_habit",
    category: "habits",
    type: "write",
    description: "Cria um novo hábito na rotina do usuário autenticado no Life4Billion.",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Nome do hábito a ser cultivado (ex: 'Leitura diária de 20 páginas', 'Exercício matinal', 'Meditação')."
        },
        frequency: {
          type: "string",
          enum: ["daily", "weekly"],
          description: "Frequência de execução ('daily' ou 'weekly'). Padrão: 'daily'."
        }
      },
      required: ["name"]
    }
  },
  {
    name: "update_habit",
    category: "habits",
    type: "write",
    description: "Atualiza um hábito existente do usuário (registrar cumprimento no dia, incrementar streak ou editar dados).",
    inputSchema: {
      type: "object",
      properties: {
        habit_id: {
          type: "string",
          description: "Identificador único do hábito a ser atualizado."
        },
        mark_completed_today: {
          type: "boolean",
          description: "Defina como true para marcar o hábito como concluído na data de hoje e incrementar a sequência (streak)."
        },
        streak: {
          type: "number",
          description: "Ajustar diretamente o contador de sequência do hábito."
        },
        name: {
          type: "string",
          description: "Novo nome ou descrição do hábito, se desejado."
        }
      },
      required: ["habit_id"]
    }
  },

  // ==========================================
  // CALENDAR TOOLS (1 READ, 1 WRITE)
  // ==========================================
  {
    name: "get_calendar_events",
    category: "calendar",
    type: "read",
    description: "Lista eventos, compromissos, lembretes e vencimentos financeiros agendados no calendário do usuário autenticado.",
    inputSchema: {
      type: "object",
      properties: {
        start_date: {
          type: "string",
          description: "Data inicial no formato YYYY-MM-DD. Padrão: data de hoje."
        },
        end_date: {
          type: "string",
          description: "Data final no formato YYYY-MM-DD."
        },
        type: {
          type: "string",
          description: "Filtrar por tipo (ex: 'bill', 'payday', 'appointment', 'reminder', 'goal_milestone')."
        },
        limit: {
          type: "number",
          description: "Número máximo de eventos a retornar (padrão: 50)."
        }
      }
    }
  },
  {
    name: "create_calendar_event",
    category: "calendar",
    type: "write",
    description: "Agenda um novo evento, vencimento de conta, lembrete ou compromisso no calendário do usuário autenticado.",
    inputSchema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Título ou descrição do evento (ex: 'Vencimento Conta de Luz', 'Reunião Trimestral', 'Aporte Reserva')."
        },
        date: {
          type: "string",
          description: "Data do evento no formato YYYY-MM-DD (ex: '2026-09-25')."
        },
        time: {
          type: "string",
          description: "Horário no formato HH:MM (ex: '14:30')."
        },
        type: {
          type: "string",
          enum: [
            "bill",
            "payday",
            "subscription",
            "debt_payment",
            "savings_deposit",
            "appointment",
            "reminder",
            "custom"
          ],
          description: "Tipo de evento no calendário."
        },
        amount: {
          type: "number",
          description: "Valor financeiro monetário envolvido (se aplicável)."
        },
        notes: {
          type: "string",
          description: "Observações ou notas adicionais sobre o evento."
        }
      },
      required: ["title", "date", "type"]
    }
  },

  // ==========================================
  // STUDY TOOLS (2 READ)
  // ==========================================
  {
    name: "get_study_progress",
    category: "study",
    type: "read",
    description: "Retorna o progresso de estudos e aprendizado do usuário, incluindo tempo total dedicado (em minutos/horas), metas educacionais e hábitos de estudo.",
    inputSchema: {
      type: "object",
      properties: {
        period: {
          type: "string",
          enum: ["today", "week", "month", "all"],
          description: "Período de agregação dos estudos ('today', 'week', 'month' ou 'all'). Padrão: 'week'."
        }
      }
    }
  },
  {
    name: "get_study_sessions",
    category: "study",
    type: "read",
    description: "Lista o histórico das sessões de estudo recentes do usuário autenticado (sessões de foco, Pomodoros e planejamento diário de estudos).",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Número máximo de sessões a retornar (padrão: 20)."
        }
      }
    }
  },

  // ==========================================
  // FAMILY TOOLS (2 READ)
  // ==========================================
  {
    name: "get_family_budget",
    category: "family",
    type: "read",
    description: "Consulta o orçamento familiar agregado do usuário autenticado, com despesas compartilhadas do lar e limites definidos para o ambiente familiar.",
    inputSchema: {
      type: "object",
      properties: {
        period: {
          type: "string",
          description: "Período de referência no formato YYYY-MM (ex: '2026-09')."
        }
      }
    }
  },
  {
    name: "get_family_expenses",
    category: "family",
    type: "read",
    description: "Lista as despesas vinculadas a membros da família e dependentes cadastrados no Life4Billion.",
    inputSchema: {
      type: "object",
      properties: {
        family_member_id: {
          type: "string",
          description: "Identificador de um membro familiar específico para filtrar despesas individuais."
        },
        period: {
          type: "string",
          description: "Período no formato YYYY-MM (ex: '2026-09')."
        },
        category: {
          type: "string",
          description: "Filtrar por categoria familiar (ex: 'Educação', 'Saúde', 'Alimentação', 'Moradia')."
        }
      }
    }
  },

  // ==========================================
  // CRM TOOLS (3 READ)
  // ==========================================
  {
    name: "get_crm_summary",
    category: "crm",
    type: "read",
    description: "Retorna a visão geral consolidada do CRM empresarial do Life4Billion (total de contatos cadastrados, contagem de leads, clientes ativos, catálogo de produtos e receita total de vendas).",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "get_leads",
    category: "crm",
    type: "read",
    description: "Lista os contatos comerciais classificados como leads ou prospects no CRM do Life4Billion.",
    inputSchema: {
      type: "object",
      properties: {
        tag: {
          type: "string",
          description: "Filtrar por tag específica de qualificação (ex: 'lead', 'prospect', 'quente', 'frio')."
        },
        limit: {
          type: "number",
          description: "Número máximo de leads a retornar (padrão: 50)."
        }
      }
    }
  },
  {
    name: "get_customers",
    category: "crm",
    type: "read",
    description: "Lista a carteira de clientes ativos da empresa do usuário autenticado, com informações cadastrais e tags.",
    inputSchema: {
      type: "object",
      properties: {
        search: {
          type: "string",
          description: "Termo de busca textual por nome, email ou telefone do cliente."
        },
        limit: {
          type: "number",
          description: "Número máximo de clientes a retornar (padrão: 50)."
        }
      }
    }
  }
];

export function findMcpTool(name: string): McpTool | undefined {
  return LIFE4BILLION_MCP_TOOLS.find(t => t.name === name);
}
