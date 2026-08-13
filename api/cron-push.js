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
    const errors = [];

    try {
        const isTestMode = req.query?.test === 'true' || req.url?.includes('test=true');
        const isDebugMode = req.query?.debug === 'true' || req.url?.includes('debug=true');

        let query = supabase.from('users').select('email, profile, push_subscription, app_language');
        
        if (!isDebugMode) {
             query = query.not('push_subscription', 'is', null);
        }

        const { data: publicUsers, error: userError } = await query;

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
            return res.status(200).json({ message: "Nenhum vínculo estrutural encontrado.", processed: 0, sent: 0, errors });
        }

        const userIds = users.map(u => u.id);
        
        if (isDebugMode) {
             const { data: debugTxs } = await supabase.from('transactions').select('id, name, date, paid, user_id').in('user_id', userIds).order('date', { ascending: false });
             
             // Filtrando manualmente para encontrar a conta de hoje na memória e ver exatamente como ela está salva!
             const hojeManual = debugTxs?.filter(t => t.date && t.date.includes(todayStr));
             
             return res.status(200).json({ 
                 message: "MODO DEBUG 2", 
                 todayStr_gerado: todayStr,
                 total_transacoes: debugTxs?.length || 0,
                 achei_alguma_com_a_data_de_hoje: hojeManual,
                 ultimas_3_transacoes_salvas: debugTxs?.slice(0, 3) || []
             });
        }

        const { data: allTransactions, error: txError } = await supabase
            .from('transactions')
            .select('id, user_id, name, amount, date')
            .in('user_id', userIds)
            .eq('date', todayStr)
            .eq('paid', false);

        if (txError) throw txError;

        const txByUser = new Map();
        
        if (isTestMode) {
             for (const u of users) {
                 txByUser.set(u.id, [{
                     id: 'test-id',
                     user_id: u.id,
                     name: 'Ping Test (Flow Finance)',
                     amount: 0
                 }]);
             }
        } else {
             for (const tx of allTransactions || []) {
                 if (!txByUser.has(tx.user_id)) {
                     txByUser.set(tx.user_id, []);
                 }
                 txByUser.get(tx.user_id).push(tx);
             }
        }

        for (const user of users) {
            processed++;
            const transactions = txByUser.get(user.id);

            if (!transactions || transactions.length === 0) continue;

            for (const tx of transactions) {
                const title = `⚠️ Conta Vencendo Hoje!`;
                const body = `${tx.name} no valor de R$ ${(tx.amount || 0).toFixed(2).replace('.', ',')}`;
                
                const payload = JSON.stringify({ title, body, url: '/', tag: `bill-due-${tx.id}` });
                
                try {
                    await webpush.sendNotification(user.push_subscription, payload);
                    sent++;
                    
                    if (!isTestMode) {
                        await supabase.from('notifications').upsert({
                            id: `bill-due-${tx.id}`,
                            user_id: user.id,
                            title: title,
                            message: body,
                            date: todayStr,
                            read: false,
                            type: 'alert'
                        }, { onConflict: 'id' });
                    }
                } catch (pushError) {
                    if (pushError.statusCode === 410 || pushError.statusCode === 404) {
                        await supabase.from('users').update({ push_subscription: null }).eq('id', user.id);
                        errors.push(`Token expirado revogado para ${user.email}`);
                    } else {
                        errors.push(`Erro VAPID/Push para ${user.email}: ${pushError.message}`);
                    }
                }
            }
        }

        return res.status(200).json({ message: "Processamento diário concluído.", processed, sent, errors });

    } catch (err) {
        console.error("ERRO CRÍTICO no cron:", err);
        return res.status(500).json({ 
            error: 'Erro interno no script de verificação.', 
            details: err?.message || err?.toString() || 'Erro desconhecido' 
        });
    }
}
