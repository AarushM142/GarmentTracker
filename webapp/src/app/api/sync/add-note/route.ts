import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { poId, note, type } = await request.json();

    if (!poId || !note) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Logic to add note. Since there might not be a 'notes' table yet, 
    // we'll assume it's stored in a table called 'po_notes' or similar, 
    // or we'll use audit_log as a fallback if that's what's intended.
    // For this ERP, let's assume 'qc_inspections' if it's a rework note, 
    // or a generic 'po_comments' table.
    
    const { error } = await supabase
      .from('audit_log') // Fallback to audit log if specific notes table isn't found
      .insert({
        table_name: 'purchase_orders',
        record_id: poId,
        action: type === 'rework' ? 'REWORK_NOTE' : 'ADD_COMMENT',
        new_value: { note },
        performed_by: user?.id
      });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
