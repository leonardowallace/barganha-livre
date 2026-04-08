import { NextResponse } from 'next/server';
import { authAdmin, dbAdmin } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    const { email, password, name, inviteKey } = await request.json();

    if (!email || !password || !name || !inviteKey) {
      return NextResponse.json({ error: 'Todos os campos são obrigatórios' }, { status: 400 });
    }

    const keyViewer = process.env.INVITE_KEY_VIEWER || 'promo-viewer-2026';
    const keyEditor = process.env.INVITE_KEY_EDITOR || 'promo-editor-2026';

    let role: 'viewer' | 'editor';

    if (inviteKey === keyEditor) {
      role = 'editor';
    } else if (inviteKey === keyViewer) {
      role = 'viewer';
    } else {
      return NextResponse.json({ error: 'Chave de convite inválida' }, { status: 403 });
    }

    // Criar usuário no Firebase Auth
    const userRecord = await authAdmin.createUser({
      email,
      password,
      displayName: name,
    });

    // Salvar role no Realtime Database
    await dbAdmin.ref(`users/${userRecord.uid}`).set({
      name,
      email,
      role,
      createdAt: new Date().toISOString()
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Usuário cadastrado com sucesso!',
      uid: userRecord.uid 
    });

  } catch (error: any) {
    console.error('[AUTH-API] Erro no registro:', error);
    let message = 'Falha ao criar conta.';
    if (error.code === 'auth/email-already-exists') {
      message = 'Este e-mail já está em uso.';
    }
    return NextResponse.json({ error: message, detail: error.message }, { status: 500 });
  }
}
