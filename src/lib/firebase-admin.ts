import admin from 'firebase-admin';

// Inicializa o Admin SDK apenas uma vez (singleton)
if (!admin.apps.length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY 
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') 
    : undefined;
  
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  // Só inicializa se tivermos as credenciais mínimas. 
  // Caso contrário (ambiente de build), o SDK será inicializado sob demanda ou falhará apenas no uso.
  if (privateKey && clientEmail && projectId) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        databaseURL: `https://${projectId}-default-rtdb.firebaseio.com`,
      });
      console.log('[FIREBASE-ADMIN] Inicializado com sucesso.');
    } catch (error) {
      console.error('[FIREBASE-ADMIN] Erro na inicialização:', error);
    }
  } else {
    console.warn('[FIREBASE-ADMIN] Credenciais ausentes. Ignorando inicialização (comum em ambiente de build).');
  }
}

// Proxies para acesso seguro e preguiçoso (evita erro no build)
export const dbAdmin = new Proxy({} as admin.database.Database, {
  get(target, prop) {
    if (!admin.apps.length) return undefined;
    const db = admin.database();
    return (db as any)[prop];
  }
});

export const authAdmin = new Proxy({} as admin.auth.Auth, {
  get(target, prop) {
    if (!admin.apps.length) return undefined;
    const auth = admin.auth();
    return (auth as any)[prop];
  }
});
