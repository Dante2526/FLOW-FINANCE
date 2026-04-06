const { createClient } = require('@supabase/supabase-js');
const webpush = require('web-push');

// 1. CONFIGURAÇÕES
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xfsmdidfccgptfzjhhui.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const VAPID_PUBLIC_KEY = 'BOabgmhdqm_B03NgjZgZUG4tT6whqH_sfr9-ZmMt1XY-lbI_ADbOzze9pRDU3tnj7oXttv01ZXcNKLhzeXlifC8';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = 'mailto:naylanmoreira350@gmail.com';

if (!SUPABASE_SERVICE_ROLE_KEY || !VAPID_PRIVATE_KEY) {
    console.error("ERRO: Variáveis de ambiente SUPABASE_SERVICE_ROLE_KEY ou VAPID_PRIVATE_KEY não configuradas.");
    process.exit(1);
}

// 2. INICIALIZAR CLIENTES
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

webpush.setVapidDetails(
    VAPID_SUBJECT,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
);

// 3. LÓGICA PRINCIPAL
async function checkAndNotify() {
    console.log("Iniciando verificação diária de contas...");

    // Data de hoje no formato YYYY-MM-DD
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    console.log(`Buscando contas para a data: ${todayStr}`);

    try {
        // Buscar todos os usuários que têm inscrição de Push
        const { data: users, error: userError } = await supabase
            .from('users')
            .select('id, email, profile, push_subscription, app_language')
            .not('push_subscription', 'is', null);

        if (userError) throw userError;
        if (!users || users.length === 0) {
            console.log("Nenhum usuário com inscrição de push encontrada.");
            return;
        }

        console.log(`Processando ${users.length} usuários...`);

        for (const user of users) {
            // O user_id nas tabelas de dados (transactions, etc.) é o UUID do auth.
            // Na tabela 'users', o campo 'id' já é esse UUID.
            const userId = user.id;

            // Buscar transações não pagas que vencem hoje para este usuário
            const { data: transactions, error: txError } = await supabase
                .from('transactions')
                .select('id, name, amount')
                .eq('user_id', userId)
                .eq('date', todayStr)
                .eq('paid', false);

            if (txError) {
                console.error(`Erro ao buscar transações para ${user.email}:`, txError);
                continue;
            }

            if (!transactions || transactions.length === 0) {
                console.log(`Sem contas vencendo hoje para ${user.email}`);
                continue;
            }

            console.log(`Encontradas ${transactions.length} contas para ${user.email}. Enviando push...`);

            // Preparar mensagens (Tradução simplificada baseada no idioma do usuário)
            const lang = user.app_language || 'pt';
            const currency = lang === 'pt' ? 'R$' : lang === 'en' ? '$' : '€';
            const locale = lang === 'pt' ? 'pt-BR' : lang === 'en' ? 'en-US' : 'es-ES';

            const title = lang === 'pt' ? "Conta Vencendo Hoje" : lang === 'en' ? "Bill Due Today" : "Cuenta Vence Hoy";
            
            for (const tx of transactions) {
                const formattedVal = tx.amount.toLocaleString(locale, { minimumFractionDigits: 2 });
                const body = lang === 'pt' 
                    ? `A conta "${tx.name}" no valor de ${currency} ${formattedVal} vence hoje.` 
                    : lang === 'en' 
                    ? `The bill "${tx.name}" of ${currency} ${formattedVal} is due today.`
                    : `La cuenta "${tx.name}" por valor de ${currency} ${formattedVal} vence hoy.`;

                const payload = JSON.stringify({
                    title,
                    body,
                    url: '/',
                    tag: `bill-due-${tx.id}`
                });

                try {
                    await webpush.sendNotification(user.push_subscription, payload);
                    console.log(`Notificação enviada com sucesso para ${user.email} (Conta: ${tx.name})`);
                    
                    // Opcional: Registrar a notificação no banco do usuário para que apareça na Central de notificações
                    await supabase.from('notifications').insert({
                        user_id: user.id,
                        title: title,
                        message: body,
                        date: `Hoje, ${today.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}`,
                        read: false,
                        type: 'alert'
                    });

                } catch (pushError) {
                    if (pushError.statusCode === 410 || pushError.statusCode === 404) {
                        console.warn(`Inscrição expirada ou inválida para ${user.email}. Removendo...`);
                        await supabase.from('users').update({ push_subscription: null }).eq('id', user.id);
                    } else {
                        console.error(`Erro ao enviar push para ${user.email}:`, pushError);
                    }
                }
            }
        }

        console.log("Verificação concluída com sucesso.");

    } catch (err) {
        console.error("ERRO CRÍTICO no script de verificação:", err);
        process.exit(1);
    }
}

checkAndNotify();
