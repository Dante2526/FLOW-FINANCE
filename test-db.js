import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xfsmdidfccgptfzjhhui.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhmc21kaWRmY2NncHRmempoaHVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MTQ0NjAsImV4cCI6MjA4MDI5MDQ2MH0.4oFJ_L7fdjw2ttYtTko8EdTVhDpBtM5WWXQM4_N7zTU';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testInsert() {
  // We cannot bypass RLS for UPSERT unless authenticated.
  // Wait, let's login using an existing user?
  // I don't know the user's email or OTP.
  // Can we just try to insert and see the error?
  // If it's a CHECK constraint violation, postgres sometimes throws it before RLS.
  // If it's RLS, it will throw 401 or 403 or 404.
  const n = { 
    id: 'f872c057-0105-4bce-97a7-dbda2c050011',
    user_id: '20f70869-e47a-4019-87eb-91f16d013fa0', // The user ID from the image
    name: 'TEST_INVESTMENT',
    institution: 'TEST',
    type: 'fixed',
    amount: 1000,
    yield_rate: 10
  };

  const { data, error } = await supabase.from('investments').insert(n);
  console.log("Insert result:");
  console.log("Error:", error);
  console.log("Data:", data);
}

testInsert().catch(console.error);
