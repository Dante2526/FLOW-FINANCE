import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xfsmdidfccgptfzjhhui.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhmc21kaWRmY2NncHRmempoaHVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MTQ0NjAsImV4cCI6MjA4MDI5MDQ2MH0.4oFJ_L7fdjw2ttYtTko8EdTVhDpBtM5WWXQM4_N7zTU';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runTest() {
  const email = `test-${Date.now()}@example.com`;
  
  // 1. Sign up a new user via Supabase Auth
  const { data: authData, error: authErr } = await supabase.auth.signUp({
    email,
    password: 'Password123!',
  });
  
  if (authErr && !authErr.message.includes('already registered')) {
    console.error("Auth error:", authErr.message);
    // Might need email confirmation turned off, but often it returns a session anyway 
    // or we can test if it works.
  }
  
  let userId = authData?.user?.id;
  
  if (!userId) {
     console.log("Failed to get user id, auth returned:", authData);
     return;
  }
  
  console.log("Got user ID:", userId);

  // Array of types to test
  const typesToTest = ['fii', 'cdi', 'fixed', 'renda_fixa'];
  
  for (const t of typesToTest) {
    const inv = {
      user_id: userId,
      name: 'TEST_' + t,
      type: t,
      amount: 100,
      yield_rate: 10
    };
    
    console.log(`\nTesting type: '${t}'`);
    const { data: resData, error: resErr } = await supabase.from('investments').insert(inv);
    
    if (resErr) {
       console.log(`❌ Failed:`, resErr.message || resErr.details || resErr.hint);
       if (resErr.code) console.log(`   Code:`, resErr.code);
    } else {
       console.log(`✅ Success! '${t}' is valid.`);
    }
  }
}

runTest().catch(console.error);
