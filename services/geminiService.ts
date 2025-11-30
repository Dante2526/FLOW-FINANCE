import { GoogleGenAI } from "@google/genai";

// Helper to safely get the API Key without crashing the browser
const getApiKey = () => {
  // 1. Try standard process.env (Node/Webpack/Compatible environments)
  try {
    if (typeof process !== 'undefined' && process.env) {
      if (process.env.API_KEY) return process.env.API_KEY;
      if (process.env.VITE_API_KEY) return process.env.VITE_API_KEY;
      if (process.env.NEXT_PUBLIC_API_KEY) return process.env.NEXT_PUBLIC_API_KEY;
    }
  } catch (e) {
    // Ignore errors
  }

  // 2. Try import.meta.env (Standard Vite/Modern Browsers)
  try {
    // @ts-ignore
    if (import.meta && import.meta.env) {
      // @ts-ignore
      if (import.meta.env.API_KEY) return import.meta.env.API_KEY;
      // @ts-ignore
      if (import.meta.env.VITE_API_KEY) return import.meta.env.VITE_API_KEY;
    }
  } catch (e) {
    // Ignore errors
  }

  return undefined;
};

export const getFinancialAdvice = async (
  query: string,
  contextData: any
): Promise<string> => {
  try {
    const apiKey = getApiKey();

    if (!apiKey) {
      console.warn("Gemini API Key missing");
      return "A inteligência artificial não está configurada neste ambiente. Verifique as variáveis de ambiente na Vercel (VITE_API_KEY).";
    }

    // Initialize client lazily to prevent startup crashes
    const ai = new GoogleGenAI({ apiKey });
    const model = 'gemini-2.5-flash';
    
    const prompt = `
      Você é um assistente financeiro útil e conciso chamado "Flow".
      
      Dados de Contexto do Usuário (Finanças Atuais):
      ${JSON.stringify(contextData, null, 2)}
      
      Pergunta do Usuário: "${query}"
      
      Forneça uma resposta curta, amigável e acionável em Português do Brasil (máximo 2 frases).
      Se o usuário perguntar sobre os dados, use o contexto fornecido.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || "Não consegui gerar uma resposta no momento.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Desculpe, estou com problemas para conectar ao cérebro financeiro agora.";
  }
};