
import { GoogleGenAI, Type } from "@google/genai";

// Placeholder for advice, currently disabled
export const getFinancialAdvice = async (query: string, contextData: any): Promise<string> => {
  return "Funcionalidade de IA desativada.";
};

/**
 * Verifies a payment receipt image using Gemini Vision.
 * Checks for transaction validity, amount, date, etc.
 */
export const verifyPaymentReceipt = async (base64Image: string): Promise<{ valid: boolean; reason: string }> => {
  
  // --- MODO SIMULAÇÃO (FALLBACK) ---
  // Se a chave de API não estiver presente (ambiente de teste/portfolio), 
  // simulamos uma validação bem-sucedida para não travar o uso do app.
  if (!process.env.API_KEY) {
    console.warn("⚠️ API_KEY do Gemini não encontrada. Usando modo de simulação.");
    
    // Simula o tempo de processamento da IA (2 segundos)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Retorna sucesso fictício para permitir o fluxo da UI
    return {
      valid: true,
      reason: "Comprovante validado (Modo Simulação)"
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Remove header if present (data:image/jpeg;base64,)
    const cleanBase64 = base64Image.split(',')[1] || base64Image;
    
    // Get current date and time context for the AI
    const now = new Date();
    const todayDate = now.toLocaleDateString('pt-BR'); // e.g., "24/05/2025"
    const currentTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); // e.g., "14:30"
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg', // Assuming JPEG/PNG
              data: cleanBase64
            }
          },
          {
            text: `Aja como um auditor financeiro antifraude especializado em Pix. Analise este comprovante com rigor forense.
            
            CONTEXTO TEMPORAL OBRIGATÓRIO:
            - Data de Hoje: ${todayDate}
            - Hora Agora: ${currentTime}
            
            DADOS OBRIGATÓRIOS PARA APROVAÇÃO:
            1. VALOR: Deve ser "R$ 7,00" ou "7,00".
            2. STATUS: Deve indicar sucesso ("Transferência realizada", "Enviado", "Concluído").
            3. DATA: Deve ser HOJE (${todayDate}) ou muito recente.
            
            Se o comprovante parecer legítimo e o valor for 7 reais, aprove.

            Retorne APENAS um JSON seguindo este schema exato.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            valid: { type: Type.BOOLEAN, description: "True se o comprovante for válido e de R$ 7,00." },
            reason: { type: Type.STRING, description: "Explicação curta." }
          },
          required: ["valid", "reason"]
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    return {
      valid: result.valid === true,
      reason: result.reason || "Não foi possível ler o comprovante."
    };

  } catch (error) {
    console.error("Erro ao verificar comprovante:", error);
    return { valid: false, reason: "Erro técnico na verificação. Tente novamente." };
  }
};
