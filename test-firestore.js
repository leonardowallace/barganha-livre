const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDocs } = require('firebase/firestore');
const path = require('path');

// Carregar .env.local via fs simples desde que dotenv falhou
const fs = require('fs');
const envContent = fs.readFileSync(path.resolve(__dirname, '.env.local'), 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length === 2) env[parts[0].trim()] = parts[1].trim();
});

const firebaseConfig = {
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  console.log("Conectando ao projeto:", firebaseConfig.projectId);
  try {
    const col = collection(db, 'produtos');
    const snap = await getDocs(col);
    console.log(`Documentos encontrados: ${snap.size}`);
    
    if (snap.size > 0) {
      console.log("Exemplo de produto:", snap.docs[0].data().title);
    }
  } catch (e) {
    console.error("ERRO AO ACESSAR FIRESTORE:", e.message);
  }
}

run();
