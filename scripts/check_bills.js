const admin = require('firebase-admin');
const webpush = require('web-push');

// 1. Initialize Firebase Admin
// The Service Account JSON is passed via environment variable
if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  console.error('ERROR: FIREBASE_SERVICE_ACCOUNT env var is missing.');
  process.exit(1);
}

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// 2. Configure Web Push
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT;

if (!vapidPublicKey || !vapidPrivateKey) {
  console.error('ERROR: VAPID keys are missing.');
  process.exit(1);
}

webpush.setVapidDetails(
  vapidSubject,
  vapidPublicKey,
  vapidPrivateKey
);

// Helper to check if a date string means "Today" in Brazil
function isDueToday(dateStr) {
  if (!dateStr) return false;

  // Get current date in Sao Paulo
  const now = new Date();
  const options = { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' };
  const parts = new Intl.DateTimeFormat('pt-BR', options).formatToParts(now);
  
  const dayBR = parts.find(p => p.type === 'day').value;
  const monthBR = parts.find(p => p.type === 'month').value; // "01"-"12"
  const yearBR = parts.find(p => p.type === 'year').value;
  
  // Lowercase check
  const lower = dateStr.toLowerCase();
  
  // Case 1: "Hoje"
  if (lower.includes('hoje')) return true;

  // Case 2: ISO "YYYY-MM-DD"
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
      return dateStr.startsWith(`${yearBR}-${monthBR}-${dayBR}`);
  }

  // Case 3: "DD Mmm" (e.g. "01 Dez")
  // We need to map short months to numbers
  const monthsMap = {
      'jan': '01', 'fev': '02', 'mar': '03', 'abr': '04', 'mai': '05', 'jun': '06',
      'jul': '07', 'ago': '08', 'set': '09', 'out': '10', 'nov': '11', 'dez': '12'
  };

  const splitParts = dateStr.split(' ');
  if (splitParts.length >= 2 && !dateStr.includes('-')) {
     const d = splitParts[0].padStart(2, '0');
     const mStr = splitParts[1].toLowerCase().slice(0, 3);
     const m = monthsMap[mStr];

     if (d === dayBR && m === monthBR) {
         return true;
     }
  }

  return false;
}

async function run() {
  console.log('Starting bill check...');
  
  try {
    const usersSnapshot = await db.collection('users').get();
    
    if (usersSnapshot.empty) {
        console.log('No users found.');
        return;
    }

    let notificationCount = 0;

    for (const userDoc of usersSnapshot.docs) {
       const userData = userDoc.data();
       const subscription = userData.pushSubscription;

       // Skip if user has no push subscription
       if (!subscription) continue;

       // Fetch user transactions
       const transactionsSnapshot = await db.collection('users').doc(userDoc.id).collection('transactions').get();
       
       if (transactionsSnapshot.empty) continue;

       const dueBills = [];

       transactionsSnapshot.forEach(doc => {
           const tx = doc.data();
           if (!tx.paid && isDueToday(tx.date)) {
               dueBills.push(tx);
           }
       });

       if (dueBills.length > 0) {
           console.log(`User ${userDoc.id} has ${dueBills.length} due bills.`);
           
           // Send a notification for each due bill (or a summary)
           // Strategy: Send 1 summary notification to avoid spam
           const title = "Contas Vencendo Hoje! 💸";
           let body = "";
           
           if (dueBills.length === 1) {
               body = `A conta ${dueBills[0].name} de R$ ${dueBills[0].amount} vence hoje.`;
           } else {
               body = `Você tem ${dueBills.length} contas vencendo hoje, incluindo ${dueBills[0].name}.`;
           }

           const payload = JSON.stringify({
               title: title,
               body: body,
               icon: 'https://api.dicebear.com/9.x/shapes/png?seed=FlowFinance&backgroundColor=0a0a0b',
               url: 'https://flow-finance-alpha.vercel.app/'
           });

           try {
               await webpush.sendNotification(subscription, payload);
               console.log(`Notification sent to ${userDoc.id}`);
               notificationCount++;
           } catch (err) {
               console.error(`Failed to send to ${userDoc.id}:`, err.message);
               // If 410 (Gone), remove subscription? (Optional enhancement)
           }
       }
    }
    
    console.log(`Job complete. Sent ${notificationCount} notifications.`);
    process.exit(0);

  } catch (error) {
    console.error('Fatal Error:', error);
    process.exit(1);
  }
}

run();