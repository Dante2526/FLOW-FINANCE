import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = 'https://xfsmdidfccgptfzjhhui.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhmc21kaWRmY2NncHRmempoaHVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MTQ0NjAsImV4cCI6MjA4MDI5MDQ2MH0.4oFJ_L7fdjw2ttYtTko8EdTVhDpBtM5WWXQM4_N7zTU';

async function testInsert() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/?apikey=${SUPABASE_ANON_KEY}`);
  const spec = await res.json();
  const invDef = spec.definitions.investments;
  fs.writeFileSync('schema.json', JSON.stringify(invDef, null, 2));
}

testInsert().catch(console.error);
