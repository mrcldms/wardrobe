import React, { useState, useRef, useMemo, useEffect } from 'react'

const CATEGORIES = ["Outerwear","Knitwear","Shirts","T-Shirts","Trousers","Denim","Shorts","Suits","Shoes","Accessories","Bags","Other"]
const EMPTY_FORM = { category:"", name:"", brand:"", colours:[], price:"", notes:"", photo:null }
const EMPTY_WISH = { name:"", brand:"", url:"", notes:"", targetPrice:"", photo:null }

const load = (key, fallback) => { try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : fallback } catch { return fallback } }
const save = (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)) } catch {} }

/* ─── Shared primitives ─── */
const Label = ({ children }) => <div className="field-label">{children}</div>
function Field({ label, children }) {
  return <div style={{ display:'flex', flexDirection:'column' }}><Label>{label}</Label>{children}</div>
}

function ColourInput({ colours, onChange }) {
  const [input, setInput] = useState('')
  const add = () => {
    const v = input.trim()
    if (v && !colours.map(c => c.toLowerCase()).includes(v.toLowerCase())) onChange([...colours, v])
    setInput('')
  }
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      <div style={{ display:'flex', alignItems:'center', borderBottom:'1px solid #D8D4CE' }}>
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          placeholder="e.g. Ivory — press Enter"
          className="field-input" style={{ borderBottom:'none', flex:1 }} />
        {input.trim() && <button onClick={add} style={{ background:'none', border:'none', cursor:'pointer', fontSize:10, color:'#9C9890', letterSpacing:'0.1em', textTransform:'uppercase', padding:'0 0 0 8px' }}>Add</button>}
      </div>
      {colours.length > 0 && <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
        {colours.map((c, i) => <button key={i} className="pill active" onClick={() => onChange(colours.filter((_, idx) => idx !== i))}>{c} ×</button>)}
      </div>}
    </div>
  )
}

function PhotoUpload({ value, onChange }) {
  const ref = useRef()
  const [drag, setDrag] = useState(false)
  const handle = file => {
    if (!file?.type.startsWith('image/')) return
    const r = new FileReader()
    r.onload = e => onChange(e.target.result)
    r.readAsDataURL(file)
  }
  return (
    <div onClick={() => ref.current.click()}
      onDragOver={e => { e.preventDefault(); setDrag(true) }}
      onDragLeave={() => setDrag(false)}
      onDrop={e => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files[0]) }}
      style={{ width:'100%', aspectRatio:'3/4', border:`1px solid ${drag ? '#1C1C1C' : '#D8D4CE'}`, cursor:'pointer', overflow:'hidden', position:'relative', background:value ? '#EAE7E2' : 'transparent', display:'flex', alignItems:'center', justifyContent:'center', transition:'border-color 0.2s' }}>
      {value ? (
        <>
          <img src={value} alt="" style={{ width:'100%', height:'100%', objectFit:'contain' }} />
          <div style={{ position:'absolute', inset:0, background:'rgba(28,28,28,0)', display:'flex', alignItems:'center', justifyContent:'center', transition:'background 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(28,28,28,0.28)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(28,28,28,0)'}>
            <span style={{ color:'#fff', fontSize:9, letterSpacing:'0.14em', textTransform:'uppercase' }}>Replace</span>
          </div>
        </>
      ) : (
        <div style={{ textAlign:'center', pointerEvents:'none' }}>
          <div style={{ fontSize:22, opacity:0.1, marginBottom:8 }}>+</div>
          <div style={{ fontSize:9, letterSpacing:'0.12em', textTransform:'uppercase', color:'#B8B4AE' }}>{drag ? 'Drop here' : 'Upload photo'}</div>
        </div>
      )}
      <input ref={ref} type="file" accept="image/*" style={{ display:'none' }} onChange={e => handle(e.target.files[0])} />
    </div>
  )
}

/* ─── Add Drawer ─── */
function AddDrawer({ open, onClose, onAdd }) {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(EMPTY_FORM)
  const reset = () => { setStep(0); setForm(EMPTY_FORM) }
  const close = () => { reset(); onClose() }
  const canNext = step === 0 ? !!form.category : step === 1 ? !!form.name.trim() : true
  const next = () => { if (step < 2) setStep(s => s + 1); else { onAdd({ ...form, id: Date.now() }); close() } }

  return (
    <>
      <div className={`drawer-overlay${open ? ' open' : ''}`} onClick={close} />
      <div className={`drawer${open ? ' open' : ''}`}>
        <div style={{ padding:'28px 28px 20px', borderBottom:'1px solid #E8E4DE', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
          <div>
            <div style={{ fontSize:9, letterSpacing:'0.18em', textTransform:'uppercase', color:'#9C9890', marginBottom:4 }}>Step {step + 1} of 3</div>
            <div style={{ fontFamily:"'Playfair Display', serif", fontSize:18, color:'#1C1C1C' }}>{step === 0 ? 'Category' : step === 1 ? 'Details' : 'Photo'}</div>
          </div>
          <div style={{ display:'flex', gap:6, alignItems:'center' }}>
            {[0,1,2].map(i => <div key={i} className="step-dot" style={{ background: i <= step ? '#1C1C1C' : '#D8D4CE' }} />)}
            <button onClick={close} style={{ background:'none', border:'none', cursor:'pointer', fontSize:18, color:'#B8B4AE', marginLeft:12, lineHeight:1 }}>×</button>
          </div>
        </div>
        <div style={{ flex:1, overflowY:'auto', padding:'24px 28px' }}>
          {step === 0 && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
              {CATEGORIES.map(cat => <button key={cat} className={`cat-btn${form.category === cat ? ' selected' : ''}`} onClick={() => setForm(f => ({ ...f, category: cat }))}>{cat}</button>)}
            </div>
          )}
          {step === 1 && (
            <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
              <Field label="Item name"><input className="field-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Cashmere crewneck" /></Field>
              <Field label="Brand"><input className="field-input" value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} placeholder="e.g. The Row" /></Field>
              <Field label="Colour"><ColourInput colours={form.colours} onChange={v => setForm(f => ({ ...f, colours: v }))} /></Field>
              <Field label="Price paid">
                <div style={{ display:'flex', alignItems:'center', borderBottom:'1px solid #D8D4CE' }}>
                  <span style={{ fontFamily:"'Playfair Display', serif", fontSize:14, color:'#B8B4AE', padding:'10px 2px 10px 0' }}>£</span>
                  <input className="field-input" style={{ borderBottom:'none', flex:1 }} value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0.00" />
                </div>
              </Field>
              <Field label="Notes"><textarea className="field-input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Fit notes, care, provenance…" rows={3} style={{ resize:'none', lineHeight:1.6 }} /></Field>
            </div>
          )}
          {step === 2 && (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <PhotoUpload value={form.photo} onChange={v => setForm(f => ({ ...f, photo: v }))} />
              <div style={{ textAlign:'center', fontSize:10, letterSpacing:'0.08em', color:'#B8B4AE', textTransform:'uppercase' }}>Optional but recommended</div>
            </div>
          )}
        </div>
        <div style={{ padding:'16px 28px', borderTop:'1px solid #E8E4DE', display:'flex', gap:8, flexShrink:0 }}>
          {step > 0 && <button className="btn-ghost" onClick={() => setStep(s => s - 1)}>Back</button>}
          <button className="btn-primary" disabled={!canNext} onClick={next} style={{ flex:1 }}>{step < 2 ? 'Continue' : 'Add to wardrobe'}</button>
        </div>
      </div>
    </>
  )
}

/* ─── Outfit Drawer ─── */
function OutfitDrawer({ open, onClose, items, onSave, onDelete, editingOutfit }) {
  const [name, setName] = useState('')
  const [sel, setSel] = useState([])
  useEffect(() => {
    if (editingOutfit) { setName(editingOutfit.name); setSel(editingOutfit.itemIds) }
    else { setName(''); setSel([]) }
  }, [editingOutfit, open])
  const toggle = id => setSel(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
  const canSave = name.trim() && sel.length > 0
  const close = () => { setName(''); setSel([]); onClose() }
  return (
    <>
      <div className={`drawer-overlay${open ? ' open' : ''}`} onClick={close} />
      <div className={`drawer${open ? ' open' : ''}`} style={{ width:420 }}>
        <div style={{ padding:'28px 28px 20px', borderBottom:'1px solid #E8E4DE', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
          <div style={{ fontFamily:"'Playfair Display', serif", fontSize:18, color:'#1C1C1C' }}>{editingOutfit ? 'Edit outfit' : 'New outfit'}</div>
          <button onClick={close} style={{ background:'none', border:'none', cursor:'pointer', fontSize:18, color:'#B8B4AE', lineHeight:1 }}>×</button>
        </div>
        <div style={{ flex:1, overflowY:'auto', padding:'24px 28px', display:'flex', flexDirection:'column', gap:24 }}>
          <Field label="Outfit name"><input className="field-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Sunday in the city" /></Field>
          <div>
            <Label>Pieces <span style={{ color:'#C8C4BC' }}>— {sel.length} selected</span></Label>
            {CATEGORIES.filter(cat => items.some(i => i.category === cat)).map(cat => (
              <div key={cat}>
                <div style={{ fontSize:9, letterSpacing:'0.14em', textTransform:'uppercase', color:'#C8C4BC', padding:'10px 0 5px' }}>{cat}</div>
                {items.filter(i => i.category === cat).map(item => {
                  const on = sel.includes(item.id)
                  return (
                    <div key={item.id} onClick={() => toggle(item.id)} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', cursor:'pointer', background: on ? '#EAE7E2' : 'transparent', marginBottom:2, transition:'background 0.15s' }}>
                      <div style={{ width:32, height:42, background:'#E0DDD8', flexShrink:0, overflow:'hidden' }}>
                        {item.photo && <img src={item.photo} alt="" style={{ width:'100%', height:'100%', objectFit:'contain' }} />}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontFamily:"'Playfair Display', serif", fontSize:13, color:'#1C1C1C', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.name}</div>
                        {item.brand && <div style={{ fontSize:9, letterSpacing:'0.1em', textTransform:'uppercase', color:'#9C9890' }}>{item.brand}</div>}
                      </div>
                      <div style={{ width:14, height:14, border:`1px solid ${on ? '#1C1C1C' : '#D8D4CE'}`, background: on ? '#1C1C1C' : 'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all 0.15s' }}>
                        {on && <span style={{ color:'#fff', fontSize:9, lineHeight:1 }}>✓</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding:'16px 28px', borderTop:'1px solid #E8E4DE', display:'flex', gap:8, flexShrink:0 }}>
          {editingOutfit && <button className="btn-ghost" onClick={() => { onDelete(editingOutfit.id); close() }}>Delete</button>}
          <button className="btn-primary" disabled={!canSave} onClick={() => { if (canSave) { onSave({ id: editingOutfit?.id || Date.now(), name: name.trim(), itemIds: sel }); close() } }} style={{ flex:1 }}>Save outfit</button>
        </div>
      </div>
    </>
  )
}

/* ─── Wishlist Drawer ─── */
function WishlistDrawer({ open, onClose, onAdd, editing, onSave }) {
  const [form, setForm] = useState(EMPTY_WISH)
  const [checking, setChecking] = useState(false)
  const [priceInfo, setPriceInfo] = useState(null)

  useEffect(() => {
    if (editing) setForm({ ...EMPTY_WISH, ...editing })
    else setForm(EMPTY_WISH)
    setPriceInfo(null)
  }, [editing, open])

  const close = () => { setForm(EMPTY_WISH); setPriceInfo(null); onClose() }
  const canSave = form.name.trim()

  const checkPrice = async () => {
    if (!form.url) return
    setChecking(true)
    setPriceInfo(null)
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 500,
          tools: [{ type: 'web_search_20250305', name: 'web_search' }],
          messages: [{
            role: 'user',
            content: `Check the current price of this product and whether it's on sale. URL: ${form.url}
            
            Search for the product and return ONLY a JSON object with these fields:
            { "currentPrice": "£XX.XX or null", "originalPrice": "£XX.XX or null", "onSale": true/false, "discount": "XX% off or null", "inStock": true/false/null, "summary": "one sentence" }
            
            Return ONLY the JSON, no other text.`
          }]
        })
      })
      const data = await response.json()
      const text = data.content?.filter(b => b.type === 'text').map(b => b.text).join('')
      const match = text?.match(/\{[\s\S]*\}/)
      if (match) {
        const info = JSON.parse(match[0])
        setPriceInfo(info)
      } else {
        setPriceInfo({ summary: 'Could not retrieve price info. Try again.', onSale: false })
      }
    } catch {
      setPriceInfo({ summary: 'Error checking price. Make sure the URL is correct.', onSale: false })
    }
    setChecking(false)
  }

  const handleSave = () => {
    if (!canSave) return
    const item = { ...form, id: editing?.id || Date.now(), priceInfo, lastChecked: priceInfo ? new Date().toISOString() : editing?.lastChecked }
    if (editing) onSave(item)
    else onAdd(item)
    close()
  }

  return (
    <>
      <div className={`drawer-overlay${open ? ' open' : ''}`} onClick={close} />
      <div className={`drawer${open ? ' open' : ''}`} style={{ width:420 }}>
        <div style={{ padding:'28px 28px 20px', borderBottom:'1px solid #E8E4DE', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
          <div style={{ fontFamily:"'Playfair Display', serif", fontSize:18, color:'#1C1C1C' }}>{editing ? 'Edit wishlist item' : 'Add to wishlist'}</div>
          <button onClick={close} style={{ background:'none', border:'none', cursor:'pointer', fontSize:18, color:'#B8B4AE', lineHeight:1 }}>×</button>
        </div>
        <div style={{ flex:1, overflowY:'auto', padding:'24px 28px', display:'flex', flexDirection:'column', gap:24 }}>
          <PhotoUpload value={form.photo} onChange={v => setForm(f => ({ ...f, photo: v }))} />
          <Field label="Item name"><input className="field-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Wool overcoat" /></Field>
          <Field label="Brand"><input className="field-input" value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} placeholder="e.g. Margaret Howell" /></Field>
          <Field label="Target price">
            <div style={{ display:'flex', alignItems:'center', borderBottom:'1px solid #D8D4CE' }}>
              <span style={{ fontFamily:"'Playfair Display', serif", fontSize:14, color:'#B8B4AE', padding:'10px 2px 10px 0' }}>£</span>
              <input className="field-input" style={{ borderBottom:'none', flex:1 }} value={form.targetPrice} onChange={e => setForm(f => ({ ...f, targetPrice: e.target.value }))} placeholder="Max I'd pay" />
            </div>
          </Field>

          {/* URL + price check */}
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <Label>Product link</Label>
            <div style={{ display:'flex', gap:8, alignItems:'flex-end' }}>
              <input className="field-input" style={{ flex:1 }} value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="https://…" />
              <button className="btn-ghost" onClick={checkPrice} disabled={!form.url || checking} style={{ padding:'8px 14px', fontSize:9 }}>
                {checking ? '…' : 'Check price'}
              </button>
            </div>
            {checking && <div className="price-checking">Checking price…</div>}
            {priceInfo && (
              <div style={{ padding:'12px 14px', background: priceInfo.onSale ? '#FDF0EE' : '#F0EDE8', borderLeft:`2px solid ${priceInfo.onSale ? '#C05040' : '#D8D4CE'}` }}>
                {priceInfo.onSale && <div className="sale-badge" style={{ marginBottom:8 }}>On Sale {priceInfo.discount && `— ${priceInfo.discount}`}</div>}
                <div style={{ display:'flex', gap:12, alignItems:'baseline', marginBottom:6 }}>
                  {priceInfo.currentPrice && <span style={{ fontFamily:"'Playfair Display', serif", fontSize:18, color: priceInfo.onSale ? '#C05040' : '#1C1C1C' }}>{priceInfo.currentPrice}</span>}
                  {priceInfo.originalPrice && priceInfo.onSale && <span style={{ fontSize:12, color:'#B8B4AE', textDecoration:'line-through' }}>{priceInfo.originalPrice}</span>}
                </div>
                <div style={{ fontSize:11, color:'#6C6860', lineHeight:1.5 }}>{priceInfo.summary}</div>
                {priceInfo.inStock === false && <div style={{ fontSize:10, color:'#B8B4AE', marginTop:4, letterSpacing:'0.08em', textTransform:'uppercase' }}>Out of stock</div>}
              </div>
            )}
          </div>

          <Field label="Notes"><textarea className="field-input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Why you want it, where you saw it…" rows={3} style={{ resize:'none', lineHeight:1.6 }} /></Field>
        </div>
        <div style={{ padding:'16px 28px', borderTop:'1px solid #E8E4DE', display:'flex', gap:8, flexShrink:0 }}>
          <button className="btn-primary" disabled={!canSave} onClick={handleSave} style={{ flex:1 }}>{editing ? 'Save changes' : 'Add to wishlist'}</button>
        </div>
      </div>
    </>
  )
}

/* ─── Detail Modal ─── */
function DetailModal({ item, open, onClose, onRemove }) {
  if (!item) return null
  return (
    <>
      <div className={`modal-overlay${open ? ' open' : ''}`} onClick={onClose} />
      <div className={`modal${open ? ' open' : ''}`}>
        <div style={{ width:240, flexShrink:0, background:'#EAE7E2', display:'flex', alignItems:'center', justifyContent:'center' }}>
          {item.photo ? <img src={item.photo} alt={item.name} style={{ width:'100%', height:'100%', objectFit:'contain' }} /> : <div style={{ fontSize:32, opacity:0.08 }}>◻</div>}
        </div>
        <div style={{ flex:1, padding:'32px 28px 24px', overflowY:'auto', display:'flex', flexDirection:'column', gap:20 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <div>
              <div style={{ fontSize:9, letterSpacing:'0.16em', textTransform:'uppercase', color:'#9C9890', marginBottom:5 }}>{item.category}</div>
              <div style={{ fontFamily:"'Playfair Display', serif", fontSize:20, color:'#1C1C1C', lineHeight:1.2 }}>{item.name}</div>
            </div>
            <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', fontSize:18, color:'#B8B4AE', lineHeight:1, flexShrink:0 }}>×</button>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {[['Brand', item.brand], ['Price', item.price ? `£${item.price}` : null], ['Notes', item.notes]].filter(([, v]) => v).map(([l, v]) => (
              <div key={l}>
                <div style={{ fontSize:9, letterSpacing:'0.14em', textTransform:'uppercase', color:'#9C9890', marginBottom:3 }}>{l}</div>
                <div style={{ fontFamily:"'Playfair Display', serif", fontSize:14, color:'#3C3830', lineHeight:1.6 }}>{v}</div>
              </div>
            ))}
            {item.colours?.length > 0 && (
              <div>
                <div style={{ fontSize:9, letterSpacing:'0.14em', textTransform:'uppercase', color:'#9C9890', marginBottom:6 }}>Colour</div>
                <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>{item.colours.map((c, i) => <span key={i} className="pill active">{c}</span>)}</div>
              </div>
            )}
          </div>
          <button className="btn-danger" style={{ marginTop:'auto' }} onClick={() => { onRemove(item.id); onClose() }}>Remove from wardrobe</button>
        </div>
      </div>
    </>
  )
}

/* ─── Wishlist Card ─── */
function WishlistCard({ item, onEdit, onRemove, onCheckPrice }) {
  const [checking, setChecking] = useState(false)
  const info = item.priceInfo
  const isOnSale = info?.onSale
  const belowTarget = info?.currentPrice && item.targetPrice &&
    parseFloat(info.currentPrice.replace(/[^0-9.]/g, '')) <= parseFloat(item.targetPrice)

  const handleCheck = async () => {
    setChecking(true)
    await onCheckPrice(item.id)
    setChecking(false)
  }

  return (
    <div className="wishlist-card">
      {/* Image strip */}
      {item.photo && (
        <div style={{ height:160, overflow:'hidden', background:'#EAE7E2' }}>
          <img src={item.photo} alt={item.name} style={{ width:'100%', height:'100%', objectFit:'contain' }} />
        </div>
      )}
      <div style={{ padding:'16px 18px', display:'flex', flexDirection:'column', gap:10, flex:1 }}>
        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
          <div>
            {item.brand && <div style={{ fontSize:9, letterSpacing:'0.14em', textTransform:'uppercase', color:'#9C9890', marginBottom:3 }}>{item.brand}</div>}
            <div style={{ fontFamily:"'Playfair Display', serif", fontSize:15, color:'#1C1C1C', lineHeight:1.3 }}>{item.name}</div>
          </div>
          {(isOnSale || belowTarget) && (
            <div style={{ display:'flex', flexDirection:'column', gap:3, alignItems:'flex-end', flexShrink:0 }}>
              {isOnSale && <span className="sale-badge">Sale</span>}
              {belowTarget && !isOnSale && <span className="sale-badge" style={{ background:'#4A7C59' }}>In budget</span>}
            </div>
          )}
        </div>

        {/* Price info */}
        {info && (
          <div style={{ display:'flex', gap:8, alignItems:'baseline' }}>
            {info.currentPrice && <span style={{ fontFamily:"'Playfair Display', serif", fontSize:16, color: isOnSale ? '#C05040' : '#1C1C1C' }}>{info.currentPrice}</span>}
            {info.originalPrice && isOnSale && <span style={{ fontSize:11, color:'#B8B4AE', textDecoration:'line-through' }}>{info.originalPrice}</span>}
            {info.discount && <span style={{ fontSize:10, color:'#C05040', letterSpacing:'0.06em' }}>{info.discount}</span>}
          </div>
        )}

        {/* Target price */}
        {item.targetPrice && (
          <div style={{ fontSize:10, color:'#9C9890', letterSpacing:'0.06em' }}>
            Target: £{item.targetPrice}
            {belowTarget && <span style={{ color:'#4A7C59', marginLeft:6 }}>✓ within budget</span>}
          </div>
        )}

        {/* Last checked */}
        {item.lastChecked && (
          <div style={{ fontSize:9, color:'#B8B4AE', letterSpacing:'0.06em', textTransform:'uppercase' }}>
            Checked {new Date(item.lastChecked).toLocaleDateString('en-GB', { day:'numeric', month:'short' })}
          </div>
        )}

        {/* Notes */}
        {item.notes && <div style={{ fontSize:12, color:'#6C6860', lineHeight:1.5, fontStyle:'italic' }}>{item.notes}</div>}

        {/* Actions */}
        <div style={{ display:'flex', gap:6, marginTop:'auto', paddingTop:4 }}>
          {item.url && (
            <button onClick={handleCheck} disabled={checking} className="btn-ghost" style={{ flex:1, padding:'7px 10px', fontSize:9 }}>
              {checking ? '…' : 'Check price'}
            </button>
          )}
          {item.url && (
            <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'7px 10px', border:'1px solid #D8D4CE', fontSize:9, letterSpacing:'0.1em', textTransform:'uppercase', color:'#9C9890', textDecoration:'none', transition:'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#1C1C1C'; e.currentTarget.style.color = '#1C1C1C' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#D8D4CE'; e.currentTarget.style.color = '#9C9890' }}>
              View ↗
            </a>
          )}
          <button onClick={() => onEdit(item)} className="btn-ghost" style={{ padding:'7px 10px', fontSize:9 }}>Edit</button>
          <button onClick={() => onRemove(item.id)} className="btn-ghost" style={{ padding:'7px 10px', fontSize:9, color:'#C09890' }}>×</button>
        </div>
      </div>
    </div>
  )
}

/* ─── Outfit Card ─── */
function OutfitCard({ outfit, items, onEdit }) {
  const pieces = outfit.itemIds.map(id => items.find(i => i.id === id)).filter(Boolean)
  return (
    <div onClick={() => onEdit(outfit)} style={{ cursor:'pointer', display:'flex', flexDirection:'column', gap:10 }}>
      <div style={{ display:'flex', gap:3, aspectRatio:'3/2', overflow:'hidden', background:'#EAE7E2' }}>
        {pieces.slice(0, 4).map(item => (
          <div key={item.id} style={{ flex:1, height:'100%', overflow:'hidden', background:'#E0DDD8' }}>
            {item.photo && <img src={item.photo} alt="" style={{ width:'100%', height:'100%', objectFit:'contain' }} />}
          </div>
        ))}
        {Array.from({ length: Math.max(0, 3 - pieces.length) }).map((_, i) => <div key={i} style={{ flex:1, background:'#E8E5E0' }} />)}
      </div>
      <div>
        <div style={{ fontFamily:"'Playfair Display', serif", fontSize:13, color:'#1C1C1C' }}>{outfit.name}</div>
        <div style={{ fontSize:9, letterSpacing:'0.1em', textTransform:'uppercase', color:'#9C9890', marginTop:2 }}>{pieces.length} pieces</div>
      </div>
    </div>
  )
}

/* ─── Main App ─── */
export default function App() {
  const [items, setItems] = useState(() => load('wardrobe_items', []))
  const [outfits, setOutfits] = useState(() => load('wardrobe_outfits', []))
  const [wishlist, setWishlist] = useState(() => load('wardrobe_wishlist', []))
  const [view, setView] = useState('items')
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('All')
  const [filterBrand, setFilterBrand] = useState('')
  const [filterColour, setFilterColour] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [outfitOpen, setOutfitOpen] = useState(false)
  const [wishOpen, setWishOpen] = useState(false)
  const [editOutfit, setEditOutfit] = useState(null)
  const [editWish, setEditWish] = useState(null)
  const [selected, setSelected] = useState(null)
  const [filtersVisible, setFiltersVisible] = useState(false)

  useEffect(() => save('wardrobe_items', items), [items])
  useEffect(() => save('wardrobe_outfits', outfits), [outfits])
  useEffect(() => save('wardrobe_wishlist', wishlist), [wishlist])

  const addItem = item => setItems(p => [item, ...p])
  const removeItem = id => {
    setItems(p => p.filter(i => i.id !== id))
    setOutfits(p => p.map(o => ({ ...o, itemIds: o.itemIds.filter(x => x !== id) })).filter(o => o.itemIds.length > 0))
  }
  const saveOutfit = outfit => setOutfits(p => p.some(o => o.id === outfit.id) ? p.map(o => o.id === outfit.id ? outfit : o) : [outfit, ...p])
  const deleteOutfit = id => setOutfits(p => p.filter(o => o.id !== id))
  const addWish = item => setWishlist(p => [item, ...p])
  const saveWish = item => setWishlist(p => p.map(w => w.id === item.id ? item : w))
  const removeWish = id => setWishlist(p => p.filter(w => w.id !== id))

  const checkWishPrice = async (id) => {
    const item = wishlist.find(w => w.id === id)
    if (!item?.url) return
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 500,
          tools: [{ type: 'web_search_20250305', name: 'web_search' }],
          messages: [{
            role: 'user',
            content: `Check the current price of this product and whether it's on sale. URL: ${item.url}
Search for the product and return ONLY a JSON object:
{ "currentPrice": "£XX.XX or null", "originalPrice": "£XX.XX or null", "onSale": true/false, "discount": "XX% off or null", "inStock": true/false/null, "summary": "one sentence" }
Return ONLY the JSON.`
          }]
        })
      })
      const data = await response.json()
      const text = data.content?.filter(b => b.type === 'text').map(b => b.text).join('')
      const match = text?.match(/\{[\s\S]*\}/)
      if (match) {
        const priceInfo = JSON.parse(match[0])
        setWishlist(p => p.map(w => w.id === id ? { ...w, priceInfo, lastChecked: new Date().toISOString() } : w))
      }
    } catch {}
  }

  const cats = ['All', ...CATEGORIES.filter(c => items.some(i => i.category === c))]
  const brands = [...new Set(items.map(i => i.brand).filter(Boolean))].sort()
  const allColours = [...new Set(items.flatMap(i => i.colours || []))].sort()
  const activeFilters = (filterCat !== 'All' ? 1 : 0) + (filterBrand ? 1 : 0) + (filterColour ? 1 : 0)
  const saleCount = wishlist.filter(w => w.priceInfo?.onSale).length

  const filtered = useMemo(() => items.filter(item => {
    if (search && !`${item.name} ${item.brand} ${(item.colours || []).join(' ')} ${item.category}`.toLowerCase().includes(search.toLowerCase())) return false
    if (filterCat !== 'All' && item.category !== filterCat) return false
    if (filterBrand && item.brand !== filterBrand) return false
    if (filterColour && !(item.colours || []).map(c => c.toLowerCase()).includes(filterColour.toLowerCase())) return false
    return true
  }), [items, search, filterCat, filterBrand, filterColour])

  return (
    <div style={{ minHeight:'100vh', background:'#F5F3F0' }}>
      {/* Header */}
      <header style={{ position:'sticky', top:0, zIndex:30, background:'#F5F3F0', borderBottom:'1px solid #E0DDD8' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', padding:'0 32px', display:'flex', alignItems:'center', height:52, gap:28 }}>
          <span style={{ fontFamily:"'Playfair Display', serif", fontSize:17, color:'#1C1C1C', letterSpacing:'0.02em', flexShrink:0 }}>Wardrobe</span>
          <nav style={{ display:'flex', gap:20 }}>
            <button className={`tab${view === 'items' ? ' active' : ''}`} onClick={() => setView('items')}>Items</button>
            <button className={`tab${view === 'outfits' ? ' active' : ''}`} onClick={() => setView('outfits')}>Outfits</button>
            <button className={`tab${view === 'wishlist' ? ' active' : ''}`} onClick={() => setView('wishlist')} style={{ position:'relative' }}>
              Wishlist
              {saleCount > 0 && <span style={{ position:'absolute', top:-4, right:-10, width:14, height:14, background:'#C05040', borderRadius:'50%', fontSize:8, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:500 }}>{saleCount}</span>}
            </button>
          </nav>

          {view === 'items' && (
            <div className="search-wrap" style={{ flex:1, maxWidth:240 }}>
              <span className="search-icon">⌕</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…" />
            </div>
          )}

          <div style={{ flex:1 }} />

          {view === 'items' && items.length > 0 && (
            <>
              <span style={{ fontSize:10, letterSpacing:'0.1em', color:'#9C9890', textTransform:'uppercase', flexShrink:0 }}>
                {filtered.length !== items.length ? `${filtered.length} / ${items.length}` : `${items.length} piece${items.length !== 1 ? 's' : ''}`}
              </span>
              {(cats.length > 2 || brands.length > 0 || allColours.length > 0) && (
                <button onClick={() => setFiltersVisible(v => !v)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:10, letterSpacing:'0.12em', textTransform:'uppercase', color: filtersVisible || activeFilters > 0 ? '#1C1C1C' : '#9C9890', flexShrink:0, transition:'color 0.15s' }}>
                  Filter{activeFilters > 0 ? ` (${activeFilters})` : ''}
                </button>
              )}
              {activeFilters > 0 && <button onClick={() => { setFilterCat('All'); setFilterBrand(''); setFilterColour('') }} style={{ background:'none', border:'none', cursor:'pointer', fontSize:10, letterSpacing:'0.12em', textTransform:'uppercase', color:'#B8B4AE', flexShrink:0 }}>Clear</button>}
            </>
          )}

          <button className="btn-primary" style={{ flexShrink:0, padding:'8px 18px' }}
            onClick={() => {
              if (view === 'outfits') { setEditOutfit(null); setOutfitOpen(true) }
              else if (view === 'wishlist') { setEditWish(null); setWishOpen(true) }
              else setAddOpen(true)
            }}>
            + {view === 'outfits' ? 'Outfit' : view === 'wishlist' ? 'Add' : 'Add'}
          </button>
        </div>

        {/* Filter bar */}
        {view === 'items' && filtersVisible && (
          <div style={{ maxWidth:1100, margin:'0 auto', padding:'10px 32px 12px', borderTop:'1px solid #E8E4DE', display:'flex', flexDirection:'column', gap:8 }}>
            {cats.length > 2 && (
              <div style={{ display:'flex', gap:4, flexWrap:'wrap', alignItems:'center' }}>
                <span style={{ fontSize:9, letterSpacing:'0.14em', textTransform:'uppercase', color:'#B8B4AE', marginRight:6, minWidth:44 }}>Type</span>
                {cats.map(c => <button key={c} className={`pill${filterCat === c ? ' active' : ''}`} onClick={() => setFilterCat(filterCat === c && c !== 'All' ? 'All' : c)}>{c}</button>)}
              </div>
            )}
            {brands.length > 0 && (
              <div style={{ display:'flex', gap:4, flexWrap:'wrap', alignItems:'center' }}>
                <span style={{ fontSize:9, letterSpacing:'0.14em', textTransform:'uppercase', color:'#B8B4AE', marginRight:6, minWidth:44 }}>Brand</span>
                {brands.map(b => <button key={b} className={`pill${filterBrand === b ? ' active' : ''}`} onClick={() => setFilterBrand(filterBrand === b ? '' : b)}>{b}</button>)}
              </div>
            )}
            {allColours.length > 0 && (
              <div style={{ display:'flex', gap:4, flexWrap:'wrap', alignItems:'center' }}>
                <span style={{ fontSize:9, letterSpacing:'0.14em', textTransform:'uppercase', color:'#B8B4AE', marginRight:6, minWidth:44 }}>Colour</span>
                {allColours.map(c => <button key={c} className={`pill${filterColour === c ? ' active' : ''}`} onClick={() => setFilterColour(filterColour === c ? '' : c)}>{c}</button>)}
              </div>
            )}
          </div>
        )}
      </header>

      {/* Main content */}
      <main style={{ maxWidth:1100, margin:'0 auto', padding:'36px 32px 80px' }}>

        {/* Items */}
        {view === 'items' && (
          items.length === 0 ? (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'55vh', gap:14, textAlign:'center' }}>
              <div style={{ width:48, height:64, border:'1px solid #D8D4CE', display:'flex', alignItems:'center', justifyContent:'center' }}><span style={{ fontSize:16, opacity:0.1 }}>◻</span></div>
              <div style={{ fontFamily:"'Playfair Display', serif", fontSize:18, color:'#1C1C1C' }}>Your wardrobe is empty</div>
              <div style={{ fontSize:10, letterSpacing:'0.1em', textTransform:'uppercase', color:'#B8B4AE' }}>Add your first piece to begin</div>
              <button className="btn-primary" style={{ marginTop:8 }} onClick={() => setAddOpen(true)}>Add piece</button>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign:'center', padding:'80px 0', fontFamily:"'Playfair Display', serif", fontSize:16, color:'#C8C4BC', fontStyle:'italic' }}>Nothing matches</div>
          ) : (
            <div className="items-grid">
              {filtered.map((item, i) => (
                <div key={item.id} className="item-card fade-up" style={{ animationDelay:`${i * 0.03}s` }} onClick={() => setSelected(item)}>
                  <div className="item-card-img">
                    {item.photo ? <img src={item.photo} alt={item.name} /> : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center' }}><span style={{ fontSize:18, opacity:0.08 }}>◻</span></div>}
                    {item.brand && <div className="item-card-brand">{item.brand}</div>}
                  </div>
                  <div className="item-card-name">{item.name}</div>
                  {item.colours?.length > 0 && <div className="item-card-meta">{item.colours.join(' · ')}</div>}
                </div>
              ))}
            </div>
          )
        )}

        {/* Outfits */}
        {view === 'outfits' && (
          outfits.length === 0 ? (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'55vh', gap:14, textAlign:'center' }}>
              <div style={{ fontFamily:"'Playfair Display', serif", fontSize:18, color:'#1C1C1C' }}>No outfits yet</div>
              <div style={{ fontSize:10, letterSpacing:'0.1em', textTransform:'uppercase', color:'#B8B4AE' }}>Build looks from your wardrobe</div>
              <button className="btn-primary" style={{ marginTop:8 }} onClick={() => { setEditOutfit(null); setOutfitOpen(true) }}>Create outfit</button>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:'28px 16px' }}>
              {outfits.map(o => <OutfitCard key={o.id} outfit={o} items={items} onEdit={o => { setEditOutfit(o); setOutfitOpen(true) }} />)}
            </div>
          )
        )}

        {/* Wishlist */}
        {view === 'wishlist' && (
          <>
            {saleCount > 0 && (
              <div style={{ marginBottom:24, padding:'12px 16px', background:'#FDF0EE', borderLeft:'2px solid #C05040', display:'flex', alignItems:'center', gap:10 }}>
                <span className="sale-badge">{saleCount} on sale</span>
                <span style={{ fontSize:12, color:'#6C6860' }}>Items on your wishlist have dropped in price</span>
              </div>
            )}
            {wishlist.length === 0 ? (
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'55vh', gap:14, textAlign:'center' }}>
                <div style={{ fontFamily:"'Playfair Display', serif", fontSize:18, color:'#1C1C1C' }}>Your wishlist is empty</div>
                <div style={{ fontSize:10, letterSpacing:'0.1em', textTransform:'uppercase', color:'#B8B4AE' }}>Save items you want — track prices & sales</div>
                <button className="btn-primary" style={{ marginTop:8 }} onClick={() => { setEditWish(null); setWishOpen(true) }}>Add item</button>
              </div>
            ) : (
              <div className="wishlist-grid">
                {wishlist.map((item, i) => (
                  <div key={item.id} className="fade-up" style={{ animationDelay:`${i * 0.04}s` }}>
                    <WishlistCard item={item} onEdit={w => { setEditWish(w); setWishOpen(true) }} onRemove={removeWish} onCheckPrice={checkWishPrice} />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <AddDrawer open={addOpen} onClose={() => setAddOpen(false)} onAdd={addItem} />
      <OutfitDrawer open={outfitOpen} onClose={() => setOutfitOpen(false)} items={items} onSave={saveOutfit} onDelete={deleteOutfit} editingOutfit={editOutfit} />
      <WishlistDrawer open={wishOpen} onClose={() => setWishOpen(false)} onAdd={addWish} editing={editWish} onSave={saveWish} />
      <DetailModal item={selected} open={!!selected} onClose={() => setSelected(null)} onRemove={removeItem} />
    </div>
  )
}
