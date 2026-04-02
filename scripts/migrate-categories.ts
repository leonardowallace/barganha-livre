import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, set } from 'firebase/database';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com`,
};

const MAPPING: Record<string, string> = {
  'eletronicos': 'tecnologia',
  'casa': 'casa_eletro',
  'moda': 'moda_beleza',
  'beleza': 'moda_beleza',
  'saude': 'saude_esportes',
  'esportes': 'saude_esportes',
  'estudos': 'lifestyle_kids',
  'automotivo': 'outros',
  'ofertas': 'outros',
  'automatico': 'tecnologia' // Fallback para erros anteriores
};

async function migrate() {
  console.log("Iniciando migração de categorias...");
  
  const app = initializeApp(firebaseConfig);
  const db = getDatabase(app);
  const prodRef = ref(db, 'produtos');
  
  const snapshot = await get(prodRef);
  if (!snapshot.exists()) {
    console.log("Nenhum produto para migrar.");
    return;
  }
  
  const data = snapshot.val();
  let updatedCount = 0;
  
  for (const id of Object.keys(data)) {
    const product = data[id];
    const oldCat = product.categoria;
    
    if (oldCat && MAPPING[oldCat]) {
      const newCat = MAPPING[oldCat];
      console.log(`Migrando [${id}] ${product.title.substring(0, 30)}...: ${oldCat} -> ${newCat}`);
      
      await set(ref(db, `produtos/${id}/categoria`), newCat);
      updatedCount++;
    }
  }
  
  console.log(`Migração concluída! ${updatedCount} produtos atualizados.`);
  process.exit(0);
}

migrate().catch(err => {
  console.error("Erro na migração:", err);
  process.exit(1);
});
