import React, { useState, useRef, useMemo, useEffect } from "react";

/* ─── Supabase config ─── */
const SUPABASE_URL = "https://nnizkpgkvrzuktwjnfex.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5uaXprcGdrdnJ6dWt0d2puZmV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MjAzMDEsImV4cCI6MjA4ODM5NjMwMX0.hdceXg2BzFQwxyp-433FydtLKwtl1vnQ33QcG4dWIKk";

const db = {
  async getAll(table) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  async upsert(table, row) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json", Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify(row),
    });
    if (!res.ok) throw new Error(await res.text());
  },
  async remove(table, id) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
      method: "DELETE",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    });
    if (!res.ok) throw new Error(await res.text());
  },
};

/* ─── Constants ─── */
const CATEGORIES = [
  "Outerwear", "Knitwear", "Shirts", "T-Shirts",
  "Trousers", "Denim", "Shorts", "Suits",
  "Shoes", "Accessories", "Bags", "Other"
];
const STEPS = ["Category", "Details", "Photo"];
const EMPTY_FORM = { category: "", name: "", colours: [], brand: "", price: "", notes: "", photo: null };

/* ─── Shared primitives ─── */
const inputBase = {
  width: "100%", padding: "11px 0", border: "none", borderBottom: "1px solid #E8E4DF",
  background: "transparent", outline: "none", fontSize: 15,
  fontFamily: "'Cormorant Garamond', Georgia, serif", color: "#1a1a1a", transition: "border-color 0.2s",
};

const Label = ({ children }) => (
  <div style={{ fontSize: 10, letterSpacing: "0.13em", textTransform: "uppercase", color: "#B0ABA4", marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>{children}</div>
);

function Field({ label, children }) {
  return <div style={{ display: "flex", flexDirection: "column" }}><Label>{label}</Label>{children}</div>;
}

function TextInput({ value, onChange, placeholder, onKeyDown }) {
  const [focused, setFocused] = useState(false);
  return (
    <input value={value} onChange={onChange} placeholder={placeholder} onKeyDown={onKeyDown}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      style={{ ...inputBase, borderBottomColor: focused ? "#1a1a1a" : "#E8E4DF" }} />
  );
}

function PriceInput({ value, onChange }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: "flex", alignItems: "center", borderBottom: `1px solid ${focused ? "#1a1a1a" : "#E8E4DF"}`, transition: "border-color 0.2s" }}>
      <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 15, color: value ? "#1a1a1a" : "#B0ABA4", padding: "11px 2px 11px 0" }}>£</span>
      <input type="text" value={value} onChange={onChange} placeholder="0.00"
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ ...inputBase, borderBottom: "none", flex: 1, paddingLeft: 0 }} />
    </div>
  );
}

function Pill({ label, active, onClick, onRemove }) {
  return (
    <button onClick={onClick} style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: onRemove ? "5px 8px 5px 12px" : "5px 12px",
      borderRadius: 2, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase",
      cursor: "pointer", transition: "all 0.15s",
      border: active ? "1px solid #1a1a1a" : "1px solid #E0DDD9",
      background: active ? "#1a1a1a" : "transparent",
      color: active ? "#fff" : "#999",
      fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap",
    }}>
      {label}
      {onRemove && <span onClick={e => { e.stopPropagation(); onRemove(); }} style={{ fontSize: 13, lineHeight: 1, opacity: 0.6, marginTop: -1 }}>×</span>}
    </button>
  );
}

function ColourInput({ colours, onChange }) {
  const [input, setInput] = useState("");
  const add = () => {
    const val = input.trim();
    if (val && !colours.map(c => c.toLowerCase()).includes(val.toLowerCase())) onChange([...colours, val]);
    setInput("");
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", borderBottom: "1px solid #E8E4DF" }}>
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder="e.g. Navy — press Enter to add"
          style={{ ...inputBase, borderBottom: "none", flex: 1 }} />
        {input.trim() && <button onClick={add} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "#888", fontFamily: "'DM Sans', sans-serif", padding: "0 0 0 8px" }}>Add</button>}
      </div>
      {colours.length > 0 && (
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {colours.map((c, i) => <Pill key={i} label={c} active onRemove={() => onChange(colours.filter((_, idx) => idx !== i))} />)}
        </div>
      )}
    </div>
  );
}

function PhotoUpload({ value, onChange }) {
  const inputRef = useRef();
  const [dragging, setDragging] = useState(false);
  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => onChange(e.target.result);
    reader.readAsDataURL(file);
  };
  return (
    <div onClick={() => inputRef.current.click()}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
      style={{ width: "100%", aspectRatio: "4/5", border: `1.5px dashed ${dragging ? "#1a1a1a" : "#D8D4CF"}`, borderRadius: 2, cursor: "pointer", overflow: "hidden", position: "relative", background: value ? "#F7F5F2" : "#FAFAF9", transition: "border-color 0.2s", display: "flex", alignItems: "center", justifyContent: "center" }}>
      {value ? (
        <>
          <img src={value} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0)", transition: "background 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(0,0,0,0.22)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(0,0,0,0)"}>
            <span style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "#fff", fontFamily: "'DM Sans', sans-serif", background: "rgba(0,0,0,0.4)", padding: "6px 14px", borderRadius: 2 }}>Change</span>
          </div>
        </>
      ) : (
        <div style={{ textAlign: "center", pointerEvents: "none" }}>
          <div style={{ fontSize: 28, opacity: 0.15, marginBottom: 10 }}>↑</div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#C0BDB9", letterSpacing: "0.08em", textTransform: "uppercase" }}>{dragging ? "Drop here" : "Tap or drag to upload"}</div>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
    </div>
  );
}

function StepBar({ step, labels }) {
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: 36 }}>
      {labels.map((label, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", flex: i < labels.length - 1 ? 1 : "none" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: i <= step ? "#1a1a1a" : "#E0DDD9", transition: "background 0.3s" }} />
            <span style={{ fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: i <= step ? "#1a1a1a" : "#C0BDB9", fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap" }}>{label}</span>
          </div>
          {i < labels.length - 1 && <div style={{ flex: 1, height: 1, background: i < step ? "#1a1a1a" : "#E0DDD9", margin: "-14px 8px 0", transition: "background 0.3s" }} />}
        </div>
      ))}
    </div>
  );
}

function CategoryStep({ value, onChange }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 20, color: "#1a1a1a", marginBottom: 8 }}>What are you adding?</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => onChange(cat)} style={{ padding: "13px 16px", textAlign: "left", border: `1px solid ${value === cat ? "#1a1a1a" : "#E8E4DF"}`, background: value === cat ? "#1a1a1a" : "#fff", color: value === cat ? "#fff" : "#555", borderRadius: 2, cursor: "pointer", fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 15, transition: "all 0.15s" }}>{cat}</button>
        ))}
      </div>
    </div>
  );
}

function DetailsStep({ form, setForm }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 20, color: "#1a1a1a" }}>Tell us about it</div>
      <Field label="Item name"><TextInput value={form.name} placeholder="e.g. Merino crewneck" onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></Field>
      <Field label="Brand"><TextInput value={form.brand} placeholder="e.g. Norse Projects" onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} /></Field>
      <Field label="Colours — type and press Enter to add"><ColourInput colours={form.colours} onChange={v => setForm(f => ({ ...f, colours: v }))} /></Field>
      <Field label="Price paid"><PriceInput value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} /></Field>
      <Field label="Notes">
        <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Fit, care instructions, where you bought it…" rows={3} style={{ ...inputBase, resize: "none", lineHeight: 1.6, borderBottom: "1px solid #E8E4DF" }} />
      </Field>
    </div>
  );
}

function PhotoStep({ form, setForm }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 20, color: "#1a1a1a" }}>Add a photo</div>
      <PhotoUpload value={form.photo} onChange={v => setForm(f => ({ ...f, photo: v }))} />
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#C0BDB9", textAlign: "center" }}>Optional — but makes your wardrobe look great</div>
    </div>
  );
}

function AddDrawer({ open, onClose, onAdd, saving }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(EMPTY_FORM);
  const reset = () => { setStep(0); setForm(EMPTY_FORM); };
  const close = () => { reset(); onClose(); };
  const canNext = step === 0 ? !!form.category : step === 1 ? !!form.name.trim() : true;
  const handleNext = async () => {
    if (step < STEPS.length - 1) setStep(s => s + 1);
    else { await onAdd({ ...form, id: Date.now() }); close(); }
  };
  return (
    <>
      <div onClick={close} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.12)", opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none", transition: "opacity 0.3s", zIndex: 40 }} />
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 400, background: "#fff", zIndex: 50, transform: open ? "translateX(0)" : "translateX(100%)", transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1)", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "28px 32px 24px", borderBottom: "1px solid #F0EDE8", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 20, fontWeight: 600, color: "#1a1a1a" }}>New piece</span>
          <button onClick={close} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: "#C0BDB9", lineHeight: 1, padding: 0 }}>×</button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
          <StepBar step={step} labels={STEPS} />
          {step === 0 && <CategoryStep value={form.category} onChange={v => setForm(f => ({ ...f, category: v }))} />}
          {step === 1 && <DetailsStep form={form} setForm={setForm} />}
          {step === 2 && <PhotoStep form={form} setForm={setForm} />}
        </div>
        <div style={{ padding: "20px 32px", borderTop: "1px solid #F0EDE8", display: "flex", gap: 10, flexShrink: 0 }}>
          {step > 0 && <button onClick={() => setStep(s => s - 1)} style={{ flex: 1, padding: "13px", background: "transparent", border: "1px solid #E8E4DF", borderRadius: 2, cursor: "pointer", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "#888", fontFamily: "'DM Sans', sans-serif" }}>Back</button>}
          <button onClick={handleNext} disabled={!canNext || saving} style={{ flex: 2, padding: "13px", background: canNext && !saving ? "#1a1a1a" : "#E8E4DF", border: "none", borderRadius: 2, cursor: canNext ? "pointer" : "default", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: canNext && !saving ? "#fff" : "#B0ABA4", fontFamily: "'DM Sans', sans-serif", transition: "background 0.2s" }}>
            {saving && step === STEPS.length - 1 ? "Saving…" : step < STEPS.length - 1 ? "Continue" : "Add to wardrobe"}
          </button>
        </div>
      </div>
    </>
  );
}

function OutfitDrawer({ open, onClose, items, onSave, onDelete, editingOutfit, saving }) {
  const [name, setName] = useState("");
  const [selected, setSelected] = useState([]);
  useMemo(() => {
    if (editingOutfit) { setName(editingOutfit.name); setSelected(editingOutfit.itemIds); }
    else { setName(""); setSelected([]); }
  }, [editingOutfit, open]);
  const toggle = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const canSave = name.trim() && selected.length > 0;
  const close = () => { setName(""); setSelected([]); onClose(); };
  const handleSave = async () => {
    if (!canSave) return;
    await onSave({ id: editingOutfit?.id || Date.now(), name: name.trim(), itemIds: selected });
    close();
  };
  return (
    <>
      <div onClick={close} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.12)", opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none", transition: "opacity 0.3s", zIndex: 40 }} />
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 420, background: "#fff", zIndex: 50, transform: open ? "translateX(0)" : "translateX(100%)", transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1)", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "28px 32px 24px", borderBottom: "1px solid #F0EDE8", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 20, fontWeight: 600, color: "#1a1a1a" }}>{editingOutfit ? "Edit outfit" : "New outfit"}</span>
          <button onClick={close} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: "#C0BDB9", lineHeight: 1, padding: 0 }}>×</button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px", display: "flex", flexDirection: "column", gap: 28 }}>
          <Field label="Outfit name"><TextInput value={name} placeholder="e.g. Smart casual Friday" onChange={e => setName(e.target.value)} /></Field>
          <div>
            <Label>Select pieces ({selected.length} selected)</Label>
            {items.length === 0
              ? <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 15, color: "#C0BDB9", paddingTop: 8 }}>Add some items to your wardrobe first</div>
              : CATEGORIES.filter(cat => items.some(i => i.category === cat)).map(cat => (
                <div key={cat}>
                  <div style={{ fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "#C0BDB9", fontFamily: "'DM Sans', sans-serif", padding: "12px 0 6px" }}>{cat}</div>
                  {items.filter(i => i.category === cat).map(item => {
                    const isSel = selected.includes(item.id);
                    return (
                      <div key={item.id} onClick={() => toggle(item.id)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 2, cursor: "pointer", transition: "background 0.15s", background: isSel ? "#F7F5F2" : "transparent", border: `1px solid ${isSel ? "#E0DDD9" : "transparent"}`, marginBottom: 4 }}>
                        <div style={{ width: 40, height: 52, borderRadius: 1, overflow: "hidden", background: "#F0EDE8", flexShrink: 0 }}>
                          {item.photo ? <img src={item.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 12, opacity: 0.15 }}>◻</span></div>}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 15, color: "#1a1a1a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</div>
                          {item.brand && <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: "#B0ABA4", letterSpacing: "0.06em", textTransform: "uppercase", marginTop: 2 }}>{item.brand}</div>}
                        </div>
                        <div style={{ width: 18, height: 18, borderRadius: "50%", flexShrink: 0, border: `1.5px solid ${isSel ? "#1a1a1a" : "#D8D4CF"}`, background: isSel ? "#1a1a1a" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
                          {isSel && <span style={{ color: "#fff", fontSize: 10, lineHeight: 1 }}>✓</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))
            }
          </div>
        </div>
        <div style={{ padding: "20px 32px", borderTop: "1px solid #F0EDE8", display: "flex", gap: 10, flexShrink: 0 }}>
          {editingOutfit && <button onClick={async () => { await onDelete(editingOutfit.id); close(); }} style={{ flex: 1, padding: "13px", background: "transparent", border: "1px solid #E8E4DF", borderRadius: 2, cursor: "pointer", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "#C0BDB9", fontFamily: "'DM Sans', sans-serif" }}>Delete</button>}
          <button onClick={handleSave} disabled={!canSave || saving} style={{ flex: 2, padding: "13px", background: canSave && !saving ? "#1a1a1a" : "#E8E4DF", border: "none", borderRadius: 2, cursor: canSave ? "pointer" : "default", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: canSave && !saving ? "#fff" : "#B0ABA4", fontFamily: "'DM Sans', sans-serif", transition: "background 0.2s" }}>
            {saving ? "Saving…" : "Save outfit"}
          </button>
        </div>
      </div>
    </>
  );
}

function ItemCard({ item, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div onClick={() => onClick(item)} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} style={{ cursor: "pointer", display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ aspectRatio: "3/4", borderRadius: 2, overflow: "hidden", background: "#F0EDE8", position: "relative", boxShadow: hovered ? "0 8px 28px rgba(0,0,0,0.09)" : "none", transition: "box-shadow 0.25s" }}>
        {item.photo
          ? <img src={item.photo} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "contain", display: "block", transform: hovered ? "scale(1.02)" : "scale(1)", transition: "transform 0.4s cubic-bezier(0.4,0,0.2,1)" }} />
          : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 22, opacity: 0.1 }}>◻</span></div>
        }
        {item.brand && <div style={{ position: "absolute", bottom: 10, left: 10, background: "rgba(255,255,255,0.92)", padding: "3px 8px", borderRadius: 1, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: "#555", fontFamily: "'DM Sans', sans-serif", opacity: hovered ? 1 : 0, transition: "opacity 0.2s" }}>{item.brand}</div>}
      </div>
      <div>
        <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 15, fontWeight: 500, color: "#1a1a1a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: 4 }}>{item.name}</div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {(item.colours || []).map((c, i) => <span key={i} style={{ fontSize: 10, letterSpacing: "0.07em", textTransform: "uppercase", color: "#B0ABA4", fontFamily: "'DM Sans', sans-serif" }}>{c}{i < item.colours.length - 1 ? " ·" : ""}</span>)}
        </div>
      </div>
    </div>
  );
}

function OutfitCard({ outfit, items, onEdit }) {
  const pieces = outfit.itemIds.map(id => items.find(i => i.id === id)).filter(Boolean);
  const [hovered, setHovered] = useState(false);
  return (
    <div onClick={() => onEdit(outfit)} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ cursor: "pointer", background: "#fff", border: "1px solid #EBEBEB", borderRadius: 2, padding: "20px", display: "flex", flexDirection: "column", gap: 14, boxShadow: hovered ? "0 4px 20px rgba(0,0,0,0.07)" : "none", transition: "box-shadow 0.2s" }}>
      <div style={{ display: "flex", gap: 6 }}>
        {pieces.slice(0, 4).map(item => (
          <div key={item.id} style={{ flex: 1, aspectRatio: "2/3", borderRadius: 1, overflow: "hidden", background: "#F0EDE8" }}>
            {item.photo ? <img src={item.photo} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 14, opacity: 0.1 }}>◻</span></div>}
          </div>
        ))}
        {pieces.length > 4 && <div style={{ flex: 1, aspectRatio: "2/3", borderRadius: 1, background: "#F0EDE8", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#B0ABA4" }}>+{pieces.length - 4}</span></div>}
      </div>
      <div>
        <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 17, fontWeight: 500, color: "#1a1a1a", marginBottom: 4 }}>{outfit.name}</div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: "#C0BDB9" }}>{pieces.length} pieces</div>
      </div>
    </div>
  );
}

function DetailModal({ item, open, onClose, onRemove }) {
  if (!item) return null;
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.18)", opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none", transition: "opacity 0.25s", zIndex: 60 }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: open ? "translate(-50%, -50%)" : "translate(-50%, -48%)", opacity: open ? 1 : 0, transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)", pointerEvents: open ? "auto" : "none", background: "#fff", borderRadius: 3, zIndex: 70, width: "min(680px, 92vw)", maxHeight: "90vh", overflow: "hidden", display: "flex" }}>
        <div style={{ width: 260, flexShrink: 0, background: "#F7F5F2", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {item.photo ? <img src={item.photo} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} /> : <span style={{ fontSize: 36, opacity: 0.1 }}>◻</span>}
        </div>
        <div style={{ flex: 1, padding: "32px 32px 28px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "#B0ABA4", fontFamily: "'DM Sans', sans-serif", marginBottom: 6 }}>{item.category}</div>
              <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, fontWeight: 600, color: "#1a1a1a", lineHeight: 1.2 }}>{item.name}</div>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: "#C0BDB9", lineHeight: 1, padding: 0, flexShrink: 0 }}>×</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[["Brand", item.brand], ["Price", item.price ? `£${item.price}` : null], ["Notes", item.notes]].filter(([, v]) => v).map(([label, val]) => (
              <div key={label}>
                <div style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "#B0ABA4", fontFamily: "'DM Sans', sans-serif", marginBottom: 4 }}>{label}</div>
                <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 16, color: "#333", lineHeight: 1.5 }}>{val}</div>
              </div>
            ))}
            {item.colours?.length > 0 && (
              <div>
                <div style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "#B0ABA4", fontFamily: "'DM Sans', sans-serif", marginBottom: 8 }}>Colours</div>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>{item.colours.map((c, i) => <Pill key={i} label={c} active />)}</div>
              </div>
            )}
          </div>
          <button onClick={() => { onRemove(item.id); onClose(); }} style={{ marginTop: "auto", padding: "11px", background: "transparent", border: "1px solid #E8E4DF", borderRadius: 2, cursor: "pointer", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "#C0BDB9", fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#1a1a1a"; e.currentTarget.style.color = "#1a1a1a"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#E8E4DF"; e.currentTarget.style.color = "#C0BDB9"; }}>
            Remove from wardrobe
          </button>
        </div>
      </div>
    </>
  );
}

function FilterBar({ items, filters, setFilters }) {
  const cats = ["All", ...CATEGORIES.filter(c => items.some(i => i.category === c))];
  const brands = [...new Set(items.map(i => i.brand).filter(Boolean))].sort();
  const allColours = [...new Set(items.flatMap(i => i.colours || []))].sort();
  if (cats.length <= 2 && brands.length === 0 && allColours.length === 0) return null;
  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 36px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
      {cats.length > 2 && (
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "#C0BDB9", fontFamily: "'DM Sans', sans-serif", marginRight: 4, minWidth: 48 }}>Category</span>
          {cats.map(c => <Pill key={c} label={c} active={filters.category === c} onClick={() => setFilters(f => ({ ...f, category: f.category === c ? "All" : c }))} />)}
        </div>
      )}
      {brands.length > 0 && (
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "#C0BDB9", fontFamily: "'DM Sans', sans-serif", marginRight: 4, minWidth: 48 }}>Brand</span>
          {brands.map(b => <Pill key={b} label={b} active={filters.brand === b} onClick={() => setFilters(f => ({ ...f, brand: f.brand === b ? "" : b }))} />)}
        </div>
      )}
      {allColours.length > 0 && (
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "#C0BDB9", fontFamily: "'DM Sans', sans-serif", marginRight: 4, minWidth: 48 }}>Colour</span>
          {allColours.map(c => <Pill key={c} label={c} active={filters.colour === c} onClick={() => setFilters(f => ({ ...f, colour: f.colour === c ? "" : c }))} />)}
        </div>
      )}
    </div>
  );
}

function EmptyState({ onAdd }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 16, textAlign: "center" }}>
      <div style={{ width: 64, height: 84, border: "1.5px dashed #D8D4CF", borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4 }}><span style={{ fontSize: 20, opacity: 0.12 }}>◻</span></div>
      <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 20, color: "#1a1a1a", fontWeight: 500 }}>Your wardrobe is empty</div>
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#C0BDB9" }}>Add your first piece to get started</div>
      <button onClick={onAdd} style={{ marginTop: 8, padding: "11px 26px", background: "#1a1a1a", color: "#fff", border: "none", borderRadius: 2, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Add piece</button>
    </div>
  );
}

/* ─── Root ─── */
export default function Wardrobe() {
  const [items, setItems] = useState([]);
  const [outfits, setOutfits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncError, setSyncError] = useState(false);
  const [view, setView] = useState("wardrobe");
  const [addOpen, setAddOpen] = useState(false);
  const [outfitDrawerOpen, setOutfitDrawerOpen] = useState(false);
  const [editingOutfit, setEditingOutfit] = useState(null);
  const [selected, setSelected] = useState(null);
  const [filters, setFilters] = useState({ category: "All", brand: "", colour: "" });

  /* Load on mount — show cached data instantly, then sync from Supabase */
  useEffect(() => {
    try {
      const cachedItems = localStorage.getItem("wardrobe_items");
      const cachedOutfits = localStorage.getItem("wardrobe_outfits");
      if (cachedItems) { setItems(JSON.parse(cachedItems)); setLoading(false); }
      if (cachedOutfits) setOutfits(JSON.parse(cachedOutfits));
    } catch {}
    (async () => {
      try {
        const [rawItems, rawOutfits] = await Promise.all([db.getAll("items"), db.getAll("outfits")]);
        const newItems = rawItems.map(r => r.data);
        const newOutfits = rawOutfits.map(r => r.data);
        setItems(newItems);
        setOutfits(newOutfits);
        localStorage.setItem("wardrobe_items", JSON.stringify(newItems));
        localStorage.setItem("wardrobe_outfits", JSON.stringify(newOutfits));
      } catch { setSyncError(true); }
      finally { setLoading(false); }
    })();
  }, []);

  const handleAddItem = async (item) => {
    setSaving(true);
    try { await db.upsert("items", { id: item.id, data: item }); setItems(prev => [item, ...prev]); }
    catch { setSyncError(true); }
    finally { setSaving(false); }
  };

  const handleRemoveItem = async (id) => {
    try {
      await db.remove("items", id);
      setItems(prev => prev.filter(i => i.id !== id));
      const affected = outfits.filter(o => o.itemIds.includes(id));
      for (const o of affected) {
        const updated = { ...o, itemIds: o.itemIds.filter(iid => iid !== id) };
        if (updated.itemIds.length === 0) { await db.remove("outfits", o.id); }
        else { await db.upsert("outfits", { id: updated.id, data: updated }); }
      }
      setOutfits(prev => prev.map(o => ({ ...o, itemIds: o.itemIds.filter(iid => iid !== id) })).filter(o => o.itemIds.length > 0));
    } catch { setSyncError(true); }
  };

  const handleSaveOutfit = async (outfit) => {
    setSaving(true);
    try {
      await db.upsert("outfits", { id: outfit.id, data: outfit });
      setOutfits(prev => prev.some(o => o.id === outfit.id) ? prev.map(o => o.id === outfit.id ? outfit : o) : [outfit, ...prev]);
    } catch { setSyncError(true); }
    finally { setSaving(false); }
  };

  const handleDeleteOutfit = async (id) => {
    try { await db.remove("outfits", id); setOutfits(prev => prev.filter(o => o.id !== id)); }
    catch { setSyncError(true); }
  };

  const openNewOutfit = () => { setEditingOutfit(null); setOutfitDrawerOpen(true); };
  const openEditOutfit = (outfit) => { setEditingOutfit(outfit); setOutfitDrawerOpen(true); };

  const filtered = useMemo(() => items.filter(item => {
    if (filters.category !== "All" && item.category !== filters.category) return false;
    if (filters.brand && item.brand !== filters.brand) return false;
    if (filters.colour && !(item.colours || []).map(c => c.toLowerCase()).includes(filters.colour.toLowerCase())) return false;
    return true;
  }), [items, filters]);

  const activeFilterCount = (filters.category !== "All" ? 1 : 0) + (filters.brand ? 1 : 0) + (filters.colour ? 1 : 0);

  const navBtn = (v, label) => (
    <button onClick={() => setView(v)} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 0", fontFamily: "'DM Sans', sans-serif", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: view === v ? "#1a1a1a" : "#C0BDB9", borderBottom: `1.5px solid ${view === v ? "#1a1a1a" : "transparent"}`, transition: "all 0.15s" }}>{label}</button>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#FAFAF9" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        textarea { font-family: inherit; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: #E0DDD9; border-radius: 2px; }
      `}</style>

      {/* Sync error banner */}
      {syncError && (
        <div style={{ background: "#FFF3F3", borderBottom: "1px solid #FFDDD9", padding: "10px 36px", fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#C0392B", textAlign: "center" }}>
          Couldn't connect to the database. Check your internet connection and refresh.
          <button onClick={() => setSyncError(false)} style={{ marginLeft: 12, background: "none", border: "none", cursor: "pointer", color: "#C0392B", fontSize: 14 }}>×</button>
        </div>
      )}

      <header style={{ position: "sticky", top: 0, zIndex: 30, background: "#FAFAF9", borderBottom: "1px solid #EBEBEB" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 36px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 58 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
            <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 21, fontWeight: 600, color: "#1a1a1a" }}>Wardrobe</span>
            <div style={{ display: "flex", gap: 20 }}>{navBtn("wardrobe", "Items")}{navBtn("outfits", "Outfits")}</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {view === "wardrobe" && activeFilterCount > 0 && (
              <button onClick={() => setFilters({ category: "All", brand: "", colour: "" })} style={{ padding: "7px 14px", background: "transparent", border: "1px solid #E0DDD9", borderRadius: 2, cursor: "pointer", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: "#B0ABA4", fontFamily: "'DM Sans', sans-serif" }}>Clear filters</button>
            )}
            {view === "wardrobe" && items.length > 0 && (
              <span style={{ fontSize: 11, color: "#C0BDB9", fontFamily: "'DM Sans', sans-serif" }}>
                {filtered.length !== items.length ? `${filtered.length} of ${items.length}` : `${items.length} ${items.length === 1 ? "piece" : "pieces"}`}
              </span>
            )}
            <button onClick={() => view === "outfits" ? openNewOutfit() : setAddOpen(true)}
              style={{ padding: "8px 20px", background: "#1a1a1a", color: "#fff", border: "none", borderRadius: 2, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
              {view === "outfits" ? "+ Outfit" : "+ Add"}
            </button>
          </div>
        </div>
        {view === "wardrobe" && <FilterBar items={items} filters={filters} setFilters={setFilters} />}
      </header>

      <main style={{ maxWidth: 1080, margin: "0 auto", padding: "40px 36px 60px" }}>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "50vh" }}>
            <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 18, color: "#C0BDB9" }}>Loading your wardrobe…</div>
          </div>
        ) : view === "wardrobe" ? (
          items.length === 0 ? <EmptyState onAdd={() => setAddOpen(true)} /> :

          filtered.length === 0 ? <div style={{ textAlign: "center", padding: "80px 0", fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 18, color: "#CCC" }}>No items match these filters</div> :
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(168px, 1fr))", gap: "36px 20px" }}>
            {filtered.map(item => <ItemCard key={item.id} item={item} onClick={setSelected} />)}
          </div>
        ) : (
          outfits.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 16, textAlign: "center" }}>
              <div style={{ width: 64, height: 84, border: "1.5px dashed #D8D4CF", borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4 }}><span style={{ fontSize: 20, opacity: 0.12 }}>◻</span></div>
              <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 20, color: "#1a1a1a", fontWeight: 500 }}>No outfits yet</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#C0BDB9" }}>Build your first outfit from your wardrobe pieces</div>
              <button onClick={openNewOutfit} style={{ marginTop: 8, padding: "11px 26px", background: "#1a1a1a", color: "#fff", border: "none", borderRadius: 2, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Create outfit</button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "24px 20px" }}>
              {outfits.map(outfit => <OutfitCard key={outfit.id} outfit={outfit} items={items} onEdit={openEditOutfit} />)}
            </div>
          )
        )}
      </main>

      <AddDrawer open={addOpen} onClose={() => setAddOpen(false)} onAdd={handleAddItem} saving={saving} />
      <OutfitDrawer open={outfitDrawerOpen} onClose={() => setOutfitDrawerOpen(false)} items={items} onSave={handleSaveOutfit} onDelete={handleDeleteOutfit} editingOutfit={editingOutfit} saving={saving} />
      <DetailModal item={selected} open={!!selected} onClose={() => setSelected(null)} onRemove={handleRemoveItem} />
    </div>
  );
}
