import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xfsmdidfccgptfzjhhui.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const VAPID_PUBLIC_KEY = 'BOabgmhdqm_B03NgjZgZUG4tT6whqH_sfr9-ZmMt1XY-lbI_ADbOzze9pRDU3tnj7oXttv01ZXcNKLhzeXlifC8';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = 'mailto:naylanmoreira350@gmail.com';

export default async function handler(req, res) {
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

    if (!SUPABASE_SERVICE_ROLE_KEY || !VAPID_PRIVATE_KEY) {
        console.error("ERRO: Variáveis de ambiente SUPABASE_SERVICE_ROLE_KEY ou VAPID_PRIVATE_KEY não configuradas.");
        return res.status(500).json({ error: 'Configurações VAPID ou Supabase ausentes nas variáveis de ambiente da Vercel.' });
    }

    try {
        webpush.setVapidDetails(
            VAPID_SUBJECT,
            VAPID_PUBLIC_KEY,
            VAPID_PRIVATE_KEY
        );
    } catch (e) {
        return res.status(500).json({ error: 'Erro ao configurar VAPID', details: e.message });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log("Iniciando verificação diária de contas (Vercel Cron)...");

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    let processed = 0;
    let sent = 0;

    try {
        // 1. Puxar apenas a tabela pública sem requerer 'id' que não existe
        const { data: publicUsers, error: userError } = await supabase
            .from('users')
            .select('email, profile, push_subscription, app_language')
            .not('push_subscription', 'is', null);

        if (userError) throw userError;
        if (!publicUsers || publicUsers.length === 0) {
            return res.status(200).json({ message: "Nenhum usuário com push encontrado.", processed: 0, sent: 0 });
        }

        // 2. Extrair o UID (user_id) oculto cruzando com o banco interno de Auth (Service Role required)
        const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
        if (authError) throw authError;

        const authUsers = authData?.users || [];
        const users = [];

        for (const pub of publicUsers) {
             const matchedAuth = authUsers.find(a => a.email && a.email.toLowerCase() === pub.email.toLowerCase());
             if (matchedAuth) {
                 users.push({ ...pub, id: matchedAuth.id });
             } else {
                 console.warn(`Aviso: Usuário ${pub.email} não localizado na tabela Auth original.`);
             }
        }

        if (users.length === 0) {
            return res.status(200).json({ message: "Nenhum vínculo estrutural encontrado.", processed: 0, sent: 0 });
        }

        const userIds = users.map(u => u.id);
        const { data: allTransactions, error: txError } = await supabase
            .from('transactions')
            .select('id, user_id, name, amount')
            .in('user_id', userIds)
            .eq('date', todayStr)
            .eq('paid', false);

        if (txError) throw txError;

        const txByUser = new Map();
        for (const tx of allTransactions || []) {
            if (!txByUser.has(tx.user_id)) {
                txByUser.set(tx.user_id, []);
            }
            txByUser.get(tx.user_id).push(tx);
        }

        for (const user of users) {
            processed++;
            const transactions = txByUser.get(user.id);

            if (!transactions || transactions.length === 0) continue;

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

                const payload = JSON.stringify({ title, body, url: '/', tag: `bill-due-${tx.id}` });

                try {
                    await webpush.sendNotification(user.push_subscription, payload);
                    sent++;
                    
                    await supabase.from('notifications').upsert({
                        id: `bill-due-${tx.id}`,
                        user_id: user.id,
                        title: title,
                        message: body,
                        date: `Hoje, ${today.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}`,
                        read: false,
                        type: 'alert'
                    }, { onConflict: 'id' });

                } catch (pushError) {
                    if (pushError.statusCode === 410 || pushError.statusCode === 404) {
                        await supabase.from('users').update({ push_subscription: null }).eq('id', user.id);
                    } else {
                        console.error(`Erro Push para ${user.email}:`, pushError);
                    }
                }
            }
        }

        return res.status(200).json({ message: "Processamento diário concluído.", processed, sent });

    } catch (err) {
        console.error("ERRO CRÍTICO no cron:", err);
        return res.status(500).json({ 
            error: 'Erro interno no script de verificação.', 
            details: err?.message || err?.toString() || 'Erro desconhecido' 
        });
    }
}
