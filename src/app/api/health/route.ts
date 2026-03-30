import { NextResponse } from 'next/server';
import { rtdb } from '@/lib/firebase';
import { ref, get, limitToLast, query } from 'firebase/database';

export async function GET() {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    firebase: {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'Configurado' : 'MISSING',
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? 'Configurado' : 'MISSING',
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? 'Configurado' : 'MISSING',
    },
    env: {
      hasAdminPassword: !!process.env.ADMIN_PASSWORD,
    }
  };

  try {
    const testRef = ref(rtdb, 'produtos');
    const q = query(testRef, limitToLast(1));
    const snapshot = await get(q);
    diagnostics.firebase.connection = 'SUCCESS';
    diagnostics.firebase.hasData = snapshot.exists();
  } catch (error: any) {
    diagnostics.firebase.connection = 'FAILED';
    diagnostics.firebase.error = error.message;
  }

  return NextResponse.json(diagnostics);
}
