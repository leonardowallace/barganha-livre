import { NextResponse } from 'next/server';
import { rtdb } from '@/lib/firebase';
import { ref, get, query, limitToLast } from 'firebase/database';

export async function GET() {
    try {
        const produtosRef = ref(rtdb, 'produtos');
        const q = query(produtosRef, limitToLast(20));
        const snapshot = await get(q);
        
        if (!snapshot.exists()) {
            return NextResponse.json([]);
        }

        const data = snapshot.val();
        const formatted = Object.keys(data).map(key => ({
            id: key,
            title: data[key].title,
            categoria: data[key].categoria
        }));
        return NextResponse.json(formatted);
    } catch (e: any) {
        return NextResponse.json({ error: e.message });
    }
}
