import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { poId, quantity, version } = await request.json();

    if (!poId || quantity === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = await createClient();
    
    // Check version if provided (Optimistic Locking)
    if (version !== undefined) {
      const { data: current } = await supabase
        .from('purchase_orders')
        .select('version')
        .eq('id', poId)
        .single();
      
      if (current && current.version !== version) {
        return NextResponse.json({ error: 'Conflict: Order was modified' }, { status: 409 });
      }
    }

    const { error } = await supabase
      .from('purchase_orders')
      .update({ 
        packed_quantity: quantity, 
        version: (version || 0) + 1,
        updated_at: new Date().toISOString() 
      })
      .eq('id', poId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
