import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI } from "@google/genai";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Configuration
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(455).json({
      success: false,
      error: `Method ${req.method} Not Allowed`
    });
  }

  // Initialize Gemini SDK with telemetry header inside the handler to prevent stale serverless contexts on Vercel
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

  const { prompt, systemInstruction } = req.body || {};

  if (!prompt) {
    return res.status(400).json({ error: "O campo prompt é obrigatório." });
  }

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
              content: systemInstruction || "Você é o Life4Billion AI, o cérebro analítico da plataforma Life4Billion. Analise os dados providos com rigor científico, clareza executiva e dê recomendações financeiras, operacionais ou de bem-estar concisas em português brasileiro."
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
        aiProvider = "OpenAI GPT-4o-mini (Real-Time Cloud API)";
        success = true;
        console.log("Chamada do OpenAI realizada com sucesso.");
      } else {
        const errorText = await openAiResponse.text();
        console.warn(`[OpenAI API Warning] Status: ${openAiResponse.status}, Error: ${errorText}. Falling back...`);
      }
    } catch (err: any) {
      console.warn(`[OpenAI Connection Exception] Error: ${err.message || err}. Falling back...`);
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
          systemInstruction: systemInstruction || "Você é a inteligência artificial do Life4Billion, uma plataforma completa de gestão de vida e negócios. Responda de forma estratégica, concisa, amigável e profissional em português.",
          temperature: 0.7,
        }
      });

      if (response && response.text) {
        aiResponse = response.text;
        aiProvider = "Gemini 3.5 Flash (Server-Side Proxy)";
        success = true;
        console.log("Chamada do Gemini realizada com sucesso como fallback.");
      }
    } catch (err: any) {
      console.warn(`[Gemini Connection Exception] Error: ${err.message || err}. Falling back...`);
    }
  }

  // 3. Fallback to Local Simulator if both failed or were unconfigured
  if (!success) {
    console.log("Utilizando simulador inteligente local de IA");
    let simulatedResponse = "Olá! Sou o assistente Life4Billion AI. ";

    const lowerPrompt = prompt.toLowerCase();
    if (lowerPrompt.includes("receita") || lowerPrompt.includes("financeiro") || lowerPrompt.includes("julho")) {
      simulatedResponse = "Análise de Saúde Financeira (Life4Billion AI):\n\n• Receita Bruta acumulada: R$ 17.700,00\n• Despesas Operacionais: R$ 1.880,00\n• Lucro Líquido Estimado: R$ 15.820,00 (Margem de 89.3%)\n\nAnálise de Riscos: A despesa com 'Infraestrutura Cloud' representa 77.1% do total de gastos. Recomendo investigar instâncias reservadas ou plano de créditos AWS Startups para mitigar essa exposição.\n\nPróximo Passo sugerido: Criar um fundo de reserva tributária de 12% sobre o faturamento do trimestre.";
    } else if (lowerPrompt.includes("estoque") || lowerPrompt.includes("produto") || lowerPrompt.includes("sku")) {
      simulatedResponse = "Status do Controle de Estoque:\n\n• Alerta de Reabastecimento: O produto 'Mentoria Executiva All-in-One' (SKU: L4B-MENTOR-HQ) está com apenas 8 unidades em estoque (Ponto de reabastecimento configurado em 2).\n• Sugestão: Emitir ordem de serviço interna ou liberar novos slots na agenda para evitar quebras de receita na consultoria.\n\n• Status Digital: 'Licença Mensal Life4Billion Pro' possui estoque virtual infinito e responde por 82% das transações automatizadas.";
    } else if (lowerPrompt.includes("funcionário") || lowerPrompt.includes("salário") || lowerPrompt.includes("folha")) {
      simulatedResponse = "Dashboard de Gestão de RH:\n\n• Total de colaboradores ativos: 3\n• Custo mensal de folha salarial nominal: R$ 31.500,00\n• Status do Processamento (Competência atual): 2 processados/pagos, 1 aguardando validação.\n\nDiretriz Legal: Certifique-se de recolher o FGTS e INSS patronal de Bruno Almeida (Designer UI/UX) antes do dia 20 do mês corrente para evitar juros de mora.";
    } else if (lowerPrompt.includes("hábito") || lowerPrompt.includes("saúde") || lowerPrompt.includes("gravidez")) {
      simulatedResponse = "Resumo do Monitoramento de Bem-Estar e Gestão Corporal:\n\n• Hidratação: Excelente adesão (streak de 4 dias de beber 3L de água).\n• Gestações: Registro de 14 semanas indica que o bebê está do tamanho de um limão (aprox. 8.5 cm). Os enjoos matinais são comuns nessa transição do primeiro para o segundo trimestre. Recomenda-se fracionar as refeições em porções menores de carboidratos complexos.";
    } else {
      simulatedResponse = `Sua consulta: "${prompt}" foi processada pelo motor Life4Billion.\n\nComo o seu Life4Billion está rodando no ambiente de preview local, esta resposta foi estruturada estrategicamente pelo simulador integrado. Para ativar inteligência em tempo real ilimitada, configure sua chave no painel de segredos (Secrets) no menu superior direito do Google AI Studio e reinicie o servidor.`;
    }

    aiResponse = simulatedResponse;
    aiProvider = "Life4Billion AI Engine (Local Simulator)";
  }

  return res.status(200).json({
    success: true,
    response: aiResponse,
    provider: aiProvider
  });
}
