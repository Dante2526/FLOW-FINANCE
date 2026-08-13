import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://xfsmdidfccgptfzjhhui.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhmc21kaWRmY2NncHRmempoaHVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MTQ0NjAsImV4cCI6MjA4MDI5MDQ2MH0.4oFJ_L7fdjw2ttYtTko8EdTVhDpBtM5WWXQM4_N7zTU';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function clearSubscriptions() {
  console.log("Fetching all users to clear their push subscriptions...");
  
  // Actually, we can just do an update without matching anything specific if we want to update all,
  // but let's see if supabase allows update without eq.
  // Actually, you usually need a filter. Let's just filter by push_subscription not null.
  const { data, error } = await supabase
    .from('users')
    .update({ push_subscription: null })
    .not('push_subscription', 'is', null)
    .select();

  if (error) {
    console.error("Error clearing subscriptions:", error);
    return;
  }
  
  console.log(`Successfully cleared push subscriptions for ${data?.length || 0} users.`);
}

clearSubscriptions();
