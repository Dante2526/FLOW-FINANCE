
import { GoogleGenAI, Type } from "@google/genai";

// Placeholder for advice, currently disabled as per previous file content
export const getFinancialAdvice = async (query: string, contextData: any): Promise<string> => {
  return "Funcionalidade de IA desativada.";
};

/**
 * Verifies a payment receipt image using Gemini Vision.
 * Checks for:
 * 1. Transaction validity (successful transfer)
 * 2. Amount (R$ 3,00)
 * 3. Not a scheduled transfer (Agendamento)
 * 4. Recipient matching (relaxed to partial match)
 * 5. Date validation (must be recent/today)
 * 6. Visual consistency (anti-tampering)
 * 7. Transaction ID (E2E) presence
 * 8. Bank layout authenticity
 * 9. Time validation (within reasonable window)
 */
export const verifyPaymentReceipt = async (base64Image: string): Promise<{ valid: boolean; reason: string }> => {
  try {
    // Initialize the API client HERE instead of globally to prevent crashes on app load
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
            1. VALOR: Deve ser exatamente "R$ 3,00" ou "3,00".
            2. DESTINATÁRIO: Deve conter "NAYLAN" (ignore case sensitive).
            3. STATUS: Deve indicar sucesso ("Transferência realizada", "Enviado", "Concluído").
            4. DATA: Deve ser HOJE (${todayDate}). Aceite datas com formato diferente (ex: "24 mai") desde que correspondam a hoje.
            5. ID DA TRANSAÇÃO (E2E): Deve estar visível e legível.
            
            BARREIRAS DE SEGURANÇA (CRITÉRIOS DE REJEIÇÃO):
            - JANELA DE TEMPO: Verifique o horário da transação no comprovante. Se a diferença para a hora atual (${currentTime}) for maior que 40 minutos, REJEITE. (Ex: Se agora é 14:00 e o pix foi 08:00, rejeite. Motivo: "Comprovante antigo").
            - AGENDAMENTO: Rejeite imediatamente palavras como "Agendamento", "Agendado", "Programado".
            - MONTAGEM: Se a fonte do valor/nome for diferente do resto, rejeite.
            - TELA DE CONFIRMAÇÃO: Se não tiver o código de autenticação final, rejeite.
            - LAYOUT SUSPEITO: Se as fontes não parecerem oficiais do banco (ex: Arial genérica em vez da fonte do Nubank).

            Retorne APENAS um JSON seguindo este schema exato.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            valid: { type: Type.BOOLEAN, description: "True APENAS se passar em TODAS as verificações, incluindo horário recente." },
            reason: { type: Type.STRING, description: "Explicação curta e direta em Português (ex: 'Horário expirado', 'Valor incorreto', 'Layout suspeito')." }
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
