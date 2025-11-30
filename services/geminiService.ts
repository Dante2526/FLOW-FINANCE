import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getFinancialAdvice = async (
  query: string,
  contextData: any
): Promise<string> => {
  try {
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