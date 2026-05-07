export function DeliveryChallan({ order }: { order: any }) {
  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
  const skuList: any[] = order.sku_list || []
  const totalQty = skuList.reduce((s: number, x: any) => s + (Number(x.quantity) || 0), 0)

  return (
    <div className="doc-content">
      <div className="doc-header">
        <div>
          <div className="company-name">Garment Production Co.</div>
          <div className="company-meta">
            123 Industrial Estate, Textile Nagar<br />
            Mumbai – 400001, Maharashtra<br />
            GSTIN: 27XXXXX0000X1Z5
          </div>
        </div>
        <div>
          <div className="doc-title">DELIVERY CHALLAN</div>
          <div className="doc-number">Challan No: DC-{order.po_number}</div>
          <div className="doc-number">Date: {today}</div>
          <div style={{ marginTop: 6 }}>
            <span className="status-badge badge-green">For Delivery</span>
          </div>
        </div>
      </div>

      <div className="two-col">
        <div className="info-box">
          <label>Bill To</label>
          <p style={{ fontWeight: 700 }}>{order.customer_name}</p>
          <p style={{ color: '#666', marginTop: 4 }}>{order.office_address || 'Address on file'}</p>
        </div>
        <div className="info-box">
          <label>Ship To / Delivery Address</label>
          <p style={{ fontWeight: 700 }}>{order.customer_name}</p>
          <p style={{ color: '#666', marginTop: 4 }}>{order.delivery_address || order.office_address || 'Address on file'}</p>
        </div>
      </div>

      <div className="two-col">
        <div className="info-box">
          <label>PO Reference</label>
          <p>{order.po_number}</p>
        </div>
        <div className="info-box">
          <label>Delivery Date</label>
          <p>{order.delivery_date ? new Date(order.delivery_date).toLocaleDateString('en-IN') : '—'}</p>
        </div>
      </div>

      {order.courier_name && (
        <div className="info-box" style={{ marginBottom: 16 }}>
          <label>Logistics Details</label>
          <p>Courier: <strong>{order.courier_name}</strong> &nbsp;|&nbsp; AWB/Tracking: <strong>{order.tracking_number}</strong></p>
        </div>
      )}

      <table>
        <thead>
          <tr>
            <th style={{ width: '5%' }}>#</th>
            <th style={{ width: '30%' }}>Style Code / Description</th>
            <th style={{ width: '20%' }}>Garment Type</th>
            <th style={{ width: '15%', textAlign: 'center' }}>Qty (pcs)</th>
            <th style={{ width: '30%' }}>Size Breakup</th>
          </tr>
        </thead>
        <tbody>
          {skuList.length > 0 ? skuList.map((sku: any, i: number) => (
            <tr key={i}>
              <td>{i + 1}</td>
              <td style={{ fontWeight: 600 }}>{sku.style_code}</td>
              <td>{sku.garment_type || '—'}</td>
              <td style={{ textAlign: 'center', fontWeight: 700 }}>{sku.quantity}</td>
              <td style={{ color: '#555', fontSize: 10 }}>
                {sku.sizes
                  ? Object.entries(sku.sizes)
                      .filter(([, v]) => Number(v) > 0)
                      .map(([k, v]) => `${k.toUpperCase()}:${v}`)
                      .join(' | ')
                  : '—'}
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan={5} style={{ textAlign: 'center', color: '#888' }}>No items found</td>
            </tr>
          )}
        </tbody>
        <tfoot>
          <tr style={{ background: '#f0ede8', fontWeight: 700 }}>
            <td colSpan={3} style={{ padding: '8px 10px', textAlign: 'right' }}>Total Pieces:</td>
            <td style={{ padding: '8px 10px', textAlign: 'center', fontSize: 13 }}>{totalQty}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>

      {order.packed_quantity && (
        <div className="info-box" style={{ marginBottom: 16 }}>
          <label>Verified Packed Quantity</label>
          <p><strong>{order.packed_quantity} pcs</strong> — verified at dispatch</p>
        </div>
      )}

      <div className="signatures">
        <div className="sig-box">Prepared By</div>
        <div className="sig-box">Authorized Signatory</div>
        <div className="sig-box">Receiver&apos;s Signature & Stamp</div>
      </div>

      <p style={{ fontSize: 9, color: '#aaa', marginTop: 24, textAlign: 'center' }}>
        This is a Delivery Challan only, not a tax invoice. Goods dispatched under this challan are subject to our standard terms & conditions.
      </p>
    </div>
  )
}
