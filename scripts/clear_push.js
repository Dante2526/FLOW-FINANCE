/**
 * Script de limpeza das push subscriptions expiradas no Supabase.
 *
 * IMPORTANTE: Este script requer a SUPABASE_SERVICE_ROLE_KEY para
 * conseguir atualizar dados de todos os usuários (bypassa a RLS).
 * A anon key NÃO funciona para esta operação.
 *
 * Como usar:
 *   $env:SUPABASE_SERVICE_ROLE_KEY="sua_service_role_key_aqui"
 *   node scripts/clear_push.js
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://xfsmdidfccgptfzjhhui.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('\n❌ ERRO: Variável SUPABASE_SERVICE_ROLE_KEY não definida.');
  console.error('   A anon key NÃO tem permissão para alterar dados de outros usuários (RLS).');
  console.error('\n   Execute assim (PowerShell):');
  console.error('   $env:SUPABASE_SERVICE_ROLE_KEY="sua_service_role_key_aqui"');
  console.error('   node scripts/clear_push.js\n');
  process.exit(1);
}

// Usa service role key para bypassar RLS e ter acesso administrativo
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

async function clearSubscriptions() {
  console.log('🔍 Buscando usuários com push_subscription ativa...');

  // Primeiro: contar quantos serão afetados
  const { count, error: countError } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .not('push_subscription', 'is', null);

  if (countError) {
    console.error('❌ Erro ao contar registros:', countError.message);
    process.exit(1);
  }

  if (count === 0) {
    console.log('✅ Nenhum usuário com push_subscription ativa. Banco já está limpo.');
    return;
  }

  console.log(`📋 Encontrado(s) ${count} usuário(s) com push_subscription. Limpando...`);

  const { data, error } = await supabase
    .from('users')
    .update({ push_subscription: null })
    .not('push_subscription', 'is', null)
    .select('email');

  if (error) {
    console.error('❌ Erro ao limpar subscriptions:', error.message);
    process.exit(1);
  }

  console.log(`✅ Push subscriptions limpas com sucesso para ${data?.length || 0} usuário(s):`);
  data?.forEach(u => console.log(`   - ${u.email}`));
}

clearSubscriptions();
