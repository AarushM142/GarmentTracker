export function TaxInvoice({ order }: { order: any }) {
  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
  const skuList: any[] = order.sku_list || []
  const subtotal = Number(order.po_amount_inr) || 0
  const cgst = subtotal * 0.025
  const sgst = subtotal * 0.025
  const total = subtotal + cgst + sgst

  return (
    <div className="doc-content">
      {/* Large, unmissable DRAFT watermark — per reviewer recommendation */}
      <div className="watermark">PROFORMA — NOT A TAX DOCUMENT</div>

      {/* Warning Banner */}
      <div style={{
        background: '#fff3cd', border: '2px solid #ffc107', borderRadius: 6,
        padding: '10px 14px', marginBottom: 20, textAlign: 'center'
      }}>
        <strong style={{ color: '#856404', fontSize: 12 }}>⚠️ PROFORMA INVOICE — Pending GST/IRN Registration. NOT VALID FOR TAX PURPOSES.</strong>
      </div>

      <div className="doc-header">
        <div>
          <div className="company-name">Garment Production Co.</div>
          <div className="company-meta">
            123 Industrial Estate, Textile Nagar<br />
            Mumbai – 400001, Maharashtra<br />
            GSTIN: 27XXXXX0000X1Z5 &nbsp;|&nbsp; PAN: XXXXX0000X
          </div>
        </div>
        <div>
          <div className="doc-title">TAX INVOICE</div>
          <div className="doc-number">Invoice No: INV-{order.po_number}</div>
          <div className="doc-number">Date: {today}</div>
          <div style={{ marginTop: 6 }}>
            <span className="status-badge badge-amber">Proforma</span>
          </div>
        </div>
      </div>

      <div className="two-col">
        <div className="info-box">
          <label>Bill To</label>
          <p style={{ fontWeight: 700 }}>{order.customer_name}</p>
          <p style={{ color: '#666', marginTop: 4 }}>{order.office_address || 'Address on file'}</p>
          <p style={{ color: '#888', fontSize: 10, marginTop: 6 }}>GSTIN: ________________________</p>
        </div>
        <div className="info-box">
          <label>Ship To</label>
          <p style={{ fontWeight: 700 }}>{order.customer_name}</p>
          <p style={{ color: '#666', marginTop: 4 }}>{order.delivery_address || order.office_address || 'Address on file'}</p>
        </div>
      </div>

      <div className="two-col">
        <div className="info-box">
          <label>PO Reference</label>
          <p>{order.po_number} &nbsp;|&nbsp; PO Date: {order.po_date ? new Date(order.po_date).toLocaleDateString('en-IN') : '—'}</p>
        </div>
        <div className="info-box">
          <label>Payment Terms</label>
          <p>{order.payment_term || 'As agreed'}</p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style={{ width: '5%' }}>#</th>
            <th style={{ width: '30%' }}>Description</th>
            <th style={{ width: '15%' }}>HSN Code</th>
            <th style={{ width: '10%', textAlign: 'center' }}>Qty</th>
            <th style={{ width: '15%', textAlign: 'right' }}>Rate (₹)</th>
            <th style={{ width: '15%', textAlign: 'right' }}>Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          {skuList.length > 0 ? skuList.map((sku: any, i: number) => {
            const qty = Number(sku.quantity) || 0
            const rate = qty > 0 ? (subtotal / skuList.reduce((s: number, x: any) => s + (Number(x.quantity) || 0), 0)) : 0
            const amt = rate * qty
            return (
              <tr key={i}>
                <td>{i + 1}</td>
                <td style={{ fontWeight: 600 }}>{sku.style_code}<br /><span style={{ fontWeight: 400, color: '#666', fontSize: 10 }}>{sku.garment_type || 'Readymade Garment'}</span></td>
                <td>6109</td>
                <td style={{ textAlign: 'center' }}>{qty}</td>
                <td style={{ textAlign: 'right' }}>₹{rate.toFixed(2)}</td>
                <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{amt.toFixed(2)}</td>
              </tr>
            )
          }) : (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center', color: '#888' }}>No items</td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="totals-section">
        <div className="totals-box">
          <div className="totals-row">
            <span>Subtotal</span>
            <span>₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="totals-row">
            <span>CGST @ 2.5%</span>
            <span>₹{cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="totals-row">
            <span>SGST @ 2.5%</span>
            <span>₹{sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="totals-row grand-total">
            <span>Total Amount</span>
            <span>₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      <div className="info-box" style={{ marginTop: 16 }}>
        <label>IRN / E-Invoice Reference</label>
        <p style={{ color: '#888', fontStyle: 'italic' }}>Pending — IRN to be generated upon GST portal integration</p>
      </div>

      <div className="signatures">
        <div className="sig-box">Prepared By</div>
        <div className="sig-box">Accounts Manager</div>
        <div className="sig-box">Authorized Signatory</div>
      </div>

      <p style={{ fontSize: 9, color: '#aaa', marginTop: 24, textAlign: 'center' }}>
        This is a PROFORMA invoice for reference only. A valid GST tax invoice with IRN will be issued upon system integration. HSN: 6109 | GST Rate: 5%.
      </p>
    </div>
  )
}
