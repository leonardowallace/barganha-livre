import admin from 'firebase-admin';

// Inicializa o Admin SDK apenas uma vez (singleton)
if (!admin.apps.length) {
  try {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY 
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') 
      : undefined;

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
      databaseURL: `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com`,
    });
    console.log('[FIREBASE-ADMIN] Inicializado com sucesso.');
  } catch (error) {
    console.error('[FIREBASE-ADMIN] Erro na inicialização:', error);
  }
}

const dbAdmin = admin.database();
const authAdmin = admin.auth();

export { dbAdmin, authAdmin };
