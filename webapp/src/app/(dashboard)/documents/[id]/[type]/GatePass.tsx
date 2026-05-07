export function GatePass({ order }: { order: any }) {
  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
  const time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  const skuList: any[] = order.sku_list || []
  const totalQty = skuList.reduce((s: number, x: any) => s + (Number(x.quantity) || 0), 0)

  return (
    <div className="doc-content">
      {/* Header */}
      <div className="doc-header">
        <div>
          <div className="company-name">Garment Production Co.</div>
          <div className="company-meta">
            123 Industrial Estate, Textile Nagar, Mumbai – 400001
          </div>
        </div>
        <div>
          <div className="doc-title">GATE PASS</div>
          <div className="doc-number">GP No: GP-{order.po_number}</div>
          <div className="doc-number">Date: {today} &nbsp; Time: {time}</div>
        </div>
      </div>

      {/* Alert box */}
      <div style={{
        background: '#fff3cd', border: '1px solid #ffc107', borderRadius: 6,
        padding: '10px 14px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8
      }}>
        <span style={{ fontSize: 16 }}>⚠️</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#856404' }}>
          Security — Please verify the goods against this pass before releasing the vehicle.
        </span>
      </div>

      {/* Details */}
      <div className="two-col">
        <div className="info-box">
          <label>Consignee</label>
          <p style={{ fontWeight: 700 }}>{order.customer_name}</p>
          <p style={{ color: '#666', marginTop: 4 }}>{order.delivery_address || order.office_address || '—'}</p>
        </div>
        <div className="info-box">
          <label>PO / Challan Reference</label>
          <p>PO: <strong>{order.po_number}</strong></p>
          <p>Challan: <strong>DC-{order.po_number}</strong></p>
          {order.courier_name && <p style={{ marginTop: 4 }}>Courier: <strong>{order.courier_name}</strong></p>}
          {order.tracking_number && <p>AWB: <strong>{order.tracking_number}</strong></p>}
        </div>
      </div>

      {/* Goods Table */}
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Description of Goods</th>
            <th style={{ textAlign: 'center' }}>Qty (pcs)</th>
            <th>Packages</th>
            <th>Remarks</th>
          </tr>
        </thead>
        <tbody>
          {skuList.length > 0 ? skuList.map((sku: any, i: number) => (
            <tr key={i}>
              <td>{i + 1}</td>
              <td style={{ fontWeight: 600 }}>{sku.style_code} — {sku.garment_type || 'Garment'}</td>
              <td style={{ textAlign: 'center', fontWeight: 700 }}>{sku.quantity}</td>
              <td>—</td>
              <td>—</td>
            </tr>
          )) : (
            <tr>
              <td colSpan={5} style={{ textAlign: 'center', color: '#888' }}>No items</td>
            </tr>
          )}
        </tbody>
        <tfoot>
          <tr style={{ background: '#f0ede8', fontWeight: 700 }}>
            <td colSpan={2} style={{ padding: '8px 10px', textAlign: 'right' }}>Total:</td>
            <td style={{ padding: '8px 10px', textAlign: 'center', fontSize: 13 }}>{totalQty} pcs</td>
            <td colSpan={2}></td>
          </tr>
        </tfoot>
      </table>

      {/* Verification boxes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
        <div className="info-box">
          <label>Vehicle No.</label>
          <p style={{ borderBottom: '1px solid #ccc', paddingBottom: 20 }}>&nbsp;</p>
        </div>
        <div className="info-box">
          <label>Driver Name / Contact</label>
          <p style={{ borderBottom: '1px solid #ccc', paddingBottom: 20 }}>&nbsp;</p>
        </div>
      </div>

      <div className="signatures" style={{ marginTop: 40 }}>
        <div className="sig-box">Issued By (Store)</div>
        <div className="sig-box">Security Verified</div>
        <div className="sig-box">Driver&apos;s Signature</div>
      </div>

      <p style={{ fontSize: 9, color: '#aaa', marginTop: 24, textAlign: 'center' }}>
        This gate pass is valid for one-time use only. Goods once dispatched cannot be returned without a prior authorization from management.
      </p>
    </div>
  )
}
