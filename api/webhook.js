
import { createClient } from '@supabase/supabase-js';

// URL do projeto Supabase (Hardcoded ou via ENV, idealmente ENV)
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xfsmdidfccgptfzjhhui.supabase.co';

export default async function handler(req, res) {
  // 1. Verificação de Método
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 2. Segurança Obrigatória: Verificar Token do Asaas
  const webhookToken = process.env.ASAAS_WEBHOOK_TOKEN;
  if (!webhookToken) {
     console.error('[Webhook Asaas] CRÍTICO: ASAAS_WEBHOOK_TOKEN não configurada no ambiente.');
     return res.status(500).json({ error: 'Server Configuration Error' });
  }

  const asaasToken = req.headers['asaas-access-token'];
  if (!asaasToken || asaasToken !== webhookToken) {
     console.warn('[Webhook Asaas] Tentativa de acesso não autorizada ao webhook.');
     return res.status(401).json({ error: 'Unauthorized' });
  }

  const { event, payment } = req.body;

  console.log(`[Webhook Asaas] Evento recebido: ${event} | ID: ${payment?.id}`);

  // 3. Filtrar Eventos: Só queremos saber de dinheiro na conta
  if (event !== 'PAYMENT_RECEIVED' && event !== 'PAYMENT_CONFIRMED') {
     // Retorna 200 para o Asaas parar de tentar reenviar eventos que não nos interessam (ex: cobrança criada)
     return res.status(200).json({ received: true, ignored: true });
  }

  // 4. Identificar o Usuário / Tipo de Pagamento
  const externalRef = payment?.externalReference;

  if (!externalRef) {
     console.error('[Webhook Asaas] Erro: Pagamento sem externalReference.');
     return res.status(400).json({ error: 'Payment missing externalReference' });
  }

  // Doações não concedem nem alteram o plano PRO
  if (externalRef.startsWith('donation:')) {
     console.log(`[Webhook Asaas] Doação confirmada: ID ${payment?.id} | Ref: ${externalRef}`);
     return res.status(200).json({ received: true, type: 'donation' });
  }

  const userEmail = externalRef;

  // 5. Inicializar Supabase com permissão de Admin (Service Role)
  // NECESSÁRIO: Adicione SUPABASE_SERVICE_ROLE_KEY nas variáveis de ambiente da Vercel
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseServiceKey) {
      console.error("[Webhook Asaas] CRÍTICO: SUPABASE_SERVICE_ROLE_KEY não configurada.");
      return res.status(500).json({ error: 'Server Configuration Error' });
  }

  const supabase = createClient(SUPABASE_URL, supabaseServiceKey);

  try {
      // 6. Buscar o perfil atual do usuário
      const { data: user, error: fetchError } = await supabase
        .from('users')
        .select('profile')
        .eq('email', userEmail)
        .single();

      if (fetchError || !user) {
          console.error(`[Webhook Asaas] Usuário não encontrado no banco: ${userEmail}`);
          return res.status(404).json({ error: 'User not found' });
      }

      // 7. LÓGICA DE 30 DIAS
      const now = new Date();
      // Adiciona 30 dias à data atual
      const expiryDate = new Date(now.setDate(now.getDate() + 30));

      const updatedProfile = {
          ...user.profile,
          isPro: true,
          subscriptionExpiry: expiryDate.toISOString(), // Salva a data de expiração
          subscriptionDate: new Date().toISOString(),   // Data do pagamento
          paymentId: payment.id,
          plan: 'MONTHLY'
      };

      const { error: updateError } = await supabase
        .from('users')
        .update({ profile: updatedProfile })
        .eq('email', userEmail);

      if (updateError) {
          console.error('[Webhook Asaas] Erro ao atualizar usuário:', updateError);
          throw updateError;
      }

      console.log(`[Webhook Asaas] SUCESSO: Usuário ${userEmail} renovado até ${expiryDate.toISOString()}.`);
      return res.status(200).json({ success: true });

  } catch (err) {
      console.error("[Webhook Asaas] Erro interno:", err);
      return res.status(500).json({ error: 'Internal Server Error' });
  }
}
