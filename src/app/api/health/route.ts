import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, limit, getDocs } from 'firebase/firestore';

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
    const testRef = collection(db, 'produtos');
    const q = await getDocs(testRef);
    diagnostics.firebase.connection = 'SUCCESS';
    diagnostics.firebase.count = q.size;
  } catch (error: any) {
    diagnostics.firebase.connection = 'FAILED';
    diagnostics.firebase.error = error.message;
  }

  return NextResponse.json(diagnostics);
}
