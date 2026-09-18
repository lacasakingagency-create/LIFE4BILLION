/**
 * Life4Billion MCP Tool Handlers Implementation
 * Fully grounded in real Supabase persistence with strict per-user data isolation.
 * Implements all 23 tools (18 READ, 5 WRITE) with structured and readable outputs.
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { McpToolResult, AuthenticatedUser } from "./types";
import { Goal, Habit, CalendarEvent, Transaction, Budget, EmergencyFund, Debt, FinancialCard, Customer, FamilyMember, Product, Sale } from "../../types/schema";

// Helper to generate IDs
const generateId = () => "mcp_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now().toString(36);

// Helper to format currency values
function formatMoney(amount: number, currency = "BRL"): string {
  const num = isNaN(amount) ? 0 : amount;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: currency === "BRL" ? "BRL" : currency === "EUR" ? "EUR" : "USD"
  }).format(num);
}

/**
 * Reads a user-scoped entity from life4billion_store in Supabase
 */
async function getUserData<T>(client: SupabaseClient, userId: string, keyName: string, defaultValue: T): Promise<T> {
  const userKey = `life4billion_u_${userId}_${keyName}`;
  try {
    let { data, error } = await client
      .from("life4billion_store")
      .select("value")
      .eq("key", userKey)
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !data) {
      // Fallback check on omnisaas_store
      const fallback = await client
        .from("omnisaas_store")
        .select("value")
        .eq("key", userKey)
        .eq("user_id", userId)
        .maybeSingle();

      if (!fallback.error && fallback.data) {
        data = fallback.data;
      }
    }

    if (data && data.value !== undefined && data.value !== null) {
      return data.value as T;
    }
  } catch (err) {
    console.warn(`[MCP getUserData Error for ${keyName}]:`, err);
  }
  return defaultValue;
}

/**
 * Saves a user-scoped entity into life4billion_store in Supabase
 */
async function saveUserData<T>(client: SupabaseClient, userId: string, keyName: string, value: T): Promise<boolean> {
  const userKey = `life4billion_u_${userId}_${keyName}`;
  let tableName = "life4billion_store";

  try {
    const check = await client.from("life4billion_store").select("key").limit(1);
    if (check.error) {
      const fallbackCheck = await client.from("omnisaas_store").select("key").limit(1);
      if (!fallbackCheck.error) {
        tableName = "omnisaas_store";
      }
    }

    const { error } = await client
      .from(tableName)
      .upsert({
        key: userKey,
        value: value,
        user_id: userId,
        updated_at: new Date().toISOString()
      }, { onConflict: "key" });

    if (error) {
      console.error(`[MCP saveUserData Error for ${keyName}]:`, error);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[MCP saveUserData Exception for ${keyName}]:`, err);
    return false;
  }
}

// Current period helper (YYYY-MM)
function getCurrentPeriod(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export async function executeMcpTool(
  toolName: string,
  args: Record<string, any>,
  user: AuthenticatedUser,
  client: SupabaseClient
): Promise<McpToolResult> {
  const userId = user.userId;

  try {
    switch (toolName) {
      // ==========================================
      // 1. FINANCE TOOLS (8 READ)
      // ==========================================
      case "get_financial_summary": {
        const period = (args.period || getCurrentPeriod()).trim();
        const transactions = await getUserData<Transaction[]>(client, userId, "transactions", []);
        const emergencyFund = await getUserData<EmergencyFund>(client, userId, "emergency_fund", {
          id: "ef_1",
          user_id: userId,
          target_amount: 0,
          current_balance: 0,
          deadline: "",
          purpose: "unexpected",
          created_at: new Date().toISOString()
        });
        const debts = await getUserData<Debt[]>(client, userId, "debts", []);
        const cards = await getUserData<FinancialCard[]>(client, userId, "cards", []);

        const periodTx = transactions.filter(t => (t.date || "").startsWith(period));
        const totalIncome = periodTx.filter(t => t.type === "income").reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
        const totalExpenses = periodTx.filter(t => t.type === "expense").reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
        const fixedExpenses = periodTx.filter(t => t.type === "expense" && t.expense_type === "fixed").reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
        const variableExpenses = totalExpenses - fixedExpenses;
        const netSavings = totalIncome - totalExpenses;

        const totalDebt = debts.filter(d => d.status !== "paid").reduce((acc, d) => acc + ((Number(d.total_amount) || 0) - (Number(d.paid_amount) || 0)), 0);
        const totalCardBalance = cards.reduce((acc, c) => acc + (Number(c.current_balance) || 0), 0);
        const netWorth = (Number(emergencyFund.current_balance) || 0) + netSavings - totalDebt - totalCardBalance;

        const structured = {
          period,
          total_income: totalIncome,
          total_expenses: totalExpenses,
          fixed_expenses: fixedExpenses,
          variable_expenses: variableExpenses,
          net_savings: netSavings,
          emergency_reserve_balance: emergencyFund.current_balance || 0,
          emergency_reserve_target: emergencyFund.target_amount || 0,
          total_debt: totalDebt,
          card_balances: totalCardBalance,
          estimated_net_worth: netWorth,
          transactions_count: periodTx.length
        };

        const text = [
          `📊 **Resumo Financeiro - Life4Billion (${period})**`,
          `• **Receitas Totais:** ${formatMoney(totalIncome)}`,
          `• **Despesas Totais:** ${formatMoney(totalExpenses)} (Fixas: ${formatMoney(fixedExpenses)} | Variáveis: ${formatMoney(variableExpenses)})`,
          `• **Resultado Operacional Líquido:** ${formatMoney(netSavings)} ${netSavings >= 0 ? "🟢 (Superávit)" : "🔴 (Déficit)"}`,
          `• **Reserva de Emergência:** ${formatMoney(emergencyFund.current_balance || 0)} de uma meta de ${formatMoney(emergencyFund.target_amount || 0)}`,
          `• **Passivos & Dívidas em Aberto:** ${formatMoney(totalDebt + totalCardBalance)}`,
          `• **Patrimônio Líquido Estimado:** ${formatMoney(netWorth)}`
        ].join("\n");

        return {
          content: [{ type: "text", text }],
          structuredContent: structured
        };
      }

      case "get_income": {
        const period = args.period ? String(args.period).trim() : undefined;
        const categoryFilter = args.category ? String(args.category).toLowerCase().trim() : undefined;
        const limit = Math.min(Number(args.limit) || 50, 100);

        const allTransactions = await getUserData<Transaction[]>(client, userId, "transactions", []);
        let incomes = allTransactions.filter(t => t.type === "income");

        if (period) {
          incomes = incomes.filter(t => (t.date || "").startsWith(period));
        }
        if (categoryFilter) {
          incomes = incomes.filter(t => (t.category || "").toLowerCase().includes(categoryFilter));
        }

        // Sort descending by date
        incomes.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
        const paginated = incomes.slice(0, limit);
        const totalAmount = incomes.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

        const text = incomes.length === 0
          ? `Nenhum lançamento de receita encontrado${period ? ` para o período ${period}` : ""}.`
          : [
              `💵 **Receitas Encontradas (${incomes.length} registros | Total: ${formatMoney(totalAmount)})**`,
              ...paginated.map((inc, i) => `${i + 1}. **${inc.date}** - ${inc.description || "Receita"}: **${formatMoney(inc.amount)}** (${inc.category || "Geral"})`)
            ].join("\n");

        return {
          content: [{ type: "text", text }],
          structuredContent: {
            period: period || "all",
            total_income: totalAmount,
            count: incomes.length,
            items: paginated
          }
        };
      }

      case "get_expenses": {
        const period = args.period ? String(args.period).trim() : undefined;
        const categoryFilter = args.category ? String(args.category).toLowerCase().trim() : undefined;
        const expenseType = args.expense_type ? String(args.expense_type).toLowerCase().trim() : undefined;
        const limit = Math.min(Number(args.limit) || 50, 100);

        const allTransactions = await getUserData<Transaction[]>(client, userId, "transactions", []);
        let expenses = allTransactions.filter(t => t.type === "expense");

        if (period) {
          expenses = expenses.filter(t => (t.date || "").startsWith(period));
        }
        if (categoryFilter) {
          expenses = expenses.filter(t => (t.category || "").toLowerCase().includes(categoryFilter));
        }
        if (expenseType && (expenseType === "fixed" || expenseType === "variable")) {
          expenses = expenses.filter(t => (t.expense_type || "variable") === expenseType);
        }

        expenses.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
        const paginated = expenses.slice(0, limit);
        const totalAmount = expenses.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

        // Group by category
        const byCategory: Record<string, number> = {};
        for (const exp of expenses) {
          const cat = exp.category || "Outros";
          byCategory[cat] = (byCategory[cat] || 0) + (Number(exp.amount) || 0);
        }

        const text = expenses.length === 0
          ? `Nenhuma despesa registrada${period ? ` para o período ${period}` : ""}.`
          : [
              `💳 **Despesas Registradas (${expenses.length} registros | Total: ${formatMoney(totalAmount)})**`,
              `*Principais Categorias:* ${Object.entries(byCategory).map(([c, v]) => `${c}: ${formatMoney(v)}`).join(" | ")}`,
              `---`,
              ...paginated.map((exp, i) => `${i + 1}. **${exp.date}** - ${exp.description || "Despesa"}: **${formatMoney(exp.amount)}** [${exp.category || "Geral"}] (${exp.expense_type === "fixed" ? "Fixa" : "Variável"})`)
            ].join("\n");

        return {
          content: [{ type: "text", text }],
          structuredContent: {
            period: period || "all",
            total_expenses: totalAmount,
            count: expenses.length,
            by_category: byCategory,
            items: paginated
          }
        };
      }

      case "get_monthly_expenses": {
        const count = Math.min(Math.max(Number(args.months_count) || 6, 1), 12);
        const transactions = await getUserData<Transaction[]>(client, userId, "transactions", []);
        const expenses = transactions.filter(t => t.type === "expense");

        const monthsMap: Record<string, { total: number; fixed: number; variable: number; count: number }> = {};

        // Generate last N months labels
        const now = new Date();
        for (let i = count - 1; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          monthsMap[key] = { total: 0, fixed: 0, variable: 0, count: 0 };
        }

        for (const exp of expenses) {
          const ym = (exp.date || "").substring(0, 7);
          if (monthsMap[ym]) {
            const amt = Number(exp.amount) || 0;
            monthsMap[ym].total += amt;
            monthsMap[ym].count += 1;
            if (exp.expense_type === "fixed") {
              monthsMap[ym].fixed += amt;
            } else {
              monthsMap[ym].variable += amt;
            }
          }
        }

        const history = Object.entries(monthsMap).map(([month, data]) => ({
          month,
          ...data
        }));

        const text = [
          `📅 **Histórico Mensal de Despesas (Últimos ${count} meses)**`,
          ...history.map(h => `• **${h.month}**: ${formatMoney(h.total)} (${h.count} lançamentos | Fixas: ${formatMoney(h.fixed)} | Variáveis: ${formatMoney(h.variable)})`)
        ].join("\n");

        return {
          content: [{ type: "text", text }],
          structuredContent: { history }
        };
      }

      case "get_budget": {
        const period = (args.period || getCurrentPeriod()).trim();
        const category = args.category ? String(args.category).toLowerCase().trim() : undefined;

        const budgets = await getUserData<Budget[]>(client, userId, "budgets", []);
        const transactions = await getUserData<Transaction[]>(client, userId, "transactions", []);

        // Calculate actual spent per category for the specified period
        const periodExpenses = transactions.filter(t => t.type === "expense" && (t.date || "").startsWith(period));
        const spentMap: Record<string, number> = {};
        for (const exp of periodExpenses) {
          const cat = (exp.category || "Geral").toLowerCase();
          spentMap[cat] = (spentMap[cat] || 0) + (Number(exp.amount) || 0);
        }

        let filteredBudgets = budgets;
        if (category) {
          filteredBudgets = filteredBudgets.filter(b => (b.category || "").toLowerCase().includes(category));
        }

        const budgetOverview = filteredBudgets.map(b => {
          const catKey = (b.category || "").toLowerCase();
          const spent = spentMap[catKey] || b.spent_amount || 0;
          const limit = Number(b.limit_amount) || 0;
          const remaining = limit - spent;
          const percentage = limit > 0 ? Math.round((spent / limit) * 100) : 0;
          const status = percentage > 100 ? "exceeded" : percentage >= 85 ? "warning" : "ok";

          return {
            id: b.id,
            category: b.category,
            limit_amount: limit,
            spent_amount: spent,
            remaining_amount: remaining,
            percentage_used: percentage,
            status
          };
        });

        const totalBudgeted = budgetOverview.reduce((acc, b) => acc + b.limit_amount, 0);
        const totalSpent = budgetOverview.reduce((acc, b) => acc + b.spent_amount, 0);

        const text = budgetOverview.length === 0
          ? `Nenhum orçamento configurado para o período ${period}.`
          : [
              `🎯 **Orçamento Mensal - Life4Billion (${period})**`,
              `• **Teto Total Orçado:** ${formatMoney(totalBudgeted)} | **Total Consumido:** ${formatMoney(totalSpent)} (${totalBudgeted > 0 ? Math.round((totalSpent / totalBudgeted) * 100) : 0}%)`,
              `---`,
              ...budgetOverview.map(b => {
                const icon = b.status === "exceeded" ? "🔴 ESTOURADO" : b.status === "warning" ? "🟡 ALERTA" : "🟢 OK";
                return `• **${b.category}**: ${formatMoney(b.spent_amount)} de ${formatMoney(b.limit_amount)} (${b.percentage_used}%) - ${icon}`;
              })
            ].join("\n");

        return {
          content: [{ type: "text", text }],
          structuredContent: {
            period,
            total_budgeted: totalBudgeted,
            total_spent: totalSpent,
            budgets: budgetOverview
          }
        };
      }

      case "get_upcoming_bills": {
        const daysAhead = Math.min(Number(args.days_ahead) || 30, 90);
        const todayStr = new Date().toISOString().split("T")[0];
        const maxDate = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

        const events = await getUserData<CalendarEvent[]>(client, userId, "calendar_events", []);
        const debts = await getUserData<Debt[]>(client, userId, "debts", []);

        const billsFromEvents = events
          .filter(e => ["bill", "subscription", "debt_payment"].includes(e.type))
          .filter(e => (e.date || "") >= todayStr && (e.date || "") <= maxDate && e.status !== "completed")
          .map(e => ({
            id: e.id,
            source: "calendar_event",
            title: e.title,
            amount: e.amount || 0,
            due_date: e.date,
            type: e.type,
            status: e.status
          }));

        const billsFromDebts = debts
          .filter(d => d.status !== "paid" && (d.due_date || "") >= todayStr && (d.due_date || "") <= maxDate)
          .map(d => ({
            id: d.id,
            source: "debt",
            title: `Parcela: ${d.creditor}`,
            amount: d.minimum_payment || (d.total_amount - d.paid_amount),
            due_date: d.due_date,
            type: "debt_payment",
            status: "pending"
          }));

        const allBills = [...billsFromEvents, ...billsFromDebts].sort((a, b) => a.due_date.localeCompare(b.due_date));
        const totalBillsAmount = allBills.reduce((acc, b) => acc + (Number(b.amount) || 0), 0);

        const text = allBills.length === 0
          ? `Nenhuma conta a pagar encontrada nos próximos ${daysAhead} dias.`
          : [
              `⏰ **Próximas Contas a Pagar (Próximos ${daysAhead} dias | Total: ${formatMoney(totalBillsAmount)})**`,
              ...allBills.map((b, i) => `${i + 1}. **${b.due_date}** - ${b.title}: **${formatMoney(b.amount)}** (${b.type})`)
            ].join("\n");

        return {
          content: [{ type: "text", text }],
          structuredContent: {
            days_ahead: daysAhead,
            total_amount: totalBillsAmount,
            count: allBills.length,
            bills: allBills
          }
        };
      }

      case "get_emergency_reserve": {
        const reserve = await getUserData<EmergencyFund>(client, userId, "emergency_fund", {
          id: "ef_default",
          user_id: userId,
          target_amount: 0,
          current_balance: 0,
          deadline: "",
          purpose: "unexpected",
          notes: "",
          created_at: new Date().toISOString()
        });

        const target = Number(reserve.target_amount) || 0;
        const current = Number(reserve.current_balance) || 0;
        const progress = target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0;
        const remaining = Math.max(target - current, 0);

        const text = [
          `🛡️ **Status da Reserva de Emergência - Life4Billion**`,
          `• **Saldo Atual:** ${formatMoney(current)}`,
          `• **Meta Estabelecida:** ${formatMoney(target)}`,
          `• **Progresso:** ${progress}% concluído`,
          `• **Falta Acumular:** ${formatMoney(remaining)}`,
          reserve.deadline ? `• **Prazo Estipulado:** ${reserve.deadline}` : "",
          reserve.notes ? `• **Observações:** ${reserve.notes}` : ""
        ].filter(Boolean).join("\n");

        return {
          content: [{ type: "text", text }],
          structuredContent: {
            current_balance: current,
            target_amount: target,
            progress_percentage: progress,
            remaining_amount: remaining,
            purpose: reserve.purpose,
            deadline: reserve.deadline || null
          }
        };
      }

      case "get_net_worth": {
        const emergencyFund = await getUserData<EmergencyFund>(client, userId, "emergency_fund", {
          id: "ef_1",
          user_id: userId,
          target_amount: 0,
          current_balance: 0,
          deadline: "",
          purpose: "unexpected",
          created_at: new Date().toISOString()
        });
        const transactions = await getUserData<Transaction[]>(client, userId, "transactions", []);
        const debts = await getUserData<Debt[]>(client, userId, "debts", []);
        const cards = await getUserData<FinancialCard[]>(client, userId, "cards", []);

        const liquidBalance = transactions.reduce((acc, t) => acc + (t.type === "income" ? Number(t.amount) : -Number(t.amount)), 0);
        const emergencyBalance = Number(emergencyFund.current_balance) || 0;
        const totalAssets = Math.max(liquidBalance, 0) + emergencyBalance;

        const totalDebtsRemaining = debts.filter(d => d.status !== "paid").reduce((acc, d) => acc + ((Number(d.total_amount) || 0) - (Number(d.paid_amount) || 0)), 0);
        const totalCardBalance = cards.reduce((acc, c) => acc + (Number(c.current_balance) || 0), 0);
        const totalLiabilities = totalDebtsRemaining + totalCardBalance;

        const netWorth = totalAssets - totalLiabilities;

        const text = [
          `💎 **Patrimônio Líquido Consolidado - Life4Billion**`,
          `• **Ativos Totais:** ${formatMoney(totalAssets)} (Reserva: ${formatMoney(emergencyBalance)} | Saldo Líquido Operacional: ${formatMoney(Math.max(liquidBalance, 0))})`,
          `• **Passivos Totais:** ${formatMoney(totalLiabilities)} (Dívidas: ${formatMoney(totalDebtsRemaining)} | Faturas de Cartão: ${formatMoney(totalCardBalance)})`,
          `• **PATRIMÔNIO LÍQUIDO:** ${formatMoney(netWorth)} ${netWorth >= 0 ? "🟢" : "🔴"}`
        ].join("\n");

        return {
          content: [{ type: "text", text }],
          structuredContent: {
            net_worth: netWorth,
            total_assets: totalAssets,
            liquid_balance: liquidBalance,
            emergency_reserve: emergencyBalance,
            total_liabilities: totalLiabilities,
            debts_balance: totalDebtsRemaining,
            card_balance: totalCardBalance
          }
        };
      }

      // ==========================================
      // 2. GOALS TOOLS (1 READ, 2 WRITE)
      // ==========================================
      case "get_goals": {
        const category = args.category ? String(args.category).toLowerCase().trim() : undefined;
        const status = args.status ? String(args.status).toLowerCase().trim() : undefined;

        let goals = await getUserData<Goal[]>(client, userId, "goals", []);

        if (category) {
          goals = goals.filter(g => (g.category || "").toLowerCase() === category);
        }
        if (status) {
          goals = goals.filter(g => (g.status || "").toLowerCase() === status);
        }

        const goalsWithProgress = goals.map(g => {
          const target = Number(g.target_value) || 0;
          const current = Number(g.current_value) || 0;
          const pct = target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0;
          return {
            ...g,
            progress_percentage: pct
          };
        });

        const text = goalsWithProgress.length === 0
          ? "Nenhuma meta cadastrada encontrada."
          : [
              `🎯 **Metas Cadastradas (${goalsWithProgress.length} metas)**`,
              ...goalsWithProgress.map((g, i) => {
                const statusBadge = g.status === "completed" ? "✅ Concluída" : g.status === "failed" ? "❌ Não atingida" : "⏳ Em progresso";
                return `${i + 1}. **${g.name}** [${g.category}] - ${g.current_value}/${g.target_value} ${g.unit} (${g.progress_percentage}%) - Prazo: ${g.deadline} (${statusBadge})`;
              })
            ].join("\n");

        return {
          content: [{ type: "text", text }],
          structuredContent: { count: goalsWithProgress.length, goals: goalsWithProgress }
        };
      }

      case "create_goal": {
        if (!args.name || typeof args.name !== "string" || !args.name.trim()) {
          return { content: [{ type: "text", text: "Erro: O campo 'name' (nome da meta) é obrigatório." }], isError: true };
        }
        if (args.target_value === undefined || isNaN(Number(args.target_value)) || Number(args.target_value) <= 0) {
          return { content: [{ type: "text", text: "Erro: O campo 'target_value' deve ser um número positivo maior que zero." }], isError: true };
        }
        if (!args.deadline || typeof args.deadline !== "string") {
          return { content: [{ type: "text", text: "Erro: O campo 'deadline' (data limite no formato YYYY-MM-DD) é obrigatório." }], isError: true };
        }

        const newGoal: Goal = {
          id: generateId(),
          user_id: userId,
          name: args.name.trim(),
          target_value: Number(args.target_value),
          current_value: Number(args.current_value) || 0,
          unit: args.unit ? String(args.unit).trim() : "R$",
          deadline: args.deadline.trim(),
          category: (args.category as any) || "personal",
          status: "in_progress"
        };

        const existingGoals = await getUserData<Goal[]>(client, userId, "goals", []);
        existingGoals.push(newGoal);
        const saved = await saveUserData(client, userId, "goals", existingGoals);

        if (!saved) {
          return { content: [{ type: "text", text: "Erro ao persistir nova meta no Supabase." }], isError: true };
        }

        const text = [
          `✨ **Nova Meta Criada com Sucesso!**`,
          `• **ID:** \`${newGoal.id}\``,
          `• **Meta:** ${newGoal.name}`,
          `• **Alvo:** ${newGoal.target_value} ${newGoal.unit} (Início: ${newGoal.current_value} ${newGoal.unit})`,
          `• **Prazo:** ${newGoal.deadline}`,
          `• **Categoria:** ${newGoal.category}`
        ].join("\n");

        return {
          content: [{ type: "text", text }],
          structuredContent: { success: true, goal: newGoal }
        };
      }

      case "update_goal": {
        if (!args.goal_id || typeof args.goal_id !== "string") {
          return { content: [{ type: "text", text: "Erro: O campo 'goal_id' é obrigatório para atualizar uma meta." }], isError: true };
        }

        const existingGoals = await getUserData<Goal[]>(client, userId, "goals", []);
        const goalIndex = existingGoals.findIndex(g => g.id === args.goal_id);

        if (goalIndex === -1) {
          return { content: [{ type: "text", text: `Erro: Nenhuma meta encontrada com o ID '${args.goal_id}'.` }], isError: true };
        }

        const previousGoal = { ...existingGoals[goalIndex] };
        if (args.current_value !== undefined && !isNaN(Number(args.current_value))) {
          existingGoals[goalIndex].current_value = Number(args.current_value);
        }
        if (args.target_value !== undefined && !isNaN(Number(args.target_value))) {
          existingGoals[goalIndex].target_value = Number(args.target_value);
        }
        if (args.status && ["in_progress", "completed", "failed"].includes(args.status)) {
          existingGoals[goalIndex].status = args.status;
        }

        // Auto-complete check
        if (existingGoals[goalIndex].current_value >= existingGoals[goalIndex].target_value && existingGoals[goalIndex].status === "in_progress") {
          existingGoals[goalIndex].status = "completed";
        }

        const saved = await saveUserData(client, userId, "goals", existingGoals);
        if (!saved) {
          return { content: [{ type: "text", text: "Erro ao salvar atualização da meta no banco de dados." }], isError: true };
        }

        const updated = existingGoals[goalIndex];
        const progressPct = updated.target_value > 0 ? Math.min(Math.round((updated.current_value / updated.target_value) * 100), 100) : 0;

        const text = [
          `🔄 **Meta Atualizada com Sucesso!**`,
          `• **Meta:** ${updated.name} (\`${updated.id}\`)`,
          `• **Progresso Atual:** ${updated.current_value}/${updated.target_value} ${updated.unit} (${progressPct}%)`,
          `• **Status:** ${updated.status === "completed" ? "✅ Concluída" : updated.status === "failed" ? "❌ Não atingida" : "⏳ Em progresso"}`,
          `• **Alterações:** Valor Anterior: ${previousGoal.current_value} → Novo: ${updated.current_value}`
        ].join("\n");

        return {
          content: [{ type: "text", text }],
          structuredContent: { success: true, updated_goal: updated, previous_state: previousGoal }
        };
      }

      // ==========================================
      // 3. HABITS TOOLS (2 READ, 2 WRITE)
      // ==========================================
      case "get_habits": {
        const frequency = args.frequency ? String(args.frequency).toLowerCase().trim() : undefined;
        let habits = await getUserData<Habit[]>(client, userId, "habits", []);

        if (frequency && (frequency === "daily" || frequency === "weekly")) {
          habits = habits.filter(h => h.frequency === frequency);
        }

        const todayStr = new Date().toISOString().split("T")[0];
        const enriched = habits.map(h => ({
          ...h,
          completed_today: h.last_completed === todayStr
        }));

        const text = enriched.length === 0
          ? "Nenhum hábito cadastrado na rotina."
          : [
              `🌱 **Hábitos e Rotina (${enriched.length} hábitos)**`,
              ...enriched.map((h, i) => `${i + 1}. **${h.name}** [${h.frequency === "daily" ? "Diário" : "Semanal"}] - Sequência: 🔥 **${h.streak} dias** | Hoje: ${h.completed_today ? "✅ Concluído" : "⏳ Pendente"}`)
            ].join("\n");

        return {
          content: [{ type: "text", text }],
          structuredContent: { count: enriched.length, habits: enriched }
        };
      }

      case "get_habit_progress": {
        const habits = await getUserData<Habit[]>(client, userId, "habits", []);
        const todayStr = new Date().toISOString().split("T")[0];
        const completedCount = habits.filter(h => h.last_completed === todayStr).length;
        const totalCount = habits.length;
        const dailyRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
        const topStreaks = [...habits].sort((a, b) => (b.streak || 0) - (a.streak || 0)).slice(0, 5);

        const text = [
          `📈 **Progresso e Consistência de Hábitos**`,
          `• **Taxa de Cumprimento Hoje:** ${completedCount} de ${totalCount} hábitos concluídos (${dailyRate}%)`,
          `• **Top Sequências Ininterruptas:**`,
          ...topStreaks.map(h => `  - **${h.name}**: 🔥 ${h.streak} dias seguidos`)
        ].join("\n");

        return {
          content: [{ type: "text", text }],
          structuredContent: {
            total_habits: totalCount,
            completed_today: completedCount,
            daily_completion_rate: dailyRate,
            top_streaks: topStreaks
          }
        };
      }

      case "create_habit": {
        if (!args.name || typeof args.name !== "string" || !args.name.trim()) {
          return { content: [{ type: "text", text: "Erro: O nome do hábito é obrigatório." }], isError: true };
        }

        const newHabit: Habit = {
          id: generateId(),
          user_id: userId,
          name: args.name.trim(),
          frequency: args.frequency === "weekly" ? "weekly" : "daily",
          streak: 0,
          last_completed: null,
          created_at: new Date().toISOString()
        };

        const existing = await getUserData<Habit[]>(client, userId, "habits", []);
        existing.push(newHabit);
        const saved = await saveUserData(client, userId, "habits", existing);

        if (!saved) {
          return { content: [{ type: "text", text: "Erro ao persistir novo hábito no Supabase." }], isError: true };
        }

        const text = [
          `🌱 **Novo Hábito Registrado com Sucesso!**`,
          `• **ID:** \`${newHabit.id}\``,
          `• **Nome:** ${newHabit.name}`,
          `• **Frequência:** ${newHabit.frequency === "daily" ? "Diária" : "Semanal"}`,
          `• **Sequência Inicial:** 0 dias`
        ].join("\n");

        return {
          content: [{ type: "text", text }],
          structuredContent: { success: true, habit: newHabit }
        };
      }

      case "update_habit": {
        if (!args.habit_id || typeof args.habit_id !== "string") {
          return { content: [{ type: "text", text: "Erro: O campo 'habit_id' é obrigatório." }], isError: true };
        }

        const existing = await getUserData<Habit[]>(client, userId, "habits", []);
        const idx = existing.findIndex(h => h.id === args.habit_id);

        if (idx === -1) {
          return { content: [{ type: "text", text: `Erro: Hábito com ID '${args.habit_id}' não encontrado.` }], isError: true };
        }

        const todayStr = new Date().toISOString().split("T")[0];
        const prev = { ...existing[idx] };

        if (args.mark_completed_today) {
          if (existing[idx].last_completed !== todayStr) {
            existing[idx].last_completed = todayStr;
            existing[idx].streak = (existing[idx].streak || 0) + 1;
          }
        }
        if (args.streak !== undefined && !isNaN(Number(args.streak))) {
          existing[idx].streak = Number(args.streak);
        }
        if (args.name && typeof args.name === "string" && args.name.trim()) {
          existing[idx].name = args.name.trim();
        }

        const saved = await saveUserData(client, userId, "habits", existing);
        if (!saved) {
          return { content: [{ type: "text", text: "Erro ao atualizar hábito no banco de dados." }], isError: true };
        }

        const updated = existing[idx];
        const text = [
          `🔥 **Hábito Atualizado!**`,
          `• **Hábito:** ${updated.name}`,
          `• **Sequência:** ${updated.streak} dias seguidos`,
          `• **Última Conclusão:** ${updated.last_completed || "Nenhuma"}`
        ].join("\n");

        return {
          content: [{ type: "text", text }],
          structuredContent: { success: true, habit: updated, previous_state: prev }
        };
      }

      // ==========================================
      // 4. CALENDAR TOOLS (1 READ, 1 WRITE)
      // ==========================================
      case "get_calendar_events": {
        const todayStr = new Date().toISOString().split("T")[0];
        const startDate = args.start_date ? String(args.start_date).trim() : todayStr;
        const endDate = args.end_date ? String(args.end_date).trim() : undefined;
        const type = args.type ? String(args.type).toLowerCase().trim() : undefined;
        const limit = Math.min(Number(args.limit) || 50, 100);

        let events = await getUserData<CalendarEvent[]>(client, userId, "calendar_events", []);

        if (startDate) {
          events = events.filter(e => (e.date || "") >= startDate);
        }
        if (endDate) {
          events = events.filter(e => (e.date || "") <= endDate);
        }
        if (type) {
          events = events.filter(e => (e.type || "").toLowerCase() === type);
        }

        events.sort((a, b) => (a.date || "").localeCompare(b.date || ""));
        const paginated = events.slice(0, limit);

        const text = paginated.length === 0
          ? `Nenhum evento encontrado no calendário para o período informado.`
          : [
              `📅 **Eventos e Compromissos na Agenda (${paginated.length} eventos)**`,
              ...paginated.map((e, i) => `${i + 1}. **${e.date}** ${e.time ? `às ${e.time}` : ""} - **${e.title}** [${e.type}] ${e.amount ? `(${formatMoney(e.amount)})` : ""} - Status: ${e.status}`)
            ].join("\n");

        return {
          content: [{ type: "text", text }],
          structuredContent: { count: paginated.length, events: paginated }
        };
      }

      case "create_calendar_event": {
        if (!args.title || typeof args.title !== "string" || !args.title.trim()) {
          return { content: [{ type: "text", text: "Erro: O título do evento ('title') é obrigatório." }], isError: true };
        }
        if (!args.date || typeof args.date !== "string") {
          return { content: [{ type: "text", text: "Erro: A data do evento ('date' no formato YYYY-MM-DD) é obrigatória." }], isError: true };
        }

        const newEvent: CalendarEvent = {
          id: generateId(),
          user_id: userId,
          title: args.title.trim(),
          date: args.date.trim(),
          time: args.time ? String(args.time).trim() : undefined,
          type: (args.type as any) || "appointment",
          amount: args.amount !== undefined ? Number(args.amount) : undefined,
          notes: args.notes ? String(args.notes).trim() : undefined,
          status: "pending"
        };

        const existing = await getUserData<CalendarEvent[]>(client, userId, "calendar_events", []);
        existing.push(newEvent);
        const saved = await saveUserData(client, userId, "calendar_events", existing);

        if (!saved) {
          return { content: [{ type: "text", text: "Erro ao salvar evento na agenda do Supabase." }], isError: true };
        }

        const text = [
          `🗓️ **Evento Agendado com Sucesso!**`,
          `• **ID:** \`${newEvent.id}\``,
          `• **Título:** ${newEvent.title}`,
          `• **Data:** ${newEvent.date} ${newEvent.time ? `às ${newEvent.time}` : ""}`,
          `• **Tipo:** ${newEvent.type}`,
          newEvent.amount ? `• **Valor Financeiro:** ${formatMoney(newEvent.amount)}` : ""
        ].filter(Boolean).join("\n");

        return {
          content: [{ type: "text", text }],
          structuredContent: { success: true, event: newEvent }
        };
      }

      // ==========================================
      // 5. STUDY TOOLS (2 READ)
      // ==========================================
      case "get_study_progress": {
        const period = (args.period || "week").toLowerCase().trim();
        const studyRecords = await getUserData<any[]>(client, userId, "study_records", []);
        const habits = await getUserData<Habit[]>(client, userId, "habits", []);
        const studyHabits = habits.filter(h => (h.name || "").toLowerCase().includes("estud") || (h.name || "").toLowerCase().includes("leitur") || (h.name || "").toLowerCase().includes("livro"));

        const totalMinutes = studyRecords.reduce((acc, r) => acc + (Number(r.duration_minutes) || Number(r.spStudyTime) || 0), 0);
        const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
        const totalSessions = studyRecords.length;

        const text = [
          `📚 **Progresso de Estudos e Aprendizado - Life4Billion**`,
          `• **Tempo Total Registrado:** ${totalMinutes} minutos (~${totalHours} horas)`,
          `• **Sessões Realizadas:** ${totalSessions} sessões de foco`,
          `• **Hábitos de Estudo Ativos:** ${studyHabits.length > 0 ? studyHabits.map(h => `${h.name} (🔥 ${h.streak}d)`).join(", ") : "Nenhum hábito específico"}`
        ].join("\n");

        return {
          content: [{ type: "text", text }],
          structuredContent: {
            period,
            total_minutes: totalMinutes,
            total_hours: totalHours,
            total_sessions: totalSessions,
            study_habits: studyHabits
          }
        };
      }

      case "get_study_sessions": {
        const limit = Math.min(Number(args.limit) || 20, 50);
        const sessions = await getUserData<any[]>(client, userId, "study_records", []);
        sessions.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
        const paginated = sessions.slice(0, limit);

        const text = paginated.length === 0
          ? "Nenhuma sessão de estudo registrada no histórico."
          : [
              `📖 **Histórico de Sessões de Estudo Recentes (${paginated.length} registros)**`,
              ...paginated.map((s, i) => `${i + 1}. **${s.date || "Data N/A"}** - ${s.subject || s.focus || "Estudo Geral"}: **${s.duration_minutes || s.spStudyTime || 30} min** (${s.status || "Concluída"})`)
            ].join("\n");

        return {
          content: [{ type: "text", text }],
          structuredContent: { count: paginated.length, sessions: paginated }
        };
      }

      // ==========================================
      // 6. FAMILY TOOLS (2 READ)
      // ==========================================
      case "get_family_budget": {
        const period = (args.period || getCurrentPeriod()).trim();
        const budgets = await getUserData<Budget[]>(client, userId, "budgets", []);
        const members = await getUserData<FamilyMember[]>(client, userId, "family_members", []);

        // Family specific categories
        const familyCategories = ["moradia", "alimentação", "saúde", "educação", "lazer", "filhos", "família", "casa"];
        const familyBudgets = budgets.filter(b => familyCategories.some(c => (b.category || "").toLowerCase().includes(c)));

        const totalFamilyBudget = familyBudgets.reduce((acc, b) => acc + (Number(b.limit_amount) || 0), 0);
        const totalFamilySpent = familyBudgets.reduce((acc, b) => acc + (Number(b.spent_amount) || 0), 0);

        const text = [
          `🏡 **Orçamento Familiar Consolidado - Life4Billion (${period})**`,
          `• **Membros Cadastrados no Núcleo Familiar:** ${members.length} membros`,
          `• **Teto Orçamentário Familiar:** ${formatMoney(totalFamilyBudget)} | **Gasto:** ${formatMoney(totalFamilySpent)}`,
          `• **Categorias Familiares:**`,
          ...familyBudgets.map(b => `  - **${b.category}**: ${formatMoney(b.spent_amount)} de ${formatMoney(b.limit_amount)}`)
        ].join("\n");

        return {
          content: [{ type: "text", text }],
          structuredContent: {
            period,
            family_members_count: members.length,
            total_budget: totalFamilyBudget,
            total_spent: totalFamilySpent,
            budgets: familyBudgets
          }
        };
      }

      case "get_family_expenses": {
        const period = args.period ? String(args.period).trim() : undefined;
        const memberId = args.family_member_id ? String(args.family_member_id).trim() : undefined;
        const categoryFilter = args.category ? String(args.category).toLowerCase().trim() : undefined;

        const transactions = await getUserData<Transaction[]>(client, userId, "transactions", []);
        const members = await getUserData<FamilyMember[]>(client, userId, "family_members", []);

        const familyCategories = ["educação", "saúde", "alimentação", "moradia", "lazer", "filhos", "família", "escola"];
        let familyExpenses = transactions.filter(t => t.type === "expense" && familyCategories.some(fc => (t.category || "").toLowerCase().includes(fc)));

        if (period) {
          familyExpenses = familyExpenses.filter(t => (t.date || "").startsWith(period));
        }
        if (categoryFilter) {
          familyExpenses = familyExpenses.filter(t => (t.category || "").toLowerCase().includes(categoryFilter));
        }

        const totalSpent = familyExpenses.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

        const text = familyExpenses.length === 0
          ? `Nenhuma despesa familiar registrada para os critérios informados.`
          : [
              `👨‍👩‍👧‍👦 **Despesas Familiares (${familyExpenses.length} lançamentos | Total: ${formatMoney(totalSpent)})**`,
              ...familyExpenses.slice(0, 30).map((exp, i) => `${i + 1}. **${exp.date}** - ${exp.description || "Despesa Familiar"}: **${formatMoney(exp.amount)}** [${exp.category}]`)
            ].join("\n");

        return {
          content: [{ type: "text", text }],
          structuredContent: {
            total_expenses: totalSpent,
            count: familyExpenses.length,
            items: familyExpenses
          }
        };
      }

      // ==========================================
      // 7. CRM TOOLS (3 READ)
      // ==========================================
      case "get_crm_summary": {
        const customers = await getUserData<Customer[]>(client, userId, "customers", []);
        const products = await getUserData<Product[]>(client, userId, "products", []);
        const sales = await getUserData<Sale[]>(client, userId, "sales", []);

        const leadCount = customers.filter(c => (c.tags || []).some(tag => tag.toLowerCase().includes("lead") || tag.toLowerCase().includes("prospect"))).length;
        const activeCustomerCount = customers.length - leadCount;
        const totalSalesRevenue = sales.filter(s => s.status === "completed").reduce((acc, s) => acc + (Number(s.total_amount) || 0), 0);

        const text = [
          `💼 **Resumo Geral do CRM Comercial - Life4Billion**`,
          `• **Total de Contatos Cadastrados:** ${customers.length}`,
          `• **Leads / Prospects:** ${leadCount}`,
          `• **Clientes Ativos:** ${activeCustomerCount}`,
          `• **Produtos Cadastrados no Catálogo:** ${products.length}`,
          `• **Vendas Concluídas:** ${sales.filter(s => s.status === "completed").length} pedidos (Receita: ${formatMoney(totalSalesRevenue)})`
        ].join("\n");

        return {
          content: [{ type: "text", text }],
          structuredContent: {
            total_contacts: customers.length,
            leads_count: leadCount,
            customers_count: activeCustomerCount,
            products_count: products.length,
            sales_count: sales.length,
            total_revenue: totalSalesRevenue
          }
        };
      }

      case "get_leads": {
        const tag = args.tag ? String(args.tag).toLowerCase().trim() : undefined;
        const limit = Math.min(Number(args.limit) || 50, 100);

        const allCustomers = await getUserData<Customer[]>(client, userId, "customers", []);
        let leads = allCustomers.filter(c => (c.tags || []).some(t => t.toLowerCase().includes("lead") || t.toLowerCase().includes("prospect")));

        if (tag) {
          leads = leads.filter(c => (c.tags || []).some(t => t.toLowerCase().includes(tag)));
        }

        const paginated = leads.slice(0, limit);

        const text = paginated.length === 0
          ? "Nenhum lead encontrado com os filtros informados."
          : [
              `🎯 **Leads e Oportunidades Cadastradas (${paginated.length} contatos)**`,
              ...paginated.map((l, i) => `${i + 1}. **${l.name}** | Email: ${l.email || "N/A"} | Tel: ${l.phone || "N/A"} | Tags: [${(l.tags || []).join(", ")}]`)
            ].join("\n");

        return {
          content: [{ type: "text", text }],
          structuredContent: { count: paginated.length, leads: paginated }
        };
      }

      case "get_customers": {
        const search = args.search ? String(args.search).toLowerCase().trim() : undefined;
        const limit = Math.min(Number(args.limit) || 50, 100);

        let customers = await getUserData<Customer[]>(client, userId, "customers", []);

        if (search) {
          customers = customers.filter(c =>
            (c.name || "").toLowerCase().includes(search) ||
            (c.email || "").toLowerCase().includes(search) ||
            (c.phone || "").toLowerCase().includes(search)
          );
        }

        const paginated = customers.slice(0, limit);

        const text = paginated.length === 0
          ? "Nenhum cliente encontrado."
          : [
              `👥 **Carteira de Clientes (${paginated.length} clientes)**`,
              ...paginated.map((c, i) => `${i + 1}. **${c.name}** | ${c.email || "Sem email"} | ${c.phone || "Sem telefone"} | Tags: [${(c.tags || []).join(", ")}]`)
            ].join("\n");

        return {
          content: [{ type: "text", text }],
          structuredContent: { count: paginated.length, customers: paginated }
        };
      }

      default:
        return {
          content: [{ type: "text", text: `Erro: Ferramenta '${toolName}' não implementada ou desconhecida.` }],
          isError: true
        };
    }
  } catch (err: any) {
    console.error(`[MCP Tool Execution Exception for ${toolName}]:`, err);
    return {
      content: [{ type: "text", text: `Erro inesperado ao executar ${toolName}: ${err.message || String(err)}` }],
      isError: true
    };
  }
}
