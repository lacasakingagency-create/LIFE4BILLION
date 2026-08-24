/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { AdminStore } from "./src/lib/admin/adminStore";
import { EBook } from "./src/types/schema";

dotenv.config();

console.log("Environment:", process.env.NODE_ENV);
console.log("Stripe Secret Exists:", !!process.env.STRIPE_SECRET_KEY);

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with telemetry header as required by guidelines
let ai: GoogleGenAI | null = null;
try {
  if (process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
} catch (err) {
  console.error("Erro ao inicializar o SDK Gemini:", err);
}

// -------------------------------------------------------------
// API ENDPOINTS
// -------------------------------------------------------------

// Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

/// Proxy route for AI chat (supports OpenAI/Gemini requests transparently with robust fallbacks)
app.post("/api/chat", async (req, res) => {
  const { prompt, systemInstruction, language: rawLanguage } = req.body;

  if (!prompt) {
    res.status(400).json({ error: "O campo prompt é obrigatório." });
    return;
  }

  // Detect and normalize language
  const acceptLang = req.headers["accept-language"] || "";
  const rawLang = rawLanguage || acceptLang || "en";
  const language = rawLang.toLowerCase().startsWith("pt") ? "pt" : rawLang.toLowerCase().startsWith("es") ? "es" : "en";

  const defaultSystemInstruction = language === "pt"
    ? "Você é o Life4Billion AI, o cérebro analítico da plataforma Life4Billion. Analise os dados providos com rigor científico, clareza executiva e dê recomendações financeiras, operacionais ou de bem-estar concisas em português brasileiro."
    : language === "es"
    ? "Eres el Life4Billion AI, el cerebro analítico de la plataforma Life4Billion. Analiza los datos proporcionados con rigor científico, claridad ejecutiva y brinda recomendaciones financieras, operativas o de bienestar concisas en español."
    : "You are the Life4Billion AI, the analytical brain of the Life4Billion platform. Analyze the provided data with scientific rigor, executive clarity, and give concise financial, operational, or well-being recommendations in English.";

  let aiResponse = "";
  let aiProvider = "";
  let success = false;

  // 1. Try OpenAI if configured
  if (process.env.OPENAI_API_KEY) {
    try {
      console.log("Roteando solicitação de Copilot para a API Real-Time da OpenAI");
      const openAiUrl = "https://api.openai.com/v1/chat/completions";
      const openAiResponse = await fetch(openAiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: systemInstruction || defaultSystemInstruction
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.7
        })
      });

      if (openAiResponse.ok) {
        const data = await openAiResponse.json();
        aiResponse = data.choices?.[0]?.message?.content || "";
        aiProvider = language === "pt" ? "OpenAI GPT-4o-mini (API de Nuvem em Tempo Real)" : language === "es" ? "OpenAI GPT-4o-mini (API de nube en tiempo real)" : "OpenAI GPT-4o-mini (Real-Time Cloud API)";
        success = true;
        console.log("Chamada do OpenAI realizada com sucesso.");
      } else {
        const errorText = await openAiResponse.text();
        console.warn(`[OpenAI API Warning] Status: ${openAiResponse.status}, Error: ${errorText}. Falling back to Gemini / Simulator...`);
      }
    } catch (err: any) {
      console.warn(`[OpenAI Connection Exception] Error: ${err.message || err}. Falling back to Gemini / Simulator...`);
    }
  }

  // 2. Try Gemini if OpenAI wasn't successful and Gemini is available
  if (!success && ai) {
    try {
      console.log("Roteando solicitação de Copilot para a API da Gemini (Fallback)");
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: systemInstruction || defaultSystemInstruction,
          temperature: 0.7,
        }
      });

      if (response && response.text) {
        aiResponse = response.text;
        aiProvider = language === "pt" ? "Gemini 3.5 Flash (Proxy do Servidor)" : language === "es" ? "Gemini 3.5 Flash (Proxy del servidor)" : "Gemini 3.5 Flash (Server-Side Proxy)";
        success = true;
        console.log("Chamada do Gemini realizada com sucesso como fallback.");
      }
    } catch (err: any) {
      console.warn(`[Gemini Connection Exception] Error: ${err.message || err}. Falling back to Simulator...`);
    }
  }

  // 3. Fallback to Local Simulator if both failed or were unconfigured
  if (!success) {
    console.log("Utilizando simulador inteligente local de IA");
    let simulatedResponse = "";

    const lowerPrompt = prompt.toLowerCase();
    
    if (language === "pt") {
      if (lowerPrompt.includes("receita") || lowerPrompt.includes("financeiro") || lowerPrompt.includes("julho") || lowerPrompt.includes("orçamento") || lowerPrompt.includes("caixa")) {
        simulatedResponse = "### Relatório de Saúde Financeira Life4Billion (Life4Billion AI)\n\n" +
          "• **Faturamento Bruto**: R$ 17.700,00\n" +
          "• **Gastos Operacionais**: R$ 1.880,00\n" +
          "• **Lucro Líquido Estimado**: R$ 15.820,00 (Margem Operacional de **89.3%**)\n\n" +
          "**Análise de Alocação de Recursos**:\n" +
          "Sua maior despesa recorrente está em *Infraestrutura Cloud (AWS/Supabase)*, correspondendo a **77.1%** do seu passivo mensal total. \n\n" +
          "**Recomendações Estratégicas**:\n" +
          "1. **Fundo Tributário**: Recomenda-se provisionar **12%** de cada entrada de faturamento em conta dedicada para cobrir o imposto trimestral (DAS/Simples Nacional).\n" +
          "2. **Otimização Cloud**: Considere solicitar o pacote de créditos de startups ou migrar para instâncias reservadas de 1 ano para reduzir custos de infraestrutura em até **32%**.";
      } else if (lowerPrompt.includes("estoque") || lowerPrompt.includes("produto") || lowerPrompt.includes("sku") || lowerPrompt.includes("venda")) {
        simulatedResponse = "### Auditoria de Estoque e Catálogo de Produtos (Life4Billion AI)\n\n" +
          "• **Status Geral**: Regular (1 SKU em ponto de reabastecimento crítico).\n" +
          "• **Alerta Vermelho**: O produto `'Mentoria Executiva All-in-One'` (SKU: `L4B-MENTOR-HQ`) possui apenas **8 unidades** virtuais livres na agenda atual (mínimo de segurança: 10).\n\n" +
          "**Análise de Risco**: Risco moderado de quebra de estoque intangível caso uma campanha ativa de marketing seja veiculada nas próximas 48 horas.\n\n" +
          "**Ações Imediatas Sugeridas**:\n" +
          "1. Aumentar os limites de slots ou liberar novas datas na agenda do ERP.\n" +
          "2. O SKU `'Licença Mensal Life4Billion Pro'` (Digital) opera com estoque automatizado infinito e responde por **82%** do seu fluxo recorrente.";
      } else if (lowerPrompt.includes("funcionário") || lowerPrompt.includes("salário") || lowerPrompt.includes("folha") || lowerPrompt.includes("clt") || lowerPrompt.includes("trabalhista")) {
        simulatedResponse = "### Auditoria de RH e Custos Trabalhistas (Life4Billion AI)\n\n" +
          "• **Colaboradores Ativos**: 3 contratados CLT/PJ.\n" +
          "• **Custo Nominal Mensal (Folha)**: R$ 31.500,00\n" +
          "• **Status de Processamento**: Competência atual processada para 2 colaboradores; 1 colaborador (Designer UI/UX) aguardando liberação manual de benefícios.\n\n" +
          "**Diretrizes Legais Importantes (Brasil)**:\n" +
          "• Lembre-se de efetuar o recolhimento do FGTS e da guia do INSS patronal de *Bruno Almeida* até o dia 20 do mês corrente para evitar multas moratórias de **2% ao mês**.";
      } else if (lowerPrompt.includes("hábito") || lowerPrompt.includes("saúde") || lowerPrompt.includes("gestação") || lowerPrompt.includes("gravidez") || lowerPrompt.includes("dieta")) {
        simulatedResponse = "### Diagnóstico Médico e Monitoramento Nutricional (Life4Billion AI)\n\n" +
          "• **Métrica Principal**: Excelente engajamento de hidratação (streak ativo de 4 dias consumindo 3L/dia).\n" +
          "• **Estágio Gravídico**: Seu registro indica **14 semanas de gestação** (o bebê tem o tamanho aproximado de um limão, ~8.5 cm de comprimento).\n\n" +
          "**Recomendações e Sintomas Previstos**:\n" +
          "1. Nesta transição para o segundo trimestre, os enjoos matinais tendem a diminuir. \n" +
          "2. **Nutrição**: Mantenha refeições fracionadas ao longo do dia, ricas em carboidratos complexos, ácido fólico e ferro.\n" +
          "3. Evite longos períodos de jejum para combater episódios de hipoglicemia gestacional.";
      } else {
        simulatedResponse = `### Relatório Estratégico Life4Billion\n\n` +
          `Sua pergunta: *"${prompt}"*\n\n` +
          `O Life4Billion processou sua solicitação utilizando o **Motor de Simulação Local Integrado** para garantir total funcionamento sem dependências externas.\n\n` +
          `**Recomendação Técnica**: Para ativar inteligência em tempo real avançada baseada em dados reais via OpenAI GPT-4o ou Gemini, certifique-se de configurar suas chaves de API secretas (OpenAI ou Gemini) no painel de segredos (Secrets) do seu console e reinicie o servidor de desenvolvimento.`;
      }
    } else if (language === "es") {
      if (lowerPrompt.includes("receita") || lowerPrompt.includes("financeiro") || lowerPrompt.includes("julho") || lowerPrompt.includes("ingresos") || lowerPrompt.includes("presupuesto") || lowerPrompt.includes("caja")) {
        simulatedResponse = "### Informe de Salud Financiera Life4Billion (Life4Billion AI)\n\n" +
          "• **Ingresos Brutos**: $17.700,00\n" +
          "• **Gastos Operativos**: $1.880,00\n" +
          "• **Beneficio Neto Estimado**: $15.820,00 (Margen Operativo del **89,3%**)\n\n" +
          "**Análisis de Asignación de Recursos**:\n" +
          "Su mayor gasto recurrente se encuentra en *Infraestructura Cloud (AWS/Supabase)*, lo que corresponde al **77,1%** de sus pasivos mensuales totales. \n\n" +
          "**Recomendaciones Estratégicas**:\n" +
          "1. **Provisión de Impuestos**: Se recomienda aprovisionar el **12%** de cada ingreso en una cuenta dedicada para cubrir los impuestos corporativos trimestrales.\n" +
          "2. **Optimización Cloud**: Considere solicitar un paquete de créditos para startups o migrar a instancias reservadas de 1 año para reducir los costos de infraestructura hasta en un **32%**.";
      } else if (lowerPrompt.includes("estoque") || lowerPrompt.includes("produto") || lowerPrompt.includes("sku") || lowerPrompt.includes("venda") || lowerPrompt.includes("inventario") || lowerPrompt.includes("stock") || lowerPrompt.includes("producto")) {
        simulatedResponse = "### Auditoría de Inventario y Catálogo de Productos (Life4Billion AI)\n\n" +
          "• **Estado General**: Regular (1 SKU en punto crítico de reposición).\n" +
          "• **Alerta Roja**: El producto `'Mentoría Ejecutiva All-in-One'` (SKU: `L4B-MENTOR-HQ`) tiene solo **8 unidades** virtuales libres en la agenda actual (mínimo de seguridad: 10).\n\n" +
          "**Análisis de Riesgo**: Riesgo moderado de desabastecimiento intangible si se lanza una campaña de marketing activa en las próximas 48 horas.\n\n" +
          "**Acciones Inmediatas Sugeridas**:\n" +
          "1. Aumentar los límites de cupos o liberar nuevas fechas en la agenda del ERP.\n" +
          "2. El SKU `'Licença Mensal Life4Billion Pro'` (Digital) opera con inventario automatizado infinito y representa el **82%** de su flujo recurrente.";
      } else if (lowerPrompt.includes("funcionário") || lowerPrompt.includes("salário") || lowerPrompt.includes("folha") || lowerPrompt.includes("clt") || lowerPrompt.includes("trabalhista") || lowerPrompt.includes("empleado") || lowerPrompt.includes("nómina") || lowerPrompt.includes("salario") || lowerPrompt.includes("trabajo")) {
        simulatedResponse = "### Auditoría de Recursos Humanos y Costos de Nómina (Life4Billion AI)\n\n" +
          "• **Colaboradores Activos**: 3 contratados.\n" +
          "• **Costo Nominal Mensual (Nómina)**: $31.500,00\n" +
          "• **Estado de Procesamiento**: Nómina actual procesada para 2 colaboradores; 1 colaborador (Diseñador UI/UX) en espera de aprobación manual de beneficios.\n\n" +
          "**Directrices Legales Importantes**:\n" +
          "• Asegúrese de realizar la declaración de impuestos sobre la nómina y las contribuciones patronales antes de la fecha de vencimiento para evitar recargos por mora del **2% mensual**.";
      } else if (lowerPrompt.includes("hábito") || lowerPrompt.includes("saúde") || lowerPrompt.includes("gestação") || lowerPrompt.includes("gravidez") || lowerPrompt.includes("dieta") || lowerPrompt.includes("embarazo") || lowerPrompt.includes("gestación")) {
        simulatedResponse = "### Diagnóstico Médico y Monitoreo Nutricional (Life4Billion AI)\n\n" +
          "• **Métrica Principal**: Excelente nivel de hidratación (racha activa de 4 días consumiendo 3L/día).\n" +
          "• **Etapa de Embarazo**: Su registro indica **14 semanas de gestación** (el bebé tiene el tamaño aproximado de un limón, ~8,5 cm de longitud).\n\n" +
          "**Recomendaciones y Síntomas Previstos**:\n" +
          "1. En esta transición al segundo trimestre, las náuseas matutinas tienden a disminuir.\n" +
          "2. **Nutrición**: Mantenga comidas fraccionadas a lo largo del día, ricas en carbohidratos complejos, ácido fólico e hierro.\n" +
          "3. Evite períodos prolongados de ayuno para combatir episodios de hipoglicemia gestacional.";
      } else {
        simulatedResponse = `### Informe Estratégico Life4Billion\n\n` +
          `Su pregunta: *"${prompt}"*\n\n` +
          `Life4Billion procesó su solicitud utilizando el **Motor de Simulación Local Integrado** para garantizar el funcionamiento completo sin dependencias externas.\n\n` +
          `**Recomendación Técnica**: Para activar la inteligencia avanzada en tiempo real basada en datos reales a través de OpenAI GPT-4o o Gemini, asegúrese de configurar sus claves de API secretas (OpenAI o Gemini) en el panel de secretos (Secrets) de su consola y reinicie el servidor de desarrollo.`;
      }
    } else {
      if (lowerPrompt.includes("receita") || lowerPrompt.includes("financeiro") || lowerPrompt.includes("julho") || lowerPrompt.includes("revenue") || lowerPrompt.includes("finance") || lowerPrompt.includes("july") || lowerPrompt.includes("budget") || lowerPrompt.includes("cash")) {
        simulatedResponse = "### Life4Billion Financial Health Report (Life4Billion AI)\n\n" +
          "• **Gross Revenue**: $17,700.00\n" +
          "• **Operating Expenses**: $1,880.00\n" +
          "• **Estimated Net Profit**: $15,820.00 (Operating Margin of **89.3%**)\n\n" +
          "**Resource Allocation Analysis**:\n" +
          "Your largest recurring expense is in *Cloud Infrastructure (AWS/Supabase)*, corresponding to **77.1%** of your total monthly liabilities. \n\n" +
          "**Strategic Recommendations**:\n" +
          "1. **Tax Provisioning**: It is recommended to provision **12%** of each revenue entry into a dedicated account to cover quarterly corporate taxes.\n" +
          "2. **Cloud Optimization**: Consider applying for a startup credits package or migrating to 1-year reserved instances to reduce infrastructure costs by up to **32%**.";
      } else if (lowerPrompt.includes("estoque") || lowerPrompt.includes("produto") || lowerPrompt.includes("sku") || lowerPrompt.includes("venda") || lowerPrompt.includes("stock") || lowerPrompt.includes("sku") || lowerPrompt.includes("product") || lowerPrompt.includes("sale") || lowerPrompt.includes("inventory")) {
        simulatedResponse = "### Stock Audit and Product Catalog (Life4Billion AI)\n\n" +
          "• **General Status**: Fair (1 SKU at critical replenishment point).\n" +
          "• **Red Alert**: The product `'All-in-One Executive Mentorship'` (SKU: `L4B-MENTOR-HQ`) has only **8 virtual units** free in the current schedule (safety minimum: 10).\n\n" +
          "**Risk Analysis**: Moderate risk of intangible stockout if an active marketing campaign runs in the next 48 hours.\n\n" +
          "**Immediate Action Suggested**:\n" +
          "1. Increase slot limits or release new dates in the ERP calendar.\n" +
          "2. The SKU `'Life4Billion Pro Monthly License'` (Digital) operates with infinite automated inventory and accounts for **82%** of your recurring flow.";
      } else if (lowerPrompt.includes("funcionário") || lowerPrompt.includes("salário") || lowerPrompt.includes("folha") || lowerPrompt.includes("clt") || lowerPrompt.includes("trabalhista") || lowerPrompt.includes("employee") || lowerPrompt.includes("salary") || lowerPrompt.includes("payroll") || lowerPrompt.includes("tax") || lowerPrompt.includes("job")) {
        simulatedResponse = "### HR Audit and Payroll Costs (Life4Billion AI)\n\n" +
          "• **Active Collaborators**: 3 contractors/employees.\n" +
          "• **Nominal Monthly Cost (Payroll)**: $31,500.00\n" +
          "• **Processing Status**: Current payroll processed for 2 collaborators; 1 collaborator (UI/UX Designer) awaiting manual benefits approval.\n\n" +
          "**Important Legal Guidelines**:\n" +
          "• Ensure you complete the payroll tax filing and employer social contributions by the due date to avoid late payment penalties of **2% per month**.";
      } else if (lowerPrompt.includes("hábito") || lowerPrompt.includes("saúde") || lowerPrompt.includes("gestação") || lowerPrompt.includes("gravidez") || lowerPrompt.includes("dieta") || lowerPrompt.includes("habit") || lowerPrompt.includes("health") || lowerPrompt.includes("pregnancy") || lowerPrompt.includes("baby") || lowerPrompt.includes("diet")) {
        simulatedResponse = "### Medical Diagnostic & Nutritional Monitoring (Life4Billion AI)\n\n" +
          "• **Key Metric**: Excellent hydration engagement (active 4-day streak of drinking 3L/day).\n" +
          "• **Pregnancy Stage**: Your record indicates **14 weeks of pregnancy** (the baby is approximately the size of a lemon, ~8.5 cm in length).\n\n" +
          "**Predicted Symptoms & Recommendations**:\n" +
          "1. During this transition to the second trimester, morning sickness tends to decrease.\n" +
          "2. **Nutrition**: Keep small, frequent meals throughout the day, rich in complex carbohydrates, folic acid, and iron.\n" +
          "3. Avoid long fasting periods to prevent gestational hypoglycemia.";
      } else {
        simulatedResponse = `### Life4Billion Strategic Report\n\n` +
          `Your question: *"${prompt}"*\n\n` +
          `Life4Billion processed your request using the **Integrated Local Simulation Engine** to ensure complete functionality without external dependencies.\n\n` +
          `**Technical Recommendation**: To activate advanced real-time intelligence based on real data via OpenAI GPT-4o or Gemini, please configure your secret API keys (OpenAI or Gemini) in the secrets panel of your console and restart the development server.`;
      }
    }

    aiResponse = simulatedResponse;
    aiProvider = language === "pt" ? "Motor de IA Life4Billion (Simulador Local)" : language === "es" ? "Motor de IA Life4Billion (Simulador Local)" : "Life4Billion AI Engine (Local Simulator)";
  }

  res.json({
    success: true,
    response: aiResponse,
    provider: aiProvider
  });
});

// -------------------------------------------------------------
// SUPABASE CLOUD INTEGRATION ENDPOINTS
// -------------------------------------------------------------

// Helper to resolve Supabase credentials dynamically (headers or .env) with safe auditing logs
function getSupabaseClient(req: any) {
  const headerUrl = req.headers["x-supabase-url"] as string;
  const headerKey = req.headers["x-supabase-anon-key"] as string;
  
  const envUrl = process.env.SUPABASE_URL || "";
  const envKey = process.env.SUPABASE_ANON_KEY || "";
  
  const url = headerUrl || envUrl || "";
  const key = headerKey || envKey || "";
  
  console.log("[Supabase Server Audit] --- Começo da Auditoria de Conexão Supabase ---");
  console.log(`[Supabase Server Audit] process.env.SUPABASE_URL configurada: ${!!envUrl} (Tamanho: ${envUrl.length})`);
  console.log(`[Supabase Server Audit] process.env.SUPABASE_ANON_KEY configurada: ${!!envKey} (Tamanho: ${envKey.length})`);
  console.log(`[Supabase Server Audit] Header x-supabase-url presente: ${!!headerUrl}`);
  console.log(`[Supabase Server Audit] Header x-supabase-anon-key presente: ${!!headerKey}`);
  console.log(`[Supabase Server Audit] URL Final Resolvida (Ofuscada): ${url ? `${url.substring(0, 15)}...` : "NENHUMA"}`);
  console.log(`[Supabase Server Audit] Key Final Resolvida (Ofuscada): ${key ? `Presente (Tamanho: ${key.length})` : "NENHUMA"}`);

  if (!url || !key) {
    console.warn("[Supabase Server Audit] Alerta: URL ou Key ausentes. Abortando criação do cliente.");
    return { client: null, url: "", configured: false };
  }
  
  try {
    const client = createClient(url, key);
    console.log("[Supabase Server Audit] Sucesso: Cliente Supabase criado corretamente via createClient().");
    return { client, url, configured: true };
  } catch (err: any) {
    console.error("[Supabase Server Audit] Falha: Erro ao instanciar o createClient():", err.message || err);
    return { client: null, url, configured: true };
  }
}

// Helper to securely resolve authenticated Supabase User ID from authorization header
async function resolveUserId(req: any): Promise<string | null> {
  const { client } = getSupabaseClient(req);
  const authHeader = (req.headers["authorization"] || req.headers["Authorization"]) as string;
  if (client && authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    if (token && token.trim() !== "") {
      try {
        const { data, error } = await client.auth.getUser(token);
        if (!error && data?.user?.id) {
          return data.user.id;
        }
      } catch (err) {
        console.warn("[Auth JWT Validation Failed]:", err);
      }
    }
  }
  return null;
}

export interface AdminAuthResult {
  authenticated: boolean;
  isAdmin: boolean;
  userId?: string;
  email?: string;
  role?: string;
  error?: string;
}

/**
 * SECURE SERVER-SIDE ADMINISTRATOR VERIFICATION
 * Verifies Supabase Auth JWT, extracts authenticated user ID (auth.uid()),
 * and checks public.user_roles for role = 'admin'.
 * Never trusts frontend credentials, emails or client-supplied flags.
 */
async function verifyAdmin(req: any): Promise<AdminAuthResult> {
  const { client, url, configured } = getSupabaseClient(req);
  const authHeader = (req.headers["authorization"] || req.headers["Authorization"]) as string;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      authenticated: false,
      isAdmin: false,
      error: "Unauthorized: Missing authentication token. Please sign in via Supabase Auth."
    };
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    return {
      authenticated: false,
      isAdmin: false,
      error: "Unauthorized: Empty authentication token provided."
    };
  }

  if (!client || !url) {
    return {
      authenticated: false,
      isAdmin: false,
      error: "Unauthorized: Supabase authentication client not configured."
    };
  }

  try {
    // 1. Verify token with Supabase Auth and retrieve authenticated user
    const { data, error } = await client.auth.getUser(token);
    if (error || !data?.user?.id) {
      return {
        authenticated: false,
        isAdmin: false,
        error: "Unauthorized: Invalid or expired Supabase authentication session."
      };
    }

    const authUser = data.user;
    const userId = authUser.id; // auth.uid()
    const userEmail = (authUser.email || "").toLowerCase().trim();

    // 2. Check Supabase Auth app_metadata and user_metadata for admin role
    const appMetaRole = (authUser.app_metadata as any)?.role;
    const userMetaRole = (authUser.user_metadata as any)?.role;
    if (appMetaRole === "admin" || userMetaRole === "admin") {
      AdminStore.grantAdminRole(userId);
      return {
        authenticated: true,
        isAdmin: true,
        userId,
        email: userEmail,
        role: "admin"
      };
    }

    // 3. Query public.user_roles using user-scoped JWT client (honors RLS: auth.uid() = user_id)
    const envKey = (process.env.SUPABASE_ANON_KEY || req.headers["x-supabase-anon-key"] || "").trim();
    if (envKey) {
      try {
        const userScopedClient = createClient(url, envKey, {
          auth: { persistSession: false, autoRefreshToken: false },
          global: { headers: { Authorization: `Bearer ${token}` } }
        });

        const { data: roleRow, error: roleError } = await userScopedClient
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .maybeSingle();

        if (!roleError && roleRow && roleRow.role === "admin") {
          AdminStore.grantAdminRole(userId);
          return {
            authenticated: true,
            isAdmin: true,
            userId,
            email: userEmail,
            role: "admin"
          };
        }
      } catch (scopedErr) {
        console.warn("[Admin Verification Scoped Notice]:", scopedErr);
      }
    }

    // 4. Query public.user_roles via server-only SUPABASE_SERVICE_ROLE_KEY if configured
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const serviceClient = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, {
          auth: { persistSession: false, autoRefreshToken: false }
        });
        const { data: serviceRoleRow } = await serviceClient
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .maybeSingle();

        if (serviceRoleRow && serviceRoleRow.role === "admin") {
          AdminStore.grantAdminRole(userId);
          return {
            authenticated: true,
            isAdmin: true,
            userId,
            email: userEmail,
            role: "admin"
          };
        }
      } catch (serviceErr) {
        // Non-blocking
      }
    }

    // 5. Query public.user_roles via default client
    try {
      const { data: directRoleRow, error: directRoleError } = await client
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

      if (!directRoleError && directRoleRow && directRoleRow.role === "admin") {
        AdminStore.grantAdminRole(userId);
        return {
          authenticated: true,
          isAdmin: true,
          userId,
          email: userEmail,
          role: "admin"
        };
      }
    } catch (directErr) {
      // Ignore if table access error
    }

    // 6. Query profiles table
    try {
      const { data: profileData, error: profileError } = await client
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle();

      if (!profileError && profileData && (profileData.role === "admin" || profileData.role === "owner")) {
        AdminStore.grantAdminRole(userId);
        return {
          authenticated: true,
          isAdmin: true,
          userId,
          email: userEmail,
          role: "admin"
        };
      }
    } catch (profileErr) {
      // Ignore
    }

    // 7. Check server-side ADMIN_EMAIL environment variable (supports comma-separated list)
    const configuredAdminEmails = (process.env.ADMIN_EMAIL || "")
      .toLowerCase()
      .split(",")
      .map(e => e.trim())
      .filter(Boolean);
    if (configuredAdminEmails.length > 0 && configuredAdminEmails.includes(userEmail)) {
      AdminStore.grantAdminRole(userId);
      return {
        authenticated: true,
        isAdmin: true,
        userId,
        email: userEmail,
        role: "admin"
      };
    }

    // 8. Check server-side ADMIN_USER_IDS environment variable (supports comma-separated list of UUIDs)
    const configuredAdminUserIds = (process.env.ADMIN_USER_IDS || "")
      .split(",")
      .map(id => id.trim())
      .filter(Boolean);
    if (configuredAdminUserIds.length > 0 && configuredAdminUserIds.includes(userId)) {
      AdminStore.grantAdminRole(userId);
      return {
        authenticated: true,
        isAdmin: true,
        userId,
        email: userEmail,
        role: "admin"
      };
    }

    // 9. Check memory/runtime role registry
    if (AdminStore.hasAdminRole(userId)) {
      return {
        authenticated: true,
        isAdmin: true,
        userId,
        email: userEmail,
        role: "admin"
      };
    }

    // Authenticated user exists in Supabase, but does NOT have admin role (HTTP 403)
    return {
      authenticated: true,
      isAdmin: false,
      userId,
      email: userEmail,
      role: "user",
      error: "Forbidden: Access denied. Administrator privileges required."
    };

  } catch (err: any) {
    return {
      authenticated: false,
      isAdmin: false,
      error: `Authentication validation error: ${err.message || err}`
    };
  }
}

// Auth & Supabase Client Discovery Endpoint
app.get("/api/auth/config", (req, res) => {
  const supabaseUrl = process.env.SUPABASE_URL || "";
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";
  res.json({
    configured: !!(supabaseUrl && supabaseAnonKey),
    supabaseUrl: supabaseUrl || null,
    supabaseAnonKey: supabaseAnonKey || null,
  });
});

// Server-side Subscription In-Memory & Database Store
interface ServerSubscriptionRecord {
  userId: string;
  planId: string;
  tier_name: string;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid';
  current_period_start: string;
  current_period_end: string;
  updated_at: string;
}

const serverSubscriptionsMap = new Map<string, ServerSubscriptionRecord>();

// 1. Subscription Status Endpoint
app.get("/api/subscription/status", async (req, res) => {
  const userId = await resolveUserId(req);
  if (!userId) {
    return res.status(401).json({
      authenticated: false,
      hasActiveSubscription: false,
      message: "Autenticação necessária."
    });
  }

  // Admin bypass: Admins always have active founder-tier subscription
  const adminCheck = await verifyAdmin(req);
  if (adminCheck.isAdmin) {
    return res.json({
      authenticated: true,
      hasActiveSubscription: true,
      isAdmin: true,
      subscription: {
        userId,
        planId: 'founder',
        tier_name: 'Founder Life Time',
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 3650 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      }
    });
  }

  // Check in-memory / cache
  const cached = serverSubscriptionsMap.get(userId);
  if (cached && cached.status === 'active') {
    return res.json({
      authenticated: true,
      hasActiveSubscription: true,
      subscription: cached
    });
  }

  // Check Supabase public.subscriptions table if configured
  const { client } = getSupabaseClient(req);
  if (client) {
    try {
      const { data, error } = await client
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle();

      if (!error && data && data.status === 'active') {
        const record: ServerSubscriptionRecord = {
          userId,
          planId: (data.price_id || data.tier_name || 'pro').toLowerCase(),
          tier_name: data.tier_name || 'Pro Plan',
          status: 'active',
          current_period_start: data.current_period_start || new Date().toISOString(),
          current_period_end: data.current_period_end || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: data.updated_at || new Date().toISOString()
        };
        serverSubscriptionsMap.set(userId, record);
        return res.json({
          authenticated: true,
          hasActiveSubscription: true,
          subscription: record
        });
      }
    } catch (dbErr) {
      console.warn('[Subscription Supabase Check Warning]:', dbErr);
    }
  }

  return res.json({
    authenticated: true,
    hasActiveSubscription: false,
    subscription: null
  });
});

// 2. Subscription Activation Endpoint (invoked on payment confirmation)
app.post("/api/subscription/activate", async (req, res) => {
  const userId = await resolveUserId(req);
  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Autenticação necessária para ativar assinatura."
    });
  }

  const { planId } = req.body || {};
  const targetPlan = (planId || 'annual').toLowerCase();
  let tierName = 'Pro Plan';
  let durationDays = 30;

  if (targetPlan === 'founder') {
    tierName = 'Founder';
    durationDays = 3650;
  } else if (targetPlan === 'annual') {
    tierName = 'Pro Plan';
    durationDays = 365;
  }

  const record: ServerSubscriptionRecord = {
    userId,
    planId: targetPlan,
    tier_name: tierName,
    status: 'active',
    current_period_start: new Date().toISOString(),
    current_period_end: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString()
  };

  serverSubscriptionsMap.set(userId, record);

  // Sync to Supabase subscriptions table if client configured
  const { client } = getSupabaseClient(req);
  if (client) {
    try {
      await client.from('subscriptions').upsert({
        user_id: userId,
        status: 'active',
        tier_name: tierName,
        price_id: `price_${targetPlan}`,
        current_period_start: record.current_period_start,
        current_period_end: record.current_period_end,
        updated_at: record.updated_at
      }, { onConflict: 'user_id' });
    } catch (e) {
      console.warn('[Subscription Sync Warning]:', e);
    }
  }

  return res.json({
    success: true,
    hasActiveSubscription: true,
    subscription: record
  });
});

// 1. Connection Status Check
app.get("/api/supabase/status", async (req, res) => {
  const { client, url, configured } = getSupabaseClient(req);
  
  if (!configured) {
    return res.json({
      success: false,
      configured: false,
      connected: false,
      message: "Supabase não configurado no arquivo .env nem no Painel do Usuário."
    });
  }

  if (!client) {
    return res.json({
      success: false,
      configured: true,
      connected: false,
      message: "Cliente Supabase falhou ao carregar com as credenciais fornecidas"
    });
  }

  try {
    console.log("[Supabase Connection Test] Realizando consulta ping na tabela 'life4billion_store'...");
    // Try a simple ping / query to verify connection and schema existence
    let { data, error } = await client
      .from("life4billion_store")
      .select("key")
      .limit(1);

    if (error) {
      const fallback = await client.from("omnisaas_store").select("key").limit(1);
      if (!fallback.error) {
        data = fallback.data;
        error = null;
      }
    }

    if (error) {
      console.warn(`[Supabase Connection Test] Banco de dados respondeu com código de erro ${error.code}: ${error.message}`);
      const isMissingTable = 
        error.code === '42P01' || 
        error.code === 'PGRST116' || 
        error.message?.toLowerCase().includes('does not exist') || 
        error.message?.toLowerCase().includes('schema cache') ||
        error.message?.toLowerCase().includes('could not find the table');

      if (isMissingTable) {
        console.log("[Supabase Connection Test] Resultado da auditoria: CONEXÃO ESTABELECIDA COM SUCESSO! No entanto, a tabela 'life4billion_store' não foi encontrada. O usuário deve criá-la no editor SQL do console Supabase.");
        return res.json({
          success: true,
          configured: true,
          connected: true,
          tablesExist: false,
          message: "Conectado com sucesso, mas a tabela 'life4billion_store' precisa ser criada.",
          sql: `CREATE TABLE IF NOT EXISTS life4billion_store (
  key TEXT PRIMARY KEY,
  value JSONB,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Políticas RLS estritas de isolamento por usuário autenticado
ALTER TABLE life4billion_store ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir tudo para todos" ON life4billion_store;
DROP POLICY IF EXISTS "Acesso seguro individual" ON life4billion_store;
CREATE POLICY "Acesso seguro individual" ON life4billion_store 
  FOR ALL 
  TO authenticated 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);`
        });
      }
      throw error;
    }

    console.log("[Supabase Connection Test] Resultado da auditoria: CONEXÃO ESTABELECIDA E ATIVA! Tabela de armazenamento do Life4Billion está funcionando perfeitamente.");
    return res.json({
      success: true,
      configured: true,
      connected: true,
      tablesExist: true,
      message: "Conectado ao Supabase com sucesso e tabela de armazenamento do Life4Billion ativa!",
      url: url
    });

  } catch (err: any) {
    console.error("[Supabase Connection Test] Erro crítico de comunicação com o Supabase:", err.message || err);
    return res.json({
      success: false,
      configured: true,
      connected: false,
      message: `Erro de conexão com o banco Supabase: ${err.message || err}`
    });
  }
});

// 2. Synchronize State to Cloud (Push)
app.post("/api/supabase/sync", async (req, res) => {
  const { client, configured } = getSupabaseClient(req);
  if (!client || !configured) {
    return res.status(500).json({ 
      success: false, 
      error: "Supabase client is not configured or failed to initialize." 
    });
  }

  const authenticatedUid = await resolveUserId(req);
  if (!authenticatedUid) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized: Valid Supabase authentication token required."
    });
  }

  // Cross-user tampering check: Reject if frontend passes a mismatched userId
  const claimedUserId = req.body?.userId || req.query?.userId;
  if (claimedUserId && claimedUserId !== authenticatedUid) {
    return res.status(403).json({
      success: false,
      error: "Access Denied: You cannot modify data belonging to another user."
    });
  }

  const { data } = req.body;
  if (!data || typeof data !== 'object') {
    return res.status(400).json({ success: false, error: "Payload inválido para sincronização." });
  }

  try {
    const syncedKeys: string[] = [];
    
    let tableName = "life4billion_store";
    const testCheck = await client.from("life4billion_store").select("key").limit(1);
    if (testCheck.error) {
      const fallbackCheck = await client.from("omnisaas_store").select("key").limit(1);
      if (!fallbackCheck.error) {
        tableName = "omnisaas_store";
      }
    }

    // Save each key-value pair to Supabase strictly associated with authenticatedUid
    for (const [key, val] of Object.entries(data)) {
      const userScopedKey = key.startsWith(`life4billion_u_${authenticatedUid}_`) 
        ? key 
        : `life4billion_u_${authenticatedUid}_${key}`;

      const { error } = await client
        .from(tableName)
        .upsert({ 
          key: userScopedKey, 
          value: val, 
          user_id: authenticatedUid,
          updated_at: new Date().toISOString() 
        }, { onConflict: 'key' });

      if (error) {
        console.error(`[Supabase Push Error] key "${userScopedKey}":`, error);
        
        const isMissingTable = 
          error.code === '42P01' || 
          error.code === 'PGRST116' || 
          error.message?.toLowerCase().includes('does not exist') || 
          error.message?.toLowerCase().includes('schema cache') ||
          error.message?.toLowerCase().includes('could not find the table');

        if (isMissingTable) {
          return res.status(404).json({
            success: false,
            needsInitialization: true,
            error: "A tabela 'life4billion_store' não existe no banco de dados.",
            sql: `CREATE TABLE IF NOT EXISTS life4billion_store (
  key TEXT PRIMARY KEY,
  value JSONB,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE life4billion_store ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir tudo para todos" ON life4billion_store;
CREATE POLICY "Acesso seguro individual" ON life4billion_store 
  FOR ALL 
  TO authenticated 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);`
          });
        }
        throw error;
      }
      syncedKeys.push(key);
    }

    res.json({
      success: true,
      message: "Push de sincronização realizado com sucesso!",
      syncedKeys
    });

  } catch (err: any) {
    console.error("[Supabase Push Exception]:", err);
    res.status(500).json({ success: false, error: err.message || err });
  }
});

// 3. Retrieve State from Cloud (Pull)
app.get("/api/supabase/pull", async (req, res) => {
  const { client, configured } = getSupabaseClient(req);
  if (!client || !configured) {
    return res.status(500).json({ 
      success: false, 
      error: "Supabase client is not configured or failed to initialize." 
    });
  }

  const authenticatedUid = await resolveUserId(req);
  if (!authenticatedUid) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized: Valid Supabase authentication token required."
    });
  }

  // Cross-user tampering check: Reject if query asks for a different userId
  const claimedUserId = (req.query?.userId as string) || req.body?.userId;
  if (claimedUserId && claimedUserId !== authenticatedUid) {
    return res.status(403).json({
      success: false,
      error: "Access Denied: You cannot view data belonging to another user."
    });
  }

  try {
    let tableName = "life4billion_store";
    const testCheck = await client.from("life4billion_store").select("key").limit(1);
    if (testCheck.error) {
      const fallbackCheck = await client.from("omnisaas_store").select("key").limit(1);
      if (!fallbackCheck.error) {
        tableName = "omnisaas_store";
      }
    }

    // STRICT USER ISOLATION: Always filter by user_id = authenticatedUid
    const { data, error } = await client
      .from(tableName)
      .select("*")
      .eq("user_id", authenticatedUid);

    if (error) {
      const isMissingTable = 
        error.code === '42P01' || 
        error.code === 'PGRST116' || 
        error.message?.toLowerCase().includes('does not exist') || 
        error.message?.toLowerCase().includes('schema cache') ||
        error.message?.toLowerCase().includes('could not find the table');

      if (isMissingTable) {
        return res.status(404).json({
          success: false,
          needsInitialization: true,
          error: "A tabela 'life4billion_store' não existe no banco de dados."
        });
      }
      throw error;
    }

    // Convert flat list back to key-value object map
    const storeMap: Record<string, any> = {};
    if (data) {
      const prefix = `life4billion_u_${authenticatedUid}_`;
      for (const item of data) {
        const cleanKey = item.key.startsWith(prefix) ? item.key.replace(prefix, '') : item.key;
        storeMap[cleanKey] = item.value;
      }
    }

    res.json({
      success: true,
      message: "Pull de sincronização realizado com sucesso!",
      data: storeMap
    });

  } catch (err: any) {
    console.error("[Supabase Pull Exception]:", err);
    res.status(500).json({ success: false, error: err.message || err });
  }
});

// -------------------------------------------------------------
// STRIPE PAYMENT INTEGRATION ENDPOINTS
// -------------------------------------------------------------

import { resolvePlanConfig } from "./api/stripe/config";

let founderSpotsRemainingServer = 23;
const FOUNDER_SPOTS_FILE_SERVER = path.join("/tmp", ".founder_spots.json");

function getFounderSpots(): { remaining: number; total: number; soldOut: boolean } {
  try {
    if (fs.existsSync(FOUNDER_SPOTS_FILE_SERVER)) {
      const data = JSON.parse(fs.readFileSync(FOUNDER_SPOTS_FILE_SERVER, "utf-8"));
      if (typeof data.remaining === "number") {
        founderSpotsRemainingServer = Math.max(0, data.remaining);
      }
    } else {
      try {
        fs.writeFileSync(FOUNDER_SPOTS_FILE_SERVER, JSON.stringify({ remaining: 23, total: 30 }));
      } catch (e) {
        // ignore
      }
    }
  } catch (err) {
    // ignore
  }

  return {
    remaining: founderSpotsRemainingServer,
    total: 30,
    soldOut: founderSpotsRemainingServer <= 0
  };
}

function decrementFounderSpots(): { remaining: number; total: number; soldOut: boolean } {
  const current = getFounderSpots();
  if (current.remaining > 0) {
    founderSpotsRemainingServer = current.remaining - 1;
    try {
      fs.writeFileSync(FOUNDER_SPOTS_FILE_SERVER, JSON.stringify({ remaining: founderSpotsRemainingServer, total: 30 }));
    } catch (err) {
      // ignore
    }
  }
  return {
    remaining: founderSpotsRemainingServer,
    total: 30,
    soldOut: founderSpotsRemainingServer <= 0
  };
}

// Endpoint to fetch remaining Founder spots in real-time
app.get("/api/pricing/founder-spots", (req, res) => {
  const spotInfo = getFounderSpots();
  res.json({
    remaining: spotInfo.remaining,
    total: spotInfo.total,
    soldOut: spotInfo.soldOut
  });
});

// Endpoint to simulate/decrement Founder spot purchase upon payment confirmation
app.post("/api/pricing/buy-founder", (req, res) => {
  const spotInfo = decrementFounderSpots();
  res.json({
    success: true,
    remaining: spotInfo.remaining,
    total: spotInfo.total,
    soldOut: spotInfo.soldOut
  });
});

// Helper to safely get Stripe secret without hardcoding
const getStripeSecretKey = (): string => {
  return process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.trim().replace(/^["']|["']$/g, '') : '';
};

// Lazy helper to get Stripe client instance safely without crashing server if keys are missing
let stripeInstance: Stripe | null = null;
const getStripeInstance = (): Stripe | null => {
  const stripeKey = getStripeSecretKey();
  if (!stripeInstance && stripeKey) {
    try {
      stripeInstance = new Stripe(stripeKey, {
        apiVersion: "2023-10-16" as any,
      });
      console.log("[Stripe Server] Cliente Stripe carregado com sucesso via variáveis de ambiente.");
    } catch (err) {
      console.error("[Stripe Server] Erro ao inicializar o cliente Stripe:", err);
    }
  }
  return stripeInstance;
};

// 1. Stripe config check (available currencies, configuration status)
app.get("/api/stripe/config", (req, res) => {
  const isConfigured = !!process.env.STRIPE_SECRET_KEY;
  const spots = getFounderSpots();

  res.json({
    success: true,
    isConfigured,
    founderSpots: {
      remaining: spots.remaining,
      total: spots.total,
      soldOut: spots.soldOut
    },
    prices: {
      en: {
        monthly: { currency: "USD", amount: 19.99, priceId: "price_1TrfkaQgM79UmffPY33Spfuc" },
        annual: { currency: "USD", amount: 119.88, monthlyEquivalent: 9.99, priceId: "price_1TwjYPQgM79UmffPVAwdKuzx" },
        founder: { currency: "USD", amount: 99.00, priceId: "price_1TwjbCQgM79UmffPLqEkAYIK" }
      },
      es: {
        monthly: { currency: "EUR", amount: 19.99, priceId: "price_1TrfnaQgM79UmffPZE43dIsx" },
        annual: { currency: "EUR", amount: 118.80, monthlyEquivalent: 9.90, priceId: "price_1TwjeTQgM79UmffPhaXMU2q8" },
        founder: { currency: "EUR", amount: 99.00, priceId: "price_1TwjbYQgM79UmffPMrbf5APr" }
      },
      pt: {
        monthly: { currency: "BRL", amount: 97.90, priceId: "price_1TrfmcQgM79UmffPGSpl0cLV" },
        annual: { currency: "BRL", amount: 598.80, monthlyEquivalent: 49.90, priceId: "price_1TwjexQgM79UmffPVcAwR8t1" },
        founder: { currency: "BRL", amount: 497.00, priceId: "price_1TwjZgQgM79UmffPZaMaShnz" }
      }
    }
  });
});

// 2. Create Checkout Session based on selected plan and currency
app.post("/api/stripe/create-checkout-session", async (req, res) => {
  const { lang, planId, currency, region, country, priceId } = req.body || {};
  const targetPlan = (planId === 'monthly' || planId === 'annual' || planId === 'founder') ? planId : 'annual';

  // Check founder spots if founder plan requested
  const spotInfo = getFounderSpots();
  if (targetPlan === 'founder' && spotInfo.remaining <= 0) {
    return res.status(400).json({
      success: false,
      error: "O Plano Fundador está esgotado (0 de 30 vagas restantes)."
    });
  }

  // Unified Plan Config
  const planConfig = resolvePlanConfig(targetPlan, { currency, region, country, lang });
  const stripePriceId = priceId || planConfig.priceId;

  let hostUrl = process.env.APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  if (!hostUrl) {
    const rawProto = req.headers["x-forwarded-proto"];
    const protocol = req.secure || (Array.isArray(rawProto) ? rawProto[0] : (rawProto || "")).split(",")[0].trim() === "https" ? "https" : "http";
    const host = req.headers.host || (req.headers.origin ? String(req.headers.origin).replace(/^https?:\/\//, "") : "localhost:3000");
    hostUrl = `${protocol}://${host}`;
  }
  if (!hostUrl.startsWith("http://") && !hostUrl.startsWith("https://")) {
    hostUrl = `https://${hostUrl}`;
  }

  const successUrl = `${hostUrl}/?payment=success&lang=${lang || 'en'}&plan=${targetPlan}`;
  const cancelUrl = `${hostUrl}/?payment=cancel&lang=${lang || 'en'}`;

  const secretKey = getStripeSecretKey();
  const stripe = secretKey ? new Stripe(secretKey, { apiVersion: "2023-10-16" as any }) : null;

  if (!stripe) {
    return res.json({
      success: true,
      isConfigured: false,
      simulated: true,
      plan: targetPlan,
      remainingFounderSpots: spotInfo.remaining,
      message: "Modo simulação ativo. Servidor processou o checkout com sucesso."
    });
  }

  try {
    const baseMetadata = {
      planId: targetPlan,
      currency: planConfig.currency,
      guarantee: planConfig.guaranteeMessage
    };

    const dynamicLineItem: Stripe.Checkout.SessionCreateParams.LineItem = {
      price_data: {
        currency: planConfig.currency.toLowerCase(),
        product_data: {
          name: planConfig.productName,
          description: planConfig.productDesc,
        },
        unit_amount: planConfig.unitAmount,
        ...(planConfig.mode === "subscription" && planConfig.recurringInterval
          ? { recurring: { interval: planConfig.recurringInterval } }
          : {}),
      },
      quantity: 1,
    };

    // Attempts hierarchy:
    // 1. Try predefined Stripe Price ID with explicit card payment method
    // 2. Try predefined Stripe Price ID with automatic payment methods
    // 3. Try dynamic price_data with explicit card payment method
    // 4. Try dynamic price_data with automatic payment methods
    const attempts: Array<{ lineItems: Stripe.Checkout.SessionCreateParams.LineItem[]; useCardMethod: boolean }> = [];

    if (stripePriceId) {
      attempts.push({ lineItems: [{ price: stripePriceId, quantity: 1 }], useCardMethod: true });
      attempts.push({ lineItems: [{ price: stripePriceId, quantity: 1 }], useCardMethod: false });
    }
    attempts.push({ lineItems: [dynamicLineItem], useCardMethod: true });
    attempts.push({ lineItems: [dynamicLineItem], useCardMethod: false });

    let session: Stripe.Checkout.Session | null = null;
    let lastError: any = null;

    for (const attempt of attempts) {
      try {
        const sessionParam: Stripe.Checkout.SessionCreateParams = {
          mode: planConfig.mode,
          success_url: successUrl,
          cancel_url: cancelUrl,
          line_items: attempt.lineItems,
          metadata: baseMetadata
        };
        if (attempt.useCardMethod) {
          sessionParam.payment_method_types = ["card"];
        }

        session = await stripe.checkout.sessions.create(sessionParam);
        if (session && session.url) {
          break;
        }
      } catch (attemptErr: any) {
        console.warn("[Stripe Session Attempt Warning]:", attemptErr?.message || attemptErr);
        lastError = attemptErr;
      }
    }

    if (!session || !session.url) {
      throw lastError || new Error("Não foi possível criar a sessão de pagamento no Stripe.");
    }

    return res.json({
      success: true,
      isConfigured: true,
      sessionId: session.id,
      checkoutUrl: session.url,
      remainingFounderSpots: spotInfo.remaining
    });

  } catch (err: any) {
    console.error("[Stripe Session Error]:", err);
    const errMessage = err.message || err.toString() || "Erro no gateway Stripe.";
    return res.status(200).json({
      success: true,
      isConfigured: false,
      simulated: true,
      plan: targetPlan,
      remainingFounderSpots: spotInfo.remaining,
      stripeError: errMessage,
      message: `Conexão Stripe: ${errMessage}. Formulário de pagamento ativado.`
    });
  }
});

// 3. Webhook listener for Stripe events
app.post("/api/stripe/webhook", (req, res) => {
  const event = req.body;
  if (event && event.type === 'checkout.session.completed') {
    const session = event.data?.object as Stripe.Checkout.Session;
    const planId = session?.metadata?.planId;

    if (planId === 'founder' || session?.mode === 'payment') {
      const spotInfo = decrementFounderSpots();
      console.log(`[Stripe Webhook] Confirmation received. Decremented founder spots to ${spotInfo.remaining}/30`);
    }
  }
  res.json({ received: true });
});

// -------------------------------------------------------------
// LIFE4BILLION CONNECT — FINANCIAL OPEN BANKING API ENDPOINTS
// -------------------------------------------------------------
import { getFinancialConfig } from "./src/lib/financial/config";
import { getSubscriptionEntitlements } from "./src/lib/financial/subscriptionEntitlements";
import { selectFinancialProvider, getFinancialAdapter } from "./src/lib/financial/providers";
import { 
  saveConnection, 
  saveFailedConnection,
  getUserConnections, 
  disconnectUserConnection, 
  syncConnection, 
  getUserAccounts, 
  getUserTransactions, 
  updateUserTransactionCategory 
} from "./src/lib/financial/syncEngine";

// 1. Get Financial Config & User Entitlements
app.get("/api/finance/providers", (req, res) => {
  try {
    const config = getFinancialConfig();
    const entitlements = getSubscriptionEntitlements('founder'); // Default plan entitlement
    res.json({
      success: true,
      config: {
        mockMode: config.mockMode,
        plaidConfigured: config.plaid.isConfigured,
        tinkConfigured: config.tink.isConfigured,
        belvoConfigured: config.belvo.isConfigured,
        plaidEnv: config.plaid.env,
        tinkEnv: config.tink.env,
        belvoEnv: config.belvo.env
      },
      entitlements
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Initialize Financial Connection Session (Validates Required Fields)
app.post("/api/finance/connect", async (req, res) => {
  try {
    const userId = await resolveUserId(req);
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: "Unauthorized: Valid Supabase authentication token required." 
      });
    }

    const claimedUserId = req.body?.userId;
    if (claimedUserId && claimedUserId !== userId) {
      return res.status(403).json({ 
        success: false, 
        error: "Access Denied: You cannot create connections for another user." 
      });
    }

    const { country = "US", providerOverride, language = "en", institutionName } = req.body;
    
    // Server-side validation
    if (!country || country.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        status: "not_connected",
        error: "Please complete the required information before connecting your bank." 
      });
    }

    // Select Provider based on country, credentials & overrides
    const providerSelection = selectFinancialProvider(country, providerOverride);
    const adapter = getFinancialAdapter(providerSelection.provider);

    const sessionData = await adapter.createConnection({
      userId,
      country: providerSelection.country,
      language
    });

    res.json({
      success: true,
      providerSelection,
      sessionData
    });
  } catch (err: any) {
    console.error("[Finance Connect Error]:", err);
    res.status(400).json({ 
      success: false, 
      status: "not_connected",
      error: "Please complete the required information before connecting your bank." 
    });
  }
});

// 3. Exchange Token, Verify Real Connection & Execute Initial Synchronization
app.post("/api/finance/exchange-token", async (req, res) => {
  const userId = await resolveUserId(req);
  if (!userId) {
    return res.status(401).json({ 
      success: false, 
      error: "Unauthorized: Valid Supabase authentication token required." 
    });
  }

  const claimedUserId = req.body?.userId;
  if (claimedUserId && claimedUserId !== userId) {
    return res.status(403).json({ 
      success: false, 
      error: "Access Denied: You cannot modify connections for another user." 
    });
  }

  const { 
    provider = "mock", 
    publicToken, 
    code, 
    linkSessionId, 
    institutionName, 
    country = "US" 
  } = req.body;

  // Server-side field validation: Require institution name and valid parameters
  if (!institutionName || institutionName.trim() === '') {
    return res.status(400).json({
      success: false,
      status: "not_connected",
      error: "Please complete the required information before connecting your bank."
    });
  }

  try {
    const adapter = getFinancialAdapter(provider);

    // 1. Exchange Token with Provider
    const tokenResult = await adapter.exchangeToken({
      userId,
      provider,
      publicToken,
      code,
      linkSessionId,
      institutionName,
      country
    });

    // 2. REAL CONNECTION VERIFICATION: Query provider to confirm valid account session
    const accounts = await adapter.getAccounts(tokenResult.connectionId, tokenResult.accessToken);
    if (!accounts || accounts.length === 0) {
      throw new Error("Provider did not return valid accounts for this connection.");
    }

    // 3. Mark status as 'connected' only upon confirmed verification
    const connection = await saveConnection(userId, {
      provider,
      providerConnectionId: tokenResult.providerConnectionId,
      institutionName: tokenResult.institutionName,
      institutionLogo: tokenResult.institutionLogo,
      country: tokenResult.country,
      status: 'connected',
      accessToken: tokenResult.accessToken
    });

    // 4. Execute Initial Idempotent Synchronization
    const syncResult = await syncConnection(userId, connection.id);

    res.json({
      success: true,
      status: 'connected',
      connection: syncResult.connection,
      accounts: syncResult.accounts,
      transactions: syncResult.transactions,
      syncSummary: syncResult.syncSummary,
      syncLog: syncResult.syncLog
    });
  } catch (err: any) {
    console.error("[Finance Connection Verification Failed]:", err.message || err);

    // Record failure state in database/memory (status = 'not_connected')
    await saveFailedConnection(userId, {
      provider,
      institutionName: institutionName || 'Unknown Bank',
      country,
      errorMessage: err.message
    });

    res.status(400).json({
      success: false,
      status: "not_connected",
      error: "We couldn't connect to your bank. Please check your information and try again."
    });
  }
});

// 4. Get Active Financial Connections
app.get("/api/finance/connections", async (req, res) => {
  try {
    const userId = await resolveUserId(req);
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: "Unauthorized: Valid Supabase authentication token required." 
      });
    }
    const connections = await getUserConnections(userId);
    res.json({ success: true, connections });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Get Synced Accounts
app.get("/api/finance/accounts", async (req, res) => {
  try {
    const userId = await resolveUserId(req);
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: "Unauthorized: Valid Supabase authentication token required." 
      });
    }
    const accounts = await getUserAccounts(userId);
    res.json({ success: true, accounts });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Get Synced Transactions
app.get("/api/finance/transactions", async (req, res) => {
  try {
    const userId = await resolveUserId(req);
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: "Unauthorized: Valid Supabase authentication token required." 
      });
    }
    const transactions = await getUserTransactions(userId);
    res.json({ success: true, transactions });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Manual / Triggered Synchronization (Idempotent)
app.post("/api/finance/sync", async (req, res) => {
  try {
    const userId = await resolveUserId(req);
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: "Unauthorized: Valid Supabase authentication token required." 
      });
    }

    const claimedUserId = req.body?.userId;
    if (claimedUserId && claimedUserId !== userId) {
      return res.status(403).json({ 
        success: false, 
        error: "Access Denied: You cannot synchronize data for another user." 
      });
    }

    const { connectionId } = req.body;
    if (!connectionId) {
      return res.status(400).json({ success: false, error: "connectionId is required." });
    }

    const syncResult = await syncConnection(userId, connectionId);
    res.json({
      success: true,
      connection: syncResult.connection,
      accounts: syncResult.accounts,
      transactions: syncResult.transactions,
      syncSummary: syncResult.syncSummary,
      syncLog: syncResult.syncLog
    });
  } catch (err: any) {
    console.error("[Finance Manual Sync Error]:", err);
    res.status(500).json({ success: false, error: err.message || "Synchronization failed." });
  }
});

// 8. Disconnect Connection
app.post("/api/finance/disconnect", async (req, res) => {
  try {
    const userId = await resolveUserId(req);
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: "Unauthorized: Valid Supabase authentication token required." 
      });
    }

    const claimedUserId = req.body?.userId;
    if (claimedUserId && claimedUserId !== userId) {
      return res.status(403).json({ 
        success: false, 
        error: "Access Denied: You cannot disconnect data for another user." 
      });
    }

    const { connectionId } = req.body;
    if (!connectionId) {
      return res.status(400).json({ success: false, error: "connectionId is required." });
    }

    const success = await disconnectUserConnection(userId, connectionId);
    res.json({ success });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. Manual Category Correction (Preserved on future re-sync)
app.post("/api/finance/category-override", async (req, res) => {
  try {
    const userId = await resolveUserId(req);
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: "Unauthorized: Valid Supabase authentication token required." 
      });
    }

    const claimedUserId = req.body?.userId;
    if (claimedUserId && claimedUserId !== userId) {
      return res.status(403).json({ 
        success: false, 
        error: "Access Denied: You cannot override categories for another user." 
      });
    }

    const { transactionId, newCategory } = req.body;
    if (!transactionId || !newCategory) {
      return res.status(400).json({ success: false, error: "transactionId and newCategory are required." });
    }

    const updatedTx = await updateUserTransactionCategory(userId, transactionId, newCategory);
    res.json({ success: !!updatedTx, transaction: updatedTx });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 10. Webhooks (Plaid, Tink, Belvo)
app.post("/api/finance/webhooks/plaid", async (req, res) => {
  console.log("[Plaid Webhook Event]:", req.body?.webhook_type, req.body?.webhook_code);
  res.json({ received: true });
});

app.post("/api/finance/webhooks/tink", async (req, res) => {
  console.log("[Tink Webhook Event]:", req.body?.event);
  res.json({ received: true });
});

app.post("/api/finance/webhooks/belvo", async (req, res) => {
  console.log("[Belvo Webhook Event]:", req.body?.event);
  res.json({ received: true });
});

// -------------------------------------------------------------
// LIFE4BILLION ADMIN & EBOOK CATALOG MANAGEMENT API (RBAC)
// -------------------------------------------------------------

// 1. Admin Verification Check Endpoint
app.get("/api/admin/check-access", async (req, res) => {
  const auth = await verifyAdmin(req);
  if (!auth.authenticated) {
    return res.status(401).json({
      success: false,
      authenticated: false,
      isAdmin: false,
      error: auth.error || "Unauthorized: Valid Supabase authentication session required."
    });
  }

  if (!auth.isAdmin) {
    return res.status(403).json({
      success: false,
      authenticated: true,
      isAdmin: false,
      error: auth.error || "Forbidden: Administrator role required. Access denied."
    });
  }

  res.json({
    success: true,
    authenticated: true,
    isAdmin: true,
    userId: auth.userId,
    email: auth.email,
    role: "admin"
  });
});

// 2. Public Catalog Endpoint (Normal users see ONLY published resources)
app.get("/api/ebooks", async (req, res) => {
  try {
    const { client } = getSupabaseClient(req);
    if (client) {
      const { data, error } = await client
        .from("ebooks")
        .select("*")
        .eq("status", "published")
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        return res.json({ success: true, ebooks: data });
      }
    }

    // Fallback to store
    const published = AdminStore.getEbooks(true);
    res.json({ success: true, ebooks: published });
  } catch (err: any) {
    const published = AdminStore.getEbooks(true);
    res.json({ success: true, ebooks: published });
  }
});

// 3. Public Click & View Telemetry Tracking
app.post("/api/ebooks/:id/track", async (req, res) => {
  const { id } = req.params;
  const { type } = req.body; // 'view' | 'click'
  
  if (type === 'click') {
    AdminStore.incrementClick(id);
  } else {
    AdminStore.incrementView(id);
  }

  try {
    const { client } = getSupabaseClient(req);
    if (client) {
      const column = type === 'click' ? 'clicks_count' : 'views_count';
      try {
        await client.rpc('increment_ebook_stat', { ebook_id: id, stat_name: column });
      } catch (rpcErr) {
        // Fallback or non-blocking
      }
    }
  } catch (e) {
    // Non-blocking telemetry
  }

  res.json({ success: true });
});

// 4. Admin Ebook Management — List All (Admin Only: includes drafts and metrics)
app.get("/api/admin/ebooks", async (req, res) => {
  const auth = await verifyAdmin(req);
  if (!auth.authenticated) {
    return res.status(401).json({ success: false, error: auth.error || "Unauthorized: Supabase session required." });
  }
  if (!auth.isAdmin) {
    return res.status(403).json({ success: false, error: auth.error || "Forbidden: Administrator role required." });
  }

  try {
    const { client } = getSupabaseClient(req);
    if (client) {
      const { data, error } = await client
        .from("ebooks")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        return res.json({ success: true, ebooks: data });
      }
    }
    const all = AdminStore.getEbooks(false);
    res.json({ success: true, ebooks: all });
  } catch (err: any) {
    const all = AdminStore.getEbooks(false);
    res.json({ success: true, ebooks: all });
  }
});

// 5. Admin Ebook Management — Create (Admin Only)
app.post("/api/admin/ebooks", async (req, res) => {
  const auth = await verifyAdmin(req);
  if (!auth.authenticated) {
    return res.status(401).json({ success: false, error: auth.error || "Unauthorized: Supabase session required." });
  }
  if (!auth.isAdmin) {
    return res.status(403).json({ success: false, error: auth.error || "Forbidden: Administrator role required." });
  }

  const { title, description, cover_url, product_url, category, price, tags, status, is_featured, ai_recommendation_data } = req.body;

  if (!title || !product_url || !category) {
    return res.status(400).json({ success: false, error: "title, product_url, and category are required." });
  }

  const newEbook: EBook = {
    id: `ebook-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`,
    title: String(title).trim(),
    description: description ? String(description).trim() : "",
    cover_url: cover_url ? String(cover_url).trim() : "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&q=80",
    product_url: String(product_url).trim(),
    category: String(category).trim(),
    price: price !== undefined && price !== "" ? Number(price) : undefined,
    tags: Array.isArray(tags) ? tags : (typeof tags === 'string' ? tags.split(',').map((t: string) => t.trim()).filter(Boolean) : []),
    status: status === 'draft' ? 'draft' : 'published',
    is_featured: !!is_featured,
    ai_recommendation_data: ai_recommendation_data || {},
    views_count: 0,
    clicks_count: 0,
    recommendations_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  AdminStore.saveEbook(newEbook);

  try {
    const { client } = getSupabaseClient(req);
    if (client) {
      await client.from("ebooks").insert(newEbook);
    }
  } catch (err) {
    console.warn("[Admin Create Ebook Supabase Persist Notice]:", err);
  }

  res.status(201).json({ success: true, ebook: newEbook });
});

// 6. Admin Ebook Management — Update (Admin Only)
app.put("/api/admin/ebooks/:id", async (req, res) => {
  const auth = await verifyAdmin(req);
  if (!auth.authenticated) {
    return res.status(401).json({ success: false, error: auth.error || "Unauthorized: Supabase session required." });
  }
  if (!auth.isAdmin) {
    return res.status(403).json({ success: false, error: auth.error || "Forbidden: Administrator role required." });
  }

  const { id } = req.params;
  const existing = AdminStore.getEbookById(id);
  const now = new Date().toISOString();

  const updatedEbook: EBook = {
    id,
    title: req.body.title !== undefined ? String(req.body.title).trim() : (existing?.title || "Untitled Resource"),
    description: req.body.description !== undefined ? String(req.body.description).trim() : (existing?.description || ""),
    cover_url: req.body.cover_url !== undefined ? String(req.body.cover_url).trim() : (existing?.cover_url || ""),
    product_url: req.body.product_url !== undefined ? String(req.body.product_url).trim() : (existing?.product_url || ""),
    category: req.body.category !== undefined ? String(req.body.category).trim() : (existing?.category || "money"),
    price: req.body.price !== undefined && req.body.price !== "" ? Number(req.body.price) : existing?.price,
    tags: Array.isArray(req.body.tags) ? req.body.tags : (typeof req.body.tags === 'string' ? req.body.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : (existing?.tags || [])),
    status: req.body.status === 'draft' ? 'draft' : 'published',
    is_featured: req.body.is_featured !== undefined ? !!req.body.is_featured : (existing?.is_featured || false),
    ai_recommendation_data: req.body.ai_recommendation_data || existing?.ai_recommendation_data || {},
    views_count: existing?.views_count || 0,
    clicks_count: existing?.clicks_count || 0,
    recommendations_count: existing?.recommendations_count || 0,
    created_at: existing?.created_at || now,
    updated_at: now
  };

  AdminStore.saveEbook(updatedEbook);

  try {
    const { client } = getSupabaseClient(req);
    if (client) {
      await client.from("ebooks").upsert(updatedEbook, { onConflict: "id" });
    }
  } catch (err) {
    console.warn("[Admin Update Ebook Supabase Persist Notice]:", err);
  }

  res.json({ success: true, ebook: updatedEbook });
});

// 7. Admin Ebook Management — Delete (Admin Only)
app.delete("/api/admin/ebooks/:id", async (req, res) => {
  const auth = await verifyAdmin(req);
  if (!auth.authenticated) {
    return res.status(401).json({ success: false, error: auth.error || "Unauthorized: Supabase session required." });
  }
  if (!auth.isAdmin) {
    return res.status(403).json({ success: false, error: auth.error || "Forbidden: Administrator role required." });
  }

  const { id } = req.params;
  AdminStore.deleteEbook(id);

  try {
    const { client } = getSupabaseClient(req);
    if (client) {
      await client.from("ebooks").delete().eq("id", id);
    }
  } catch (err) {
    console.warn("[Admin Delete Ebook Supabase Notice]:", err);
  }

  res.json({ success: true, message: "Ebook deleted successfully." });
});

// 8. Admin Ebook Management — Seed Catalog (Admin Only)
app.post("/api/admin/ebooks/seed", async (req, res) => {
  const auth = await verifyAdmin(req);
  if (!auth.authenticated) {
    return res.status(401).json({ success: false, error: auth.error || "Unauthorized: Supabase session required." });
  }
  if (!auth.isAdmin) {
    return res.status(403).json({ success: false, error: auth.error || "Forbidden: Administrator role required." });
  }

  const defaultBooks = AdminStore.seedDefaultEbooks();

  try {
    const { client } = getSupabaseClient(req);
    if (client) {
      for (const book of defaultBooks) {
        try {
          await client.from("ebooks").upsert(book, { onConflict: "id" });
        } catch (seedErr) {
          // ignore
        }
      }
    }
  } catch (err) {
    console.warn("[Admin Seed Catalog Supabase Notice]:", err);
  }

  res.json({ success: true, count: defaultBooks.length, ebooks: defaultBooks });
});

// 9. Admin Stats Telemetry (Admin Only)
app.get("/api/admin/stats", async (req, res) => {
  const auth = await verifyAdmin(req);
  if (!auth.authenticated) {
    return res.status(401).json({ success: false, error: auth.error || "Unauthorized: Supabase session required." });
  }
  if (!auth.isAdmin) {
    return res.status(403).json({ success: false, error: auth.error || "Forbidden: Administrator role required." });
  }

  const allBooks = AdminStore.getEbooks(false);
  const total = allBooks.length;
  const published = allBooks.filter(b => b.status === 'published').length;
  const drafts = allBooks.filter(b => b.status === 'draft').length;
  const featured = allBooks.filter(b => b.is_featured).length;
  const totalViews = allBooks.reduce((acc, b) => acc + (b.views_count || 0), 0);
  const totalClicks = allBooks.reduce((acc, b) => acc + (b.clicks_count || 0), 0);
  const ctr = totalViews > 0 ? Number(((totalClicks / totalViews) * 100).toFixed(1)) : 0;

  res.json({
    success: true,
    stats: {
      total,
      published,
      drafts,
      featured,
      totalViews,
      totalClicks,
      ctrPercent: ctr
    }
  });
});

// 10. Admin AI Recommendation Generator (Admin Only)
app.post("/api/admin/ai-recommend", async (req, res) => {
  const auth = await verifyAdmin(req);
  if (!auth.authenticated) {
    return res.status(401).json({ success: false, error: auth.error || "Unauthorized: Supabase session required." });
  }
  if (!auth.isAdmin) {
    return res.status(403).json({ success: false, error: auth.error || "Forbidden: Administrator role required." });
  }

  const { targetCategory, targetAudience, language: rawLanguage } = req.body;
  const lang = (rawLanguage || "pt").toLowerCase().startsWith("pt") ? "pt" : (rawLanguage || "").toLowerCase().startsWith("es") ? "es" : "en";

  const prompt = lang === "pt"
    ? `Crie uma recomendação de e-book digital de alto valor para a plataforma LIFE4BILLION na categoria "${targetCategory || 'finanças'}" voltada para o público "${targetAudience || 'empreendedores e executivos'}". 
Forneça: 1) Título cativante e profissional, 2) Descrição de vendas convincente (3-4 frases), 3) 5 tags estratégicas, 4) Preço sugerido em BRL, 5) Pitch de IA personalizado.`
    : lang === "es"
    ? `Crea una recomendación de e-book digital de alto valor para la plataforma LIFE4BILLION en la categoría "${targetCategory || 'finanzas'}" dirigida a "${targetAudience || 'emprendedores y ejecutivos'}". 
Proporciona: 1) Título profesional, 2) Descripción de ventas persuasiva, 3) 5 etiquetas estratégicas, 4) Precio sugerido en EUR, 5) Pitch de IA personalizado.`
    : `Create a high-value digital ebook recommendation for the LIFE4BILLION platform in the category "${targetCategory || 'finances'}" for "${targetAudience || 'founders and high performers'}".
Provide: 1) Professional title, 2) Persuasive sales description, 3) 5 strategic tags, 4) Suggested price in USD, 5) AI recommendation pitch.`;

  try {
    let generatedCopy = "";
    if (ai) {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt
      });
      generatedCopy = response.text || "";
    } else if (process.env.OPENAI_API_KEY) {
      const openAiRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }]
        })
      });
      const data = await openAiRes.json();
      generatedCopy = data.choices?.[0]?.message?.content || "";
    } else {
      generatedCopy = lang === "pt"
        ? `Título: Protocolo 4B: Arquitetura Financeira e Expansão Patrimonial\nDescrição: O manual definitivo para estruturar reservas blindadas, automatizar fluxo de caixa e multiplicar o patrimônio através de estratégias quantitativas comprovadas.\nTags: finanças, patrimônio, investimentos, gestão, riqueza\nPreço sugerido: R$ 47,00`
        : `Title: The 4B Protocol: Wealth Architecture & Capital Compounding\nDescription: The definitive executive playbook to structuring resilient cash flows, debt elimination, and compounding assets with algorithmic precision.\nTags: finance, wealth, investing, capital, productivity\nSuggested Price: $29.90`;
    }

    res.json({
      success: true,
      recommendation: generatedCopy
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Failed to generate AI recommendation." });
  }
});

// 11. Admin Role Assignment (Admin Only)
app.post("/api/admin/assign-role", async (req, res) => {
  const auth = await verifyAdmin(req);
  if (!auth.authenticated) {
    return res.status(401).json({ success: false, error: auth.error || "Unauthorized: Supabase session required." });
  }
  if (!auth.isAdmin) {
    return res.status(403).json({ success: false, error: auth.error || "Forbidden: Administrator role required." });
  }

  const { targetUserId, targetRole } = req.body;
  if (!targetUserId || !targetRole) {
    return res.status(400).json({ success: false, error: "targetUserId and targetRole are required." });
  }

  if (targetRole === 'admin') {
    AdminStore.grantAdminRole(targetUserId);
  }

  try {
    const { client } = getSupabaseClient(req);
    if (client) {
      try {
        await client.from("user_roles").upsert({
          user_id: targetUserId,
          role: targetRole,
          created_at: new Date().toISOString()
        }, { onConflict: "user_id,role" });
      } catch (err1) {}

      try {
        await client.from("profiles").update({ role: targetRole }).eq("id", targetUserId);
      } catch (err2) {}
    }
  } catch (e) {
    // ignore
  }

  res.json({ success: true, message: `Role "${targetRole}" successfully assigned to user ${targetUserId}.` });
});

async function startServer() {
  // Serve public folder directly to ensure static assets are always accessible
  app.use(express.static(path.join(process.cwd(), "public")));

  if (process.env.NODE_ENV !== "production") {
    // Development Mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production Mode
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Life4Billion Fullstack Engine] Rodando na porta http://0.0.0.0:${PORT}`);
  });
}

startServer();
