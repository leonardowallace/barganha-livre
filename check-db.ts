import { rtdb } from './src/lib/firebase';
import { ref, get, limitToLast, query } from 'firebase/database';

async function checkDb() {
  try {
    const productsRef = ref(rtdb, 'produtos');
    const q = query(productsRef, limitToLast(20));
    const snap = await get(q);
    
    if (!snap.exists()) {
      console.log("Nenhum produto encontrado no RTDB.");
      return;
    }

    const data = snap.val();
    console.log(`PRODUTOS NO RTDB: ${Object.keys(data).length} registros encontrados.`);
    Object.keys(data).forEach(id => {
      const p = data[id];
      console.log(`- [${id}] ${p.title?.substring(0, 40)}... (Categoria: ${p.categoria})`);
    });
  } catch (e) {
    console.error("ERRO NO CHECK RTDB:", e);
  }
}

checkDb();
