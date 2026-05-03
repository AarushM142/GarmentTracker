export function EWayBill({ order }: { order: any }) {
  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
  const skuList: any[] = order.sku_list || []
  const totalQty = skuList.reduce((s: number, x: any) => s + (Number(x.quantity) || 0), 0)
  const assessableValue = Number(order.po_amount_inr) || 0
  const totalTax = assessableValue * 0.05

  return (
    <div className="doc-content">
      {/* Watermark */}
      <div className="watermark">MOCK — NOT OFFICIAL</div>

      {/* Warning Banner */}
      <div style={{
        background: '#fff3cd', border: '2px solid #ffc107', borderRadius: 6,
        padding: '10px 14px', marginBottom: 20, textAlign: 'center'
      }}>
        <strong style={{ color: '#856404', fontSize: 12 }}>⚠️ MOCK E-WAY BILL — Pending GSTN Integration. NOT VALID FOR ROAD TRANSPORT.</strong>
      </div>

      <div className="doc-header">
        <div>
          <div className="company-name">Garment Production Co.</div>
          <div className="company-meta">
            GSTIN: 27XXXXX0000X1Z5<br />
            123 Industrial Estate, Textile Nagar, Mumbai – 400001
          </div>
        </div>
        <div>
          <div className="doc-title">E-WAY BILL</div>
          <div className="doc-number">EWB No: EWB-{order.po_number}</div>
          <div className="doc-number">Generated: {today}</div>
          <div style={{ marginTop: 6 }}>
            <span className="status-badge badge-amber">Mock</span>
          </div>
        </div>
      </div>

      {/* Part A — Consignment Details */}
      <div style={{ background: '#3a5c3a', color: 'white', padding: '6px 12px', borderRadius: '4px 4px 0 0', fontSize: 11, fontWeight: 700, marginBottom: 0 }}>
        PART A — Consignment Details
      </div>
      <div style={{ border: '1px solid #3a5c3a', borderTop: 'none', borderRadius: '0 0 6px 6px', padding: 12, marginBottom: 16 }}>
        <div className="two-col" style={{ marginBottom: 0 }}>
          <div>
            <label style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#888' }}>From (Supplier)</label>
            <p style={{ fontSize: 11, fontWeight: 600, marginTop: 4 }}>Garment Production Co.</p>
            <p style={{ fontSize: 10, color: '#555' }}>123 Industrial Estate, Mumbai 400001</p>
            <p style={{ fontSize: 10, color: '#555' }}>GSTIN: 27XXXXX0000X1Z5</p>
          </div>
          <div>
            <label style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#888' }}>To (Recipient)</label>
            <p style={{ fontSize: 11, fontWeight: 600, marginTop: 4 }}>{order.customer_name}</p>
            <p style={{ fontSize: 10, color: '#555' }}>{order.delivery_address || order.office_address || '—'}</p>
            <p style={{ fontSize: 10, color: '#555' }}>GSTIN: ________________________</p>
          </div>
        </div>
      </div>

      {/* Goods Description */}
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Description</th>
            <th>HSN</th>
            <th style={{ textAlign: 'right' }}>Qty</th>
            <th style={{ textAlign: 'right' }}>Taxable Value (₹)</th>
            <th style={{ textAlign: 'right' }}>Tax Rate</th>
          </tr>
        </thead>
        <tbody>
          {skuList.length > 0 ? skuList.map((sku: any, i: number) => (
            <tr key={i}>
              <td>{i + 1}</td>
              <td>{sku.style_code} — {sku.garment_type || 'Readymade Garment'}</td>
              <td>6109</td>
              <td style={{ textAlign: 'right' }}>{sku.quantity} pcs</td>
              <td style={{ textAlign: 'right' }}>₹{((assessableValue / (totalQty || 1)) * (sku.quantity || 0)).toFixed(2)}</td>
              <td style={{ textAlign: 'right' }}>5% GST</td>
            </tr>
          )) : (
            <tr><td colSpan={6} style={{ textAlign: 'center', color: '#888' }}>No items</td></tr>
          )}
        </tbody>
        <tfoot>
          <tr style={{ background: '#f0ede8', fontWeight: 700 }}>
            <td colSpan={3} style={{ padding: '8px 10px', textAlign: 'right' }}>Total:</td>
            <td style={{ padding: '8px 10px', textAlign: 'right' }}>{totalQty} pcs</td>
            <td style={{ padding: '8px 10px', textAlign: 'right' }}>₹{assessableValue.toFixed(2)}</td>
            <td style={{ padding: '8px 10px', textAlign: 'right' }}>₹{totalTax.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>

      {/* Part B — Transport */}
      <div style={{ background: '#3a5c3a', color: 'white', padding: '6px 12px', borderRadius: '4px 4px 0 0', fontSize: 11, fontWeight: 700 }}>
        PART B — Transport Details
      </div>
      <div style={{ border: '1px solid #3a5c3a', borderTop: 'none', borderRadius: '0 0 6px 6px', padding: 12 }}>
        <div className="two-col" style={{ marginBottom: 0 }}>
          <div>
            <label style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#888' }}>Mode of Transport</label>
            <p style={{ fontSize: 11, marginTop: 4 }}>Road</p>
          </div>
          <div>
            <label style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#888' }}>Transporter / Courier</label>
            <p style={{ fontSize: 11, marginTop: 4 }}>{order.courier_name || '—'}</p>
          </div>
          <div>
            <label style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#888' }}>Approx Distance</label>
            <p style={{ fontSize: 11, marginTop: 4 }}>— km</p>
          </div>
          <div>
            <label style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#888' }}>Vehicle No. / AWB</label>
            <p style={{ fontSize: 11, marginTop: 4 }}>{order.tracking_number || '—'}</p>
          </div>
        </div>
      </div>

      <div className="signatures" style={{ marginTop: 32 }}>
        <div className="sig-box">Generated By</div>
        <div className="sig-box">Driver / Transporter</div>
        <div className="sig-box">Recipient Acknowledgement</div>
      </div>

      <p style={{ fontSize: 9, color: '#aaa', marginTop: 24, textAlign: 'center' }}>
        This is a MOCK E-Way Bill. Actual E-Way Bills must be generated on the GSTN portal (ewaybillgst.gov.in). HSN: 6109 | CGST 2.5% + SGST 2.5%.
      </p>
    </div>
  )
}
