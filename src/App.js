import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "const SUPABASE_URL = "https://gbdeulaydljzbzfbxlfs.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdiZGV1bGF5ZGxqemJ6ZmJ4bGZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMzg0NTQsImV4cCI6MjA5MjgxNDQ1NH0.boj_PW7t2lvp61qdxy1u_sUGIJvBu9khzqkac-w5lWk";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const APP_ID = "mi-alcancia-default";

// ─── DATOS ────────────────────────────────────────────────────
const THEMES = {
  taylor: { name:"Taylor Swift", primary:"#c084fc", secondary:"#f0abfc", accent:"#7c3aed", bg:"#fdf4ff", emoji:"🌟" },
  anime:  { name:"Anime",        primary:"#f472b6", secondary:"#fda4af", accent:"#be185d", bg:"#fff1f2", emoji:"🌸" },
  nature: { name:"Naturaleza",   primary:"#34d399", secondary:"#6ee7b7", accent:"#065f46", bg:"#f0fdf4", emoji:"🌿" },
  kpop:   { name:"K-Pop",        primary:"#60a5fa", secondary:"#93c5fd", accent:"#1d4ed8", bg:"#eff6ff", emoji:"🎤" },
  dino:   { name:"Dinosaurios",  primary:"#fb923c", secondary:"#fcd34d", accent:"#92400e", bg:"#fffbeb", emoji:"🦕" },
  space:  { name:"Espacio",      primary:"#818cf8", secondary:"#c4b5fd", accent:"#3730a3", bg:"#eef2ff", emoji:"🚀" },
};

const DOLAR_QUOTES = {
  blue:    { label:"Dólar Blue",    compra:1140, venta:1160, source:"DolarApi" },
  oficial: { label:"Dólar Oficial", compra:980,  venta:1020, source:"BCRA" },
  mep:     { label:"Dólar MEP",     compra:1115, venta:1135, source:"BYMA" },
  cripto:  { label:"Dólar Cripto",  compra:1150, venta:1170, source:"Bitso" },
};

const BCRA_RATES = {
  AR:{ label:"Argentina (BCRA)",rate:34 }, MX:{ label:"México (Banxico)",rate:11 },
  CL:{ label:"Chile (BCCh)",rate:6.5 }, CO:{ label:"Colombia (BanRep)",rate:10.75 },
  PE:{ label:"Perú (BCRP)",rate:5.75 }, UY:{ label:"Uruguay (BCU)",rate:9.25 },
  BR:{ label:"Brasil (BACEN)",rate:13.75 }, ES:{ label:"España (BCE)",rate:4 },
  US:{ label:"Estados Unidos (Fed)",rate:5.25 }, OTHER:{ label:"Otro país",rate:5 },
};

const DEFAULT_PROFILE = {
  id:"p1", nombre:"", apodo:"", edad:"", ciudad:"", pais:"AR",
  avatar:"🦄", theme:"taylor", pin:"1234", weeklyIncome:2000, streak:0,
  buckets:{
    gastos:{ label:"Gastos del día", pct:25, emoji:"🍭", color:"#f472b6", balance:0, history:[] },
    meta:  { label:"Mi Meta",        pct:15, emoji:"🎮", color:"#a78bfa", balance:0, history:[], goalName:"Mi meta", goalAmount:5000 },
    sueno: { label:"Sueño Grande",   pct:50, emoji:"✈️", color:"#34d399", balance:0, history:[] },
    dar:   { label:"Dar",            pct:10, emoji:"🤝", color:"#fb923c", balance:0, history:[], cause:"Causa solidaria" },
  },
};

const DEFAULT_STATE = {
  profiles:[DEFAULT_PROFILE],
  activeId:"p1",
  rateMode:"bcra",
  customRate:5,
  dolarType:"blue",
};

const fmtARS = n => "$" + Math.round(n).toLocaleString("es-AR");
const fmtUSD = n => "USD " + n.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
const toUSD  = (ars,rate) => ars/rate;

function deepMerge(target, source) {
  const out = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key]==="object" && !Array.isArray(source[key])) {
      out[key] = deepMerge(target[key]||{}, source[key]);
    } else { out[key] = source[key]; }
  }
  return out;
}

// ─── ICONOS Y COMPONENTES BASE ────────────────────────────────
function PiggyIcon({ color, size=44 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <ellipse cx="24" cy="28" rx="14" ry="12" fill={color}/>
      <circle cx="24" cy="16" r="9" fill={color}/>
      <circle cx="21" cy="14" r="1.5" fill="white"/>
      <circle cx="27" cy="14" r="1.5" fill="white"/>
      <ellipse cx="24" cy="17.5" rx="3" ry="2" fill="white" opacity="0.4"/>
      <rect x="10" y="26" width="4" height="8" rx="2" fill={color}/>
      <rect x="34" y="26" width="4" height="8" rx="2" fill={color}/>
      <rect x="16" y="32" width="4" height="7" rx="2" fill={color}/>
      <rect x="28" y="32" width="4" height="7" rx="2" fill={color}/>
      <rect x="35" y="20" width="6" height="3" rx="1.5" fill={color}/>
      <rect x="22" y="7"  width="4" height="5" rx="2" fill={color}/>
    </svg>
  );
}

function SoftButton({ children, onClick, variant="green", disabled=false }) {
  const palette = {
    green:  { bg:"#d1f5e0", text:"#0f5132", hover:"#bcefcf" },
    blue:   { bg:"#dbeafe", text:"#1e40af", hover:"#c7dafd" },
    neutral:{ bg:"#f1f1f3", text:"#444",    hover:"#e8e8eb" },
    danger: { bg:"#fee2e2", text:"#991b1b", hover:"#fecaca" },
  };
  const p = palette[variant]||palette.green;
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width:"100%", padding:"14px 18px", borderRadius:18, border:"none",
      background:disabled?"#f0f0f0":p.bg, color:disabled?"#aaa":p.text,
      fontWeight:700, fontSize:14, cursor:disabled?"not-allowed":"pointer",
      fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:6,
    }}>
      {children}
    </button>
  );
}

function MoneyInput({ value, onChange, autoFocus=false }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:4, background:"white", borderRadius:18, padding:"16px 18px", border:"1.5px solid #ececef" }}>
      <span style={{ fontSize:22, color:"#888", fontWeight:600 }}>$</span>
      <input type="number" value={value} onChange={onChange} autoFocus={autoFocus} placeholder="0"
        style={{ flex:1, border:"none", outline:"none", fontSize:28, fontWeight:800, fontFamily:"inherit", color:"#1a1a1a", background:"transparent", minWidth:0, padding:0 }}/>
    </div>
  );
}

function SuccessStamp({ show, message }) {
  if (!show) return null;
  return (
    <div style={{
      position:"fixed", top:"40%", left:"50%", transform:"translate(-50%,-50%)",
      background:"white", padding:"20px 30px", borderRadius:24,
      boxShadow:"0 20px 50px rgba(0,0,0,0.18)", zIndex:200, textAlign:"center",
    }}>
      <div style={{ fontSize:44, marginBottom:6 }}>🎉</div>
      <div style={{ fontWeight:800, fontSize:16, color:"#0f5132" }}>{message}</div>
    </div>
  );
}

function Modal({ open, onClose, title, children, maxHeight=580 }) {
  if (!open) return null;
  return (
    <div style={{
      position:"fixed", inset:0, zIndex:50, background:"rgba(20,20,30,0.5)",
      backdropFilter:"blur(4px)", display:"flex", alignItems:"flex-end", justifyContent:"center",
    }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:"#fdfcfa", width:"100%", maxWidth:480,
        borderTopLeftRadius:28, borderTopRightRadius:28,
        padding:"10px 0 32px", maxHeight, overflowY:"auto",
        boxShadow:"0 -10px 40px rgba(0,0,0,0.15)",
      }}>
        <div style={{ width:38, height:4, background:"#d4d4d8", borderRadius:999, margin:"0 auto 14px" }}/>
        {title && (
          <div style={{ padding:"0 22px 14px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <h2 style={{ margin:0, fontSize:19, fontWeight:800, color:"#1a1a1a", letterSpacing:-0.3 }}>{title}</h2>
            <button onClick={onClose} style={{ width:30, height:30, borderRadius:"50%", border:"none", background:"#f1f1f3", color:"#666", cursor:"pointer", fontSize:16 }}>×</button>
          </div>
        )}
        <div style={{ padding:"0 22px" }}>{children}</div>
      </div>
    </div>
  );
}

function USDToggle({ mode, setMode, accent }) {
  return (
    <div style={{ display:"inline-flex", background:"rgba(255,255,255,0.25)", backdropFilter:"blur(10px)", borderRadius:999, padding:3, gap:2, border:"0.5px solid rgba(255,255,255,0.35)" }}>
      {[["ARS","$"],["USD","US$"]].map(([m,sym]) => (
        <button key={m} onClick={()=>setMode(m)} style={{
          padding:"5px 12px", borderRadius:999, border:"none",
          background:mode===m?"white":"transparent",
          color:mode===m?accent:"rgba(255,255,255,0.85)",
          fontWeight:700, fontSize:11, cursor:"pointer", fontFamily:"inherit",
        }}>{sym} {m}</button>
      ))}
    </div>
  );
}

function ProfileSelector({ profiles, activeId, onSelect, onAddNew, accent }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const active = profiles.find(p=>p.id===activeId)||profiles[0];

  useEffect(() => {
    const close = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div ref={ref} style={{ position:"relative" }}>
      <button onClick={()=>setOpen(o=>!o)} style={{
        display:"flex", alignItems:"center", gap:8,
        background:"rgba(255,255,255,0.25)", backdropFilter:"blur(12px)",
        border:"0.5px solid rgba(255,255,255,0.4)", borderRadius:999,
        padding:"5px 14px 5px 5px", cursor:"pointer", fontFamily:"inherit",
      }}>
        <span style={{ width:30, height:30, borderRadius:"50%", background:"white", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>{active.avatar}</span>
        <span style={{ color:"white", fontWeight:700, fontSize:13 }}>{active.apodo||active.nombre||"Mi perfil"}</span>
        <svg width="10" height="10" viewBox="0 0 10 10" style={{ transform:open?"rotate(180deg)":"none" }}>
          <path d="M2 4l3 3 3-3" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <div style={{
          position:"absolute", top:"calc(100% + 8px)", left:0, minWidth:220,
          background:"white", borderRadius:20, boxShadow:"0 10px 30px rgba(0,0,0,0.18)",
          padding:6, zIndex:100,
        }}>
          <div style={{ padding:"8px 12px 6px", fontSize:10, fontWeight:700, color:"#999", letterSpacing:0.6, textTransform:"uppercase" }}>Perfiles de la familia</div>
          {profiles.map(p => (
            <button key={p.id} onClick={()=>{ onSelect(p.id); setOpen(false); }} style={{
              width:"100%", display:"flex", alignItems:"center", gap:10,
              padding:"8px 10px", borderRadius:14, border:"none",
              background:p.id===activeId?"#f4f4f5":"transparent",
              cursor:"pointer", fontFamily:"inherit", textAlign:"left",
            }}>
              <span style={{ width:36, height:36, borderRadius:"50%", background:THEMES[p.theme]?.bg||"#f5f5f5", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, border:`2px solid ${p.id===activeId?accent:"transparent"}` }}>{p.avatar}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:700, color:"#222" }}>{p.apodo||p.nombre}</div>
                <div style={{ fontSize:11, color:"#999" }}>{p.edad} años · {fmtARS(Object.values(p.buckets).reduce((s,b)=>s+b.balance,0))}</div>
              </div>
              {p.id===activeId && <span style={{ color:accent, fontSize:14 }}>✓</span>}
            </button>
          ))}
          <div style={{ borderTop:"0.5px solid #f0f0f0", marginTop:4, paddingTop:4 }}>
            <button onClick={()=>{ onAddNew(); setOpen(false); }} style={{
              width:"100%", display:"flex", alignItems:"center", gap:10,
              padding:10, borderRadius:14, border:"none", background:"transparent",
              cursor:"pointer", fontFamily:"inherit", color:accent, fontWeight:600, fontSize:13,
            }}>
              <span style={{ width:36, height:36, borderRadius:"50%", background:"#f4f4f5", display:"flex", alignItems:"center", justifyContent:"center", color:accent, fontSize:20 }}>+</span>
              Agregar hijo/a
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MODALES ──────────────────────────────────────────────────
function ReceiveModal({ open, onClose, profile, mode, rate, dolarType, onConfirm, theme }) {
  const [amt, setAmt] = useState(profile?.weeklyIncome||2000);
  useEffect(() => { if (open) setAmt(profile?.weeklyIncome||2000); }, [open, profile]);
  if (!profile) return null;
  const a = parseFloat(amt)||0;
  return (
    <Modal open={open} onClose={onClose} title="¿Cuánto recibiste esta semana?">
      <MoneyInput value={amt} onChange={e=>setAmt(e.target.value)} autoFocus/>
      <div style={{ marginTop:10, padding:"10px 14px", background:"#f8faf6", borderRadius:14, border:"0.5px solid #e3eedd", display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:14 }}>
        <span style={{ color:"#5a6e4f" }}>📊 TC del día</span>
        <span style={{ fontWeight:700, color:"#1a1a1a" }}>{dolarType} ${rate} · ≈ {fmtUSD(toUSD(a,rate))}</span>
      </div>
      <p style={{ margin:"0 4px 8px", fontSize:11, fontWeight:700, color:"#888", letterSpacing:0.6, textTransform:"uppercase" }}>Se reparte así</p>
      <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:16 }}>
        {Object.entries(profile.buckets).map(([k,b]) => {
          const portion = (a*b.pct)/100;
          return (
            <div key={k} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"11px 14px", background:"white", borderRadius:14, border:"0.5px solid rgba(0,0,0,0.05)" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ width:28, height:28, borderRadius:9, background:`${b.color}20`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>{b.emoji}</span>
                <div>
                  <p style={{ margin:0, fontSize:12.5, fontWeight:600, color:"#1a1a1a" }}>{b.label}</p>
                  <p style={{ margin:0, fontSize:10.5, color:"#aaa" }}>{b.pct}%</p>
                </div>
              </div>
              <div style={{ textAlign:"right" }}>
                <p style={{ margin:0, fontSize:13, fontWeight:700, color:b.color }}>{mode==="USD"?fmtUSD(toUSD(portion,rate)):fmtARS(portion)}</p>
                <p style={{ margin:0, fontSize:10, color:"#bbb" }}>{mode==="USD"?fmtARS(portion):fmtUSD(toUSD(portion,rate))}</p>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display:"flex", gap:8 }}>
        <SoftButton variant="neutral" onClick={onClose}>Cancelar</SoftButton>
        <SoftButton variant="green" disabled={a<=0} onClick={()=>{ onConfirm(a); onClose(); }}>Distribuir {fmtARS(a)}</SoftButton>
      </div>
    </Modal>
  );
}

function SpendModal({ open, onClose, bucket, bucketKey, mode, rate, onConfirm, theme }) {
  const [amt, setAmt] = useState("");
  const [desc, setDesc] = useState("");
  useEffect(() => { if (open) { setAmt(""); setDesc(""); } }, [open]);
  if (!bucket) return null;
  const a = parseFloat(amt)||0;
  const exceeds = a > bucket.balance;
  return (
    <Modal open={open} onClose={onClose} title={`Gastar de ${bucket.label}`}>
      <div style={{ marginBottom:14, padding:"12px 14px", borderRadius:16, background:`${bucket.color}10`, border:`0.5px solid ${bucket.color}30`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontSize:12, color:"#666" }}>Tenés disponible</span>
        <span style={{ fontWeight:800, fontSize:16, color:bucket.color }}>{mode==="USD"?fmtUSD(toUSD(bucket.balance,rate)):fmtARS(bucket.balance)}</span>
      </div>
      <p style={{ margin:"0 4px 8px", fontSize:11, fontWeight:600, color:"#888" }}>¿Cuánto?</p>
      <MoneyInput value={amt} onChange={e=>setAmt(e.target.value)} autoFocus/>
      <p style={{ margin:"16px 4px 8px", fontSize:11, fontWeight:600, color:"#888" }}>¿En qué?</p>
      <input value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Snack, juguete, útiles..."
        style={{ width:"100%", padding:"14px 16px", borderRadius:16, border:"1.5px solid #ececef", fontSize:14, fontFamily:"inherit", boxSizing:"border-box", outline:"none", background:"white" }}/>
      {exceeds && <div style={{ marginTop:12, padding:"10px 14px", background:"#fef2f2", borderRadius:12, fontSize:12, color:"#991b1b", fontWeight:600 }}>⚠️ No tenés suficiente en esta alcancía</div>}
      <div style={{ display:"flex", gap:8, marginTop:18 }}>
        <SoftButton variant="neutral" onClick={onClose}>Cancelar</SoftButton>
        <SoftButton variant="blue" disabled={a<=0||exceeds||!desc.trim()} onClick={()=>{ onConfirm(bucketKey,a,desc); onClose(); }}>Confirmar gasto</SoftButton>
      </div>
    </Modal>
  );
}

function AddKidModal({ open, onClose, onAdd, theme }) {
  const [nombre, setNombre] = useState("");
  const [edad, setEdad] = useState("");
  const [avatar, setAvatar] = useState("🦊");
  const [income, setIncome] = useState(1500);
  const avatars = ["🦊","🐼","🦁","🐸","🐙","🦋","🦖","🐶","🐱","🦄","🐯","🐵"];
  useEffect(() => { if (open) { setNombre(""); setEdad(""); setAvatar("🦊"); setIncome(1500); } }, [open]);
  return (
    <Modal open={open} onClose={onClose} title="Agregar nuevo perfil" maxHeight={620}>
      <p style={{ margin:"0 4px 10px", fontSize:11, fontWeight:600, color:"#888" }}>Avatar</p>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(6, 1fr)", gap:6, marginBottom:18 }}>
        {avatars.map(a => (
          <button key={a} onClick={()=>setAvatar(a)} style={{
            aspectRatio:"1", borderRadius:14, border:avatar===a?`2px solid ${theme.accent}`:"1.5px solid #ececef",
            background:avatar===a?theme.bg:"white", cursor:"pointer", fontSize:22,
            display:"flex", alignItems:"center", justifyContent:"center",
          }}>{a}</button>
        ))}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:8, marginBottom:12 }}>
        <div>
          <p style={{ margin:"0 4px 6px", fontSize:11, fontWeight:600, color:"#888" }}>Nombre</p>
          <input value={nombre} onChange={e=>setNombre(e.target.value)} placeholder="Lucía"
            style={{ width:"100%", padding:"12px 14px", borderRadius:14, border:"1.5px solid #ececef", fontSize:14, fontFamily:"inherit", boxSizing:"border-box", outline:"none" }}/>
        </div>
        <div>
          <p style={{ margin:"0 4px 6px", fontSize:11, fontWeight:600, color:"#888" }}>Edad</p>
          <input value={edad} onChange={e=>setEdad(e.target.value)} type="number" placeholder="8"
            style={{ width:"100%", padding:"12px 14px", borderRadius:14, border:"1.5px solid #ececef", fontSize:14, fontFamily:"inherit", boxSizing:"border-box", outline:"none" }}/>
        </div>
      </div>
      <div style={{ marginBottom:18 }}>
        <p style={{ margin:"0 4px 6px", fontSize:11, fontWeight:600, color:"#888" }}>Ingreso semanal sugerido</p>
        <MoneyInput value={income} onChange={e=>setIncome(e.target.value)}/>
      </div>
      <div style={{ display:"flex", gap:8 }}>
        <SoftButton variant="neutral" onClick={onClose}>Cancelar</SoftButton>
        <SoftButton variant="green" disabled={!nombre.trim()||!edad}
          onClick={()=>{ onAdd({nombre,edad,avatar,weeklyIncome:parseFloat(income)||1500}); onClose(); }}>
          Crear perfil
        </SoftButton>
      </div>
    </Modal>
  );
}

// ─── PANEL ADULTO ─────────────────────────────────────────────
function ParentPanel({ open, onClose, state, setState, profiles, activeId, onSelectProfile, theme, saving }) {
  const [tab, setTab] = useState("hijos");
  if (!open) return null;
  const active = profiles.find(p=>p.id===activeId)||profiles[0];
  const dolarType = state.dolarType||"blue";
  const rate = DOLAR_QUOTES[dolarType]?.venta||1160;

  const updActive = patch => {
    setState(s => ({ ...s, profiles: s.profiles.map(p => p.id===activeId?{...p,...patch}:p) }));
  };
  const updBucket = (key, patch) => {
    setState(s => ({ ...s, profiles: s.profiles.map(p => p.id!==activeId?p:{ ...p, buckets:{ ...p.buckets, [key]:{ ...p.buckets[key], ...patch } } }) }));
  };

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:60, background:"#fafaf9",
      display:"flex", flexDirection:"column", overflowY:"auto", fontFamily:"system-ui, sans-serif",
    }}>
      <div style={{ background:`linear-gradient(155deg, ${theme.primary}, ${theme.accent})`, padding:"16px 20px 22px", color:"white", flexShrink:0 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <p style={{ margin:0, fontSize:11, opacity:0.85, fontWeight:600, textTransform:"uppercase", letterSpacing:0.4 }}>Panel adulto {saving?"· 💾":""}</p>
            <h2 style={{ margin:"4px 0 0", fontSize:22, fontWeight:800, letterSpacing:-0.4 }}>Configuración familia</h2>
          </div>
          <button onClick={onClose} style={{ width:34, height:34, borderRadius:"50%", border:"none", background:"rgba(255,255,255,0.22)", color:"white", cursor:"pointer", fontSize:18 }}>×</button>
        </div>
      </div>

      <div style={{ display:"flex", gap:4, margin:"12px 14px", padding:4, background:"white", borderRadius:14, boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}>
        {[["hijos","👨‍👧‍👦 Hijos"],["dolar","💵 Dólar"],["interes","📈 Interés"],["tema","🎨 Tema"]].map(([t,l]) => (
          <button key={t} onClick={()=>setTab(t)} style={{
            flex:1, padding:"9px 4px", borderRadius:10, border:"none",
            background:tab===t?theme.bg:"transparent", color:tab===t?theme.accent:"#888",
            fontWeight:tab===t?700:500, cursor:"pointer", fontSize:11, fontFamily:"inherit",
          }}>{l}</button>
        ))}
      </div>

      <div style={{ padding:"0 14px 30px", flex:1 }}>

        {tab==="hijos" && (
          <div>
            <p style={{ margin:"8px 4px", fontSize:11, fontWeight:700, color:"#888", letterSpacing:0.5, textTransform:"uppercase" }}>Perfiles activos ({profiles.length})</p>
            {profiles.map(p => {
              const t = THEMES[p.theme]||THEMES.taylor;
              const total = Object.values(p.buckets).reduce((s,b)=>s+b.balance,0);
              return (
                <div key={p.id} onClick={()=>onSelectProfile(p.id)} style={{
                  background:"white", borderRadius:20, padding:14, marginBottom:8,
                  border:p.id===activeId?`2px solid ${theme.accent}`:"0.5px solid rgba(0,0,0,0.05)",
                  cursor:"pointer", display:"flex", alignItems:"center", gap:12,
                }}>
                  <div style={{ width:50, height:50, borderRadius:"50%", background:t.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:26 }}>{p.avatar}</div>
                  <div style={{ flex:1 }}>
                    <p style={{ margin:0, fontSize:15, fontWeight:800, color:"#1a1a1a" }}>{p.nombre} {p.apodo&&<span style={{ color:"#999", fontWeight:600 }}>· "{p.apodo}"</span>}</p>
                    <p style={{ margin:"2px 0 0", fontSize:11, color:"#888" }}>{p.edad} años · PIN {p.pin} · {t.name}</p>
                    <p style={{ margin:"4px 0 0", fontSize:13, fontWeight:700, color:theme.accent }}>{fmtARS(total)} <span style={{ color:"#aaa", fontWeight:500, fontSize:11 }}>≈ {fmtUSD(toUSD(total,rate))}</span></p>
                  </div>
                </div>
              );
            })}

            {/* Editar perfil activo */}
            <div style={{ background:"white", borderRadius:20, padding:16, marginTop:12, border:"0.5px solid #eee" }}>
              <p style={{ margin:"0 0 12px", fontWeight:700, fontSize:14, color:theme.accent }}>✏️ Editar perfil de {active.nombre||"este niño/a"}</p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
                <div>
                  <p style={{ margin:"0 0 4px", fontSize:11, color:"#888", fontWeight:600 }}>Nombre</p>
                  <input value={active.nombre} onChange={e=>updActive({nombre:e.target.value})}
                    style={{ width:"100%", padding:"10px 12px", borderRadius:10, border:"1.5px solid #ddd", fontSize:14, boxSizing:"border-box", fontFamily:"inherit" }}/>
                </div>
                <div>
                  <p style={{ margin:"0 0 4px", fontSize:11, color:"#888", fontWeight:600 }}>Apodo</p>
                  <input value={active.apodo} onChange={e=>updActive({apodo:e.target.value})}
                    style={{ width:"100%", padding:"10px 12px", borderRadius:10, border:"1.5px solid #ddd", fontSize:14, boxSizing:"border-box", fontFamily:"inherit" }}/>
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
                <div>
                  <p style={{ margin:"0 0 4px", fontSize:11, color:"#888", fontWeight:600 }}>Edad</p>
                  <input type="number" value={active.edad} onChange={e=>updActive({edad:e.target.value})}
                    style={{ width:"100%", padding:"10px 12px", borderRadius:10, border:"1.5px solid #ddd", fontSize:14, boxSizing:"border-box", fontFamily:"inherit" }}/>
                </div>
                <div>
                  <p style={{ margin:"0 0 4px", fontSize:11, color:"#888", fontWeight:600 }}>Ciudad</p>
                  <input value={active.ciudad||""} onChange={e=>updActive({ciudad:e.target.value})}
                    style={{ width:"100%", padding:"10px 12px", borderRadius:10, border:"1.5px solid #ddd", fontSize:14, boxSizing:"border-box", fontFamily:"inherit" }}/>
                </div>
              </div>
              <div style={{ marginBottom:8 }}>
                <p style={{ margin:"0 0 4px", fontSize:11, color:"#888", fontWeight:600 }}>País</p>
                <select value={active.pais||"AR"} onChange={e=>updActive({pais:e.target.value})}
                  style={{ width:"100%", padding:"10px 12px", borderRadius:10, border:"1.5px solid #ddd", fontSize:14, background:"white", fontFamily:"inherit" }}>
                  {Object.entries(BCRA_RATES).map(([k,v])=><option key={k} value={k}>{v.label.split("(")[0].trim()}</option>)}
                </select>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                <div>
                  <p style={{ margin:"0 0 4px", fontSize:11, color:"#888", fontWeight:600 }}>PIN (4 dígitos)</p>
                  <input type="password" value={active.pin} onChange={e=>updActive({pin:e.target.value.slice(0,4)})}
                    style={{ width:"100%", padding:"10px 12px", borderRadius:10, border:"1.5px solid #ddd", fontSize:14, boxSizing:"border-box", fontFamily:"inherit" }}/>
                </div>
                <div>
                  <p style={{ margin:"0 0 4px", fontSize:11, color:"#888", fontWeight:600 }}>Ingreso semanal</p>
                  <input type="number" value={active.weeklyIncome} onChange={e=>updActive({weeklyIncome:parseFloat(e.target.value)||0})}
                    style={{ width:"100%", padding:"10px 12px", borderRadius:10, border:"1.5px solid #ddd", fontSize:14, boxSizing:"border-box", fontFamily:"inherit" }}/>
                </div>
              </div>
              {/* Porcentajes */}
              <p style={{ margin:"14px 0 8px", fontWeight:700, fontSize:12, color:"#888", textTransform:"uppercase", letterSpacing:0.5 }}>Porcentajes de alcancías</p>
              {Object.entries(active.buckets).map(([key,b]) => (
                <div key={key} style={{ marginBottom:10 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                    <span style={{ fontSize:13, fontWeight:500 }}>{b.emoji} {b.label}</span>
                    <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                      <input type="number" min="0" max="100" value={b.pct}
                        onChange={e=>updBucket(key,{pct:parseInt(e.target.value)||0})}
                        style={{ width:50, padding:"4px 8px", borderRadius:8, border:`1.5px solid ${b.color}`, fontSize:13, fontWeight:700, textAlign:"center", color:b.color }}/>
                      <span style={{ fontSize:13, color:b.color, fontWeight:600 }}>%</span>
                    </div>
                  </div>
                  {key==="meta" && <input value={b.goalName} onChange={e=>updBucket("meta",{goalName:e.target.value})} placeholder="Nombre de la meta" style={{ width:"100%", padding:"8px 10px", borderRadius:8, border:"1.5px solid #eee", fontSize:12, fontFamily:"inherit", boxSizing:"border-box", marginTop:2 }}/>}
                  {key==="dar" && <input value={b.cause} onChange={e=>updBucket("dar",{cause:e.target.value})} placeholder="Causa" style={{ width:"100%", padding:"8px 10px", borderRadius:8, border:"1.5px solid #eee", fontSize:12, fontFamily:"inherit", boxSizing:"border-box", marginTop:2 }}/>}
                </div>
              ))}
              <div style={{ padding:"8px 12px", borderRadius:10, background: Object.values(active.buckets).reduce((s,b)=>s+b.pct,0)===100?"#f0fdf4":"#fef2f2", border:`1px solid ${Object.values(active.buckets).reduce((s,b)=>s+b.pct,0)===100?"#86efac":"#fca5a5"}` }}>
                <span style={{ fontWeight:700, fontSize:13, color: Object.values(active.buckets).reduce((s,b)=>s+b.pct,0)===100?"#166534":"#991b1b" }}>
                  Total: {Object.values(active.buckets).reduce((s,b)=>s+b.pct,0)}% {Object.values(active.buckets).reduce((s,b)=>s+b.pct,0)===100?"✅":"— debe sumar 100%"}
                </span>
              </div>
            </div>
          </div>
        )}

        {tab==="dolar" && (
          <div style={{ background:"white", borderRadius:22, padding:18, border:"0.5px solid rgba(0,0,0,0.05)" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:4 }}>
              <h3 style={{ margin:0, fontSize:15, fontWeight:800, color:"#1a1a1a" }}>Cotización del dólar</h3>
              <span style={{ fontSize:10, fontWeight:700, color:"#0f5132", background:"#d1f5e0", padding:"3px 8px", borderRadius:999 }}>● referencia</span>
            </div>
            <p style={{ margin:"0 0 14px", fontSize:12, color:"#888" }}>Seleccioná el tipo de cambio para mostrar en ARS/USD</p>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {Object.entries(DOLAR_QUOTES).map(([k,q]) => (
                <button key={k} onClick={()=>setState(s=>({...s,dolarType:k}))} style={{
                  display:"flex", alignItems:"center", justifyContent:"space-between",
                  padding:"14px 16px", borderRadius:16,
                  border:dolarType===k?`2px solid ${theme.accent}`:"1.5px solid #ececef",
                  background:dolarType===k?theme.bg:"white",
                  cursor:"pointer", fontFamily:"inherit", textAlign:"left",
                }}>
                  <div>
                    <p style={{ margin:0, fontSize:14, fontWeight:700, color:"#1a1a1a" }}>{q.label}</p>
                    <p style={{ margin:"2px 0 0", fontSize:11, color:"#aaa" }}>{q.source}</p>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <p style={{ margin:0, fontSize:16, fontWeight:800, color:theme.accent }}>${q.venta}</p>
                    <p style={{ margin:0, fontSize:10, color:"#aaa" }}>compra ${q.compra}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {tab==="interes" && (
          <div style={{ background:"white", borderRadius:22, padding:18, border:"0.5px solid rgba(0,0,0,0.05)" }}>
            <h3 style={{ margin:"0 0 4px", fontSize:15, fontWeight:800, color:"#1a1a1a" }}>Tasa de interés</h3>
            <p style={{ margin:"0 0 14px", fontSize:12, color:"#888" }}>Se aplica al Sueño Grande para enseñar interés compuesto</p>
            <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:14 }}>
              {[["bcra","📊 Tasa oficial del banco central"],["custom","✏️ Tasa personalizada"]].map(([v,l]) => (
                <button key={v} onClick={()=>setState(s=>({...s,rateMode:v}))} style={{
                  padding:"12px 14px", borderRadius:12, border:`2px solid ${state.rateMode===v?theme.accent:"#e5e5e5"}`,
                  background:state.rateMode===v?theme.bg:"white", color:state.rateMode===v?theme.accent:"#666",
                  fontWeight:state.rateMode===v?700:400, cursor:"pointer", textAlign:"left", fontSize:14, fontFamily:"inherit",
                }}>{l}</button>
              ))}
            </div>
            {state.rateMode==="bcra" ? (
              <div style={{ padding:14, background:"#f0fdf4", borderRadius:14, border:"0.5px solid #86efac" }}>
                <p style={{ margin:"0 0 4px", fontSize:13, color:"#166534" }}>{BCRA_RATES[active.pais||"AR"]?.label}</p>
                <p style={{ margin:0, fontSize:22, fontWeight:800, color:"#166534" }}>{BCRA_RATES[active.pais||"AR"]?.rate}% anual</p>
              </div>
            ) : (
              <div style={{ padding:14, background:theme.bg, borderRadius:12, border:`1px solid ${theme.secondary}` }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <input type="number" min="0" max="200" step="0.5" value={state.customRate}
                    onChange={e=>setState(s=>({...s,customRate:parseFloat(e.target.value)||0}))}
                    style={{ width:80, padding:10, borderRadius:8, border:`2px solid ${theme.accent}`, fontSize:20, fontWeight:800, textAlign:"center", color:theme.accent }}/>
                  <span style={{ fontSize:18, fontWeight:700, color:theme.accent }}>% anual</span>
                </div>
              </div>
            )}
          </div>
        )}

        {tab==="tema" && (
          <div style={{ background:"white", borderRadius:22, padding:18, border:"0.5px solid rgba(0,0,0,0.05)" }}>
            <h3 style={{ margin:"0 0 4px", fontSize:15, fontWeight:800, color:"#1a1a1a" }}>Tema de {active.nombre||"este niño/a"}</h3>
            <p style={{ margin:"0 0 14px", fontSize:12, color:"#888" }}>Cada niño/a tiene su propio tema visual</p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              {Object.entries(THEMES).map(([k,t]) => (
                <button key={k} onClick={()=>setState(s=>({...s,profiles:s.profiles.map(p=>p.id===activeId?{...p,theme:k}:p)}))} style={{
                  padding:"14px 10px", borderRadius:16,
                  border:active.theme===k?`2px solid ${t.accent}`:"1.5px solid #ececef",
                  background:active.theme===k?t.bg:"white", cursor:"pointer", textAlign:"center", fontFamily:"inherit",
                }}>
                  <div style={{ fontSize:26, marginBottom:4 }}>{t.emoji}</div>
                  <p style={{ margin:0, fontSize:13, fontWeight:active.theme===k?700:500, color:active.theme===k?t.accent:"#666" }}>{t.name}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        <button onClick={onClose} style={{ width:"100%", marginTop:16, background:theme.accent, color:"white", border:"none", borderRadius:12, padding:14, fontSize:15, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
          Ir a la alcancía de {active.apodo||active.nombre||"tu hijo/a"} →
        </button>
      </div>
    </div>
  );
}

// ─── PANTALLA PRINCIPAL DEL NIÑO/A ────────────────────────────
function KidHome({ profile, mode, setMode, rate, dolarType, allProfiles, switchProfile, openModal, openParent, theme, tab, setTab }) {
  const total = Object.values(profile.buckets).reduce((s,b)=>s+b.balance,0);
  const metaPct = Math.min(100, Math.round((profile.buckets.meta.balance/(profile.buckets.meta.goalAmount||1))*100));

  return (
    <div style={{ minHeight:"100%", background:theme.bg, fontFamily:"system-ui, sans-serif", paddingBottom:30 }}>
      {/* HEADER */}
      <div style={{ background:`linear-gradient(155deg, ${theme.primary} 0%, ${theme.accent} 120%)`, padding:"14px 18px 22px", color:"white" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <ProfileSelector profiles={allProfiles} activeId={profile.id} onSelect={switchProfile} onAddNew={()=>openModal("addKid")} accent={theme.accent}/>
          <button onClick={openParent} style={{ width:34, height:34, borderRadius:"50%", border:"none", background:"rgba(255,255,255,0.22)", backdropFilter:"blur(10px)", color:"white", cursor:"pointer", fontSize:14 }}>👤</button>
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", gap:10 }}>
          <div>
            <p style={{ margin:0, fontSize:12, opacity:0.85, fontWeight:500 }}>Hola {profile.apodo||profile.nombre||"Amigo/a"} {theme.emoji}</p>
            <p style={{ margin:"3px 0 0", fontSize:32, fontWeight:800, letterSpacing:-0.8, lineHeight:1 }}>{mode==="USD"?fmtUSD(toUSD(total,rate)):fmtARS(total)}</p>
            <p style={{ margin:"4px 0 0", fontSize:11, opacity:0.78 }}>{mode==="USD"?`≈ ${fmtARS(total)}`:`≈ ${fmtUSD(toUSD(total,rate))}`} · TC {dolarType} ${rate}</p>
          </div>
          <USDToggle mode={mode} setMode={setMode} accent={theme.accent}/>
        </div>
        {profile.streak>0 && (
          <div style={{ marginTop:12, background:"rgba(255,255,255,0.22)", backdropFilter:"blur(10px)", borderRadius:999, padding:"5px 12px", display:"inline-flex", alignItems:"center", gap:6, fontSize:11.5, fontWeight:600 }}>
            🔥 {profile.streak} semana{profile.streak!==1?"s":""} ahorrando seguido
          </div>
        )}
      </div>

      {/* TABS */}
      <div style={{ display:"flex", gap:3, margin:"-12px 14px 0", background:"white", borderRadius:14, padding:4, boxShadow:"0 4px 14px rgba(0,0,0,0.06)", position:"relative", zIndex:2 }}>
        {[["home","🏠 Inicio"],["logros","🏆 Logros"],["historial","📋 Historial"]].map(([t,l]) => (
          <button key={t} onClick={()=>setTab(t)} style={{
            flex:1, padding:"9px 4px", borderRadius:10, border:"none",
            background:tab===t?theme.bg:"transparent", color:tab===t?theme.accent:"#888",
            fontWeight:tab===t?700:500, cursor:"pointer", fontSize:11.5, fontFamily:"inherit",
          }}>{l}</button>
        ))}
      </div>

      {tab==="home" && (
        <div style={{ padding:"16px 14px 80px" }}>
          <SoftButton variant="green" onClick={()=>openModal("receive")}>
            <span style={{ fontSize:16 }}>＋</span> Recibí mi plata esta semana
          </SoftButton>

          {/* Card Meta destacada */}
          <div style={{ marginTop:16, background:"white", borderRadius:24, padding:18, boxShadow:"0 1px 3px rgba(0,0,0,0.04)", border:"0.5px solid rgba(0,0,0,0.05)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
              <div>
                <p style={{ margin:0, fontSize:11, fontWeight:700, color:"#a78bfa", letterSpacing:0.6, textTransform:"uppercase" }}>🎯 Mi Meta</p>
                <p style={{ margin:"3px 0 0", fontSize:16, fontWeight:800, color:"#1a1a1a" }}>{profile.buckets.meta.goalName}</p>
              </div>
              <div style={{ textAlign:"right" }}>
                <p style={{ margin:0, fontWeight:800, fontSize:18, color:"#a78bfa" }}>{mode==="USD"?fmtUSD(toUSD(profile.buckets.meta.balance,rate)):fmtARS(profile.buckets.meta.balance)}</p>
                <p style={{ margin:0, fontSize:11, color:"#bbb" }}>{mode==="USD"?fmtARS(profile.buckets.meta.balance):fmtUSD(toUSD(profile.buckets.meta.balance,rate))}</p>
              </div>
            </div>
            <div style={{ background:"#f1f1f3", borderRadius:999, height:10, overflow:"hidden", marginBottom:6 }}>
              <div style={{ width:`${metaPct}%`, height:"100%", background:"linear-gradient(90deg, #a78bfa, #c084fc)", borderRadius:999, transition:"width 0.6s" }}/>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"#888" }}>
              <span style={{ fontWeight:600 }}>{metaPct}% completo</span>
              <span>Faltan {mode==="USD"?fmtUSD(toUSD(profile.buckets.meta.goalAmount-profile.buckets.meta.balance,rate)):fmtARS(profile.buckets.meta.goalAmount-profile.buckets.meta.balance)}</span>
            </div>
          </div>

          {/* Alcancías */}
          <p style={{ margin:"20px 4px 8px", fontSize:11, fontWeight:700, color:"#888", letterSpacing:0.6, textTransform:"uppercase" }}>Mis alcancías</p>
          {Object.entries(profile.buckets).map(([key,b]) => (
            <div key={key} style={{ background:"white", borderRadius:22, padding:14, marginBottom:10, border:"0.5px solid rgba(0,0,0,0.05)", boxShadow:"0 1px 2px rgba(0,0,0,0.03)", display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ width:52, height:52, borderRadius:16, background:`${b.color}18`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <PiggyIcon color={b.color} size={36}/>
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ margin:0, fontWeight:700, fontSize:13.5, color:"#1a1a1a" }}>{b.emoji} {b.label}</p>
                <p style={{ margin:"2px 0 4px", fontSize:11, color:"#999" }}>
                  {b.pct}% · {key==="sueno"?"+5% anual 📈":key==="dar"?b.cause:key==="meta"?`Meta: ${b.goalName}`:"Para gastar"}
                </p>
                <p style={{ margin:0, fontWeight:800, fontSize:16, color:b.color, lineHeight:1.1 }}>
                  {mode==="USD"?fmtUSD(toUSD(b.balance,rate)):fmtARS(b.balance)}
                  <span style={{ fontSize:10.5, color:"#bbb", fontWeight:500, marginLeft:6 }}>{mode==="USD"?`≈ ${fmtARS(b.balance)}`:`≈ ${fmtUSD(toUSD(b.balance,rate))}`}</span>
                </p>
              </div>
              <button onClick={()=>openModal("spend",key)} style={{ width:32, height:32, borderRadius:12, border:"none", background:"#f4f4f5", color:"#666", cursor:"pointer", fontSize:16, fontWeight:600, flexShrink:0 }}>−</button>
            </div>
          ))}
        </div>
      )}

      {tab==="logros" && (
        <div style={{ padding:"16px 14px 80px" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {[
              { icon:"🔥", label:"Primera semana",   desc:"Distribuiste tu plata",     done:profile.streak>=1 },
              { icon:"💎", label:"Sueño en marcha",  desc:"Guardaste en Sueño Grande", done:profile.buckets.sueno.balance>0 },
              { icon:"🤝", label:"Corazón generoso", desc:"Tenés plata para donar",    done:profile.buckets.dar.balance>0 },
              { icon:"🌟", label:"Super ahorrador/a",desc:"3 semanas seguidas",        done:profile.streak>=3 },
              { icon:"🎯", label:"Mitad de meta",    desc:"50% de tu objetivo",        done:metaPct>=50 },
              { icon:"🏆", label:"¡Meta cumplida!",  desc:"Alcanzaste el 100%",        done:metaPct>=100 },
              { icon:"💰", label:"Gran tesoro",      desc:"+ de 10.000 guardados",     done:Object.values(profile.buckets).reduce((s,b)=>s+b.balance,0)>=10000 },
              { icon:"🌈", label:"5 semanas!",       desc:"Racha de 5 semanas",        done:profile.streak>=5 },
            ].map((b,i) => (
              <div key={i} style={{ background:"white", borderRadius:20, padding:14, border:"0.5px solid rgba(0,0,0,0.05)", opacity:b.done?1:0.45 }}>
                <div style={{ fontSize:28, marginBottom:4, filter:b.done?"none":"grayscale(0.6)" }}>{b.icon}</div>
                <p style={{ margin:"0 0 2px", fontWeight:700, fontSize:12, color:b.done?"#1a1a1a":"#888" }}>{b.label}</p>
                <p style={{ margin:0, fontSize:10.5, color:"#aaa", lineHeight:1.3 }}>{b.desc}</p>
                {b.done && <span style={{ display:"inline-block", marginTop:6, fontSize:9.5, fontWeight:700, background:theme.bg, color:theme.accent, padding:"2px 8px", borderRadius:999 }}>✓ Desbloqueado</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab==="historial" && (
        <div style={{ padding:"16px 14px 80px" }}>
          {Object.entries(profile.buckets).map(([key,b]) => b.history.length>0 && (
            <div key={key} style={{ marginBottom:18 }}>
              <p style={{ margin:"0 4px 8px", fontSize:11, fontWeight:700, color:"#888", letterSpacing:0.5, textTransform:"uppercase" }}>{b.emoji} {b.label}</p>
              <div style={{ background:"white", borderRadius:18, overflow:"hidden", border:"0.5px solid rgba(0,0,0,0.05)" }}>
                {b.history.map((h,i) => (
                  <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 14px", borderBottom:i<b.history.length-1?"0.5px solid #f1f1f3":"none" }}>
                    <div style={{ flex:1 }}>
                      <p style={{ margin:0, fontSize:13, fontWeight:600, color:"#1a1a1a" }}>{h.desc}</p>
                      <p style={{ margin:"2px 0 0", fontSize:11, color:"#aaa" }}>{h.date}{h.rate?` · TC $${h.rate}`:""}</p>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <p style={{ margin:0, fontWeight:800, fontSize:14, color:h.amt>0?"#0f5132":"#991b1b" }}>
                        {h.amt>0?"+":""}{mode==="USD"?fmtUSD(toUSD(h.amt,h.rate||rate)):fmtARS(h.amt)}
                      </p>
                      <p style={{ margin:"1px 0 0", fontSize:10, color:"#bbb" }}>
                        {mode==="USD"?fmtARS(h.amt):fmtUSD(toUSD(h.amt,h.rate||rate))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {Object.values(profile.buckets).every(b=>b.history.length===0) && (
            <p style={{ textAlign:"center", color:"#bbb", marginTop:60, fontSize:14 }}>Todavía no hay movimientos.</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────
function LoginScreen({ theme, displayName, onPin, pinInput, pinError, onParent, isParent, parentPass, setParentPass, onParentLogin, saving }) {
  return (
    <div style={{ minHeight:"100vh", background:theme.bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"2rem", fontFamily:"system-ui, sans-serif" }}>
      <div style={{ fontSize:52, marginBottom:6 }}>{theme.emoji}</div>
      <h1 style={{ fontSize:26, fontWeight:800, color:theme.accent, margin:"0 0 2px" }}>Mi Alcancía</h1>
      <p style={{ color:"#999", fontSize:13, margin:"0 0 28px" }}>{displayName?`Hola ${displayName}!`:"Tu app de finanzas"} — Ingresá tu PIN</p>
      {saving && <p style={{ fontSize:11, color:"#bbb", marginBottom:8 }}>💾 Guardando...</p>}
      {!isParent ? (
        <>
          <div style={{ display:"flex", gap:10, marginBottom:20 }}>
            {[0,1,2,3].map(i=><div key={i} style={{ width:16, height:16, borderRadius:"50%", background:i<pinInput.length?theme.primary:"#ddd", transition:"background 0.15s" }}/>)}
          </div>
          {pinError && <p style={{ color:"#ef4444", fontSize:13, marginBottom:10 }}>PIN incorrecto</p>}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 68px)", gap:8, marginBottom:18 }}>
            {[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((d,i)=>(
              <button key={i} onClick={()=>d==="⌫"?onPin("back"):d!==""?onPin(String(d)):null}
                style={{ height:58, borderRadius:12, border:`2px solid ${theme.secondary}`, background:"white", fontSize:d==="⌫"?18:20, fontWeight:600, color:theme.accent, cursor:d===""?"default":"pointer", opacity:d===""?0:1 }}>
                {d}
              </button>
            ))}
          </div>
          <button onClick={onParent} style={{ background:"none", border:"none", color:"#bbb", fontSize:12, cursor:"pointer", textDecoration:"underline" }}>Acceso adulto</button>
        </>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:10, width:230, alignItems:"center" }}>
          <p style={{ color:"#666", fontSize:14, margin:0 }}>Contraseña del adulto</p>
          <input type="password" value={parentPass} onChange={e=>setParentPass(e.target.value)} placeholder="papa1234"
            style={{ padding:"10px 14px", borderRadius:10, border:"1.5px solid #ddd", fontSize:15, width:"100%", boxSizing:"border-box" }}/>
          <button onClick={onParentLogin} style={{ background:theme.accent, color:"white", border:"none", borderRadius:10, padding:10, fontSize:14, fontWeight:700, cursor:"pointer", width:"100%" }}>Entrar</button>
          <button onClick={()=>onParent(true)} style={{ background:"none", border:"none", color:"#bbb", fontSize:12, cursor:"pointer" }}>Volver</button>
        </div>
      )}
    </div>
  );
}

// ─── APP PRINCIPAL ────────────────────────────────────────────
export default function App() {
  const [state, setState]       = useState(DEFAULT_STATE);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [screen, setScreen]     = useState("login");
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);
  const [isParent, setIsParent] = useState(false);
  const [parentPass, setParentPass] = useState("");
  const [tab, setTab]           = useState("home");
  const [mode, setMode]         = useState("ARS");
  const [modal, setModal]       = useState({ kind:null, data:null });
  const [stamp, setStamp]       = useState(false);

  const activeProfile = state.profiles.find(p=>p.id===state.activeId)||state.profiles[0];
  const theme = THEMES[activeProfile?.theme||"taylor"]||THEMES.taylor;
  const dolarType = state.dolarType||"blue";
  const rate = DOLAR_QUOTES[dolarType]?.venta||1160;
  const displayName = activeProfile?.apodo||activeProfile?.nombre||"";

  // Cargar de Supabase
  useEffect(() => {
    async function load() {
      try {
        const { data } = await supabase.from("alcancia_data").select("data").eq("app_id",APP_ID).single();
        if (data?.data) setState(prev=>deepMerge(prev,data.data));
      } catch(e) { console.log("Primera vez"); }
      setLoading(false);
    }
    load();
  }, []);

  // Guardar en Supabase
  const saveToSupabase = useCallback(async (newState) => {
    setSaving(true);
    try {
      await supabase.from("alcancia_data").upsert({ app_id:APP_ID, data:newState, updated_at:new Date().toISOString() },{ onConflict:"app_id" });
    } catch(e) { console.error(e); }
    setSaving(false);
  }, []);

  useEffect(() => {
    if (loading) return;
    const t = setTimeout(()=>saveToSupabase(state),800);
    return ()=>clearTimeout(t);
  }, [state, loading, saveToSupabase]);

  function handlePin(d) {
    if (d==="back") { setPinInput(p=>p.slice(0,-1)); return; }
    if (pinInput.length>=4) return;
    const next = pinInput+d;
    setPinInput(next);
    if (next.length===4) {
      setTimeout(()=>{
        if (next===activeProfile?.pin) { setScreen("home"); setPinInput(""); setPinError(false); setTab("home"); }
        else { setPinError(true); setPinInput(""); }
      },200);
    }
  }

  function handleParentLogin() {
    if (parentPass==="papa1234") { setScreen("parent"); setParentPass(""); setIsParent(false); }
    else alert("Contraseña incorrecta");
  }

  function distribute(amt) {
    const today = new Date().toLocaleDateString("es-AR",{day:"2-digit",month:"2-digit"});
    setState(s => ({
      ...s,
      profiles: s.profiles.map(p => {
        if (p.id!==s.activeId) return p;
        const buckets = { ...p.buckets };
        Object.keys(buckets).forEach(k => {
          const add = (amt*buckets[k].pct)/100;
          buckets[k] = { ...buckets[k], balance:buckets[k].balance+add, history:[{date:today,desc:"Ingreso",amt:add,rate},...buckets[k].history.slice(0,14)] };
        });
        return { ...p, buckets, streak:p.streak+1 };
      })
    }));
    setStamp(true); setTimeout(()=>setStamp(false),1800);
  }

  function spend(key, amt, desc) {
    const today = new Date().toLocaleDateString("es-AR",{day:"2-digit",month:"2-digit"});
    setState(s => ({
      ...s,
      profiles: s.profiles.map(p => {
        if (p.id!==s.activeId) return p;
        const b = p.buckets[key];
        return { ...p, buckets:{ ...p.buckets, [key]:{ ...b, balance:b.balance-amt, history:[{date:today,desc,amt:-amt,rate},...b.history.slice(0,14)] } } };
      })
    }));
  }

  function addKid(data) {
    const newId = "p"+(state.profiles.length+1);
    const newKid = {
      id:newId, nombre:data.nombre, apodo:data.nombre.split(" ")[0],
      edad:parseInt(data.edad), avatar:data.avatar, theme:"nature",
      pin:"0000", weeklyIncome:data.weeklyIncome, streak:0,
      buckets:{
        gastos:{ label:"Gastos del día", pct:25, emoji:"🍭", color:"#f472b6", balance:0, history:[] },
        meta:  { label:"Mi Meta",        pct:15, emoji:"🎮", color:"#a78bfa", balance:0, history:[], goalName:"Mi meta", goalAmount:5000 },
        sueno: { label:"Sueño Grande",   pct:50, emoji:"✈️", color:"#34d399", balance:0, history:[] },
        dar:   { label:"Dar",            pct:10, emoji:"🤝", color:"#fb923c", balance:0, history:[], cause:"Causa solidaria" },
      },
    };
    setState(s=>({ ...s, profiles:[...s.profiles,newKid], activeId:newId }));
  }

  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:theme.bg, fontFamily:"system-ui, sans-serif" }}>
      <div style={{ fontSize:48, marginBottom:12 }}>{theme.emoji}</div>
      <p style={{ color:theme.accent, fontWeight:600, fontSize:15 }}>Cargando Mi Alcancía...</p>
    </div>
  );

  if (screen==="login") return (
    <LoginScreen
      theme={theme} displayName={displayName}
      onPin={handlePin} pinInput={pinInput} pinError={pinError}
      onParent={back=>back?setIsParent(false):setIsParent(true)}
      isParent={isParent} parentPass={parentPass} setParentPass={setParentPass}
      onParentLogin={handleParentLogin} saving={saving}
    />
  );

  if (screen==="parent") return (
    <>
      <ParentPanel
        open={true} onClose={()=>setScreen("home")}
        state={state} setState={setState}
        profiles={state.profiles} activeId={state.activeId}
        onSelectProfile={id=>{ setState(s=>({...s,activeId:id})); setScreen("home"); setTab("home"); }}
        theme={theme} saving={saving}
      />
    </>
  );

  return (
    <div style={{ minHeight:"100vh", background:theme.bg, fontFamily:"system-ui, sans-serif" }}>
      <SuccessStamp show={stamp} message="¡Plata distribuida!"/>
      <KidHome
        profile={activeProfile}
        allProfiles={state.profiles}
        switchProfile={id=>{ setState(s=>({...s,activeId:id})); setTab("home"); }}
        mode={mode} setMode={setMode}
        rate={rate} dolarType={DOLAR_QUOTES[dolarType].label}
        theme={theme}
        openModal={(kind,data=null)=>setModal({kind,data})}
        openParent={()=>setScreen("parent")}
        tab={tab} setTab={setTab}
      />
      <ReceiveModal
        open={modal.kind==="receive"} onClose={()=>setModal({kind:null,data:null})}
        profile={activeProfile} mode={mode} rate={rate} dolarType={DOLAR_QUOTES[dolarType].label}
        onConfirm={distribute} theme={theme}
      />
      <SpendModal
        open={modal.kind==="spend"} onClose={()=>setModal({kind:null,data:null})}
        bucket={modal.data?activeProfile.buckets[modal.data]:null}
        bucketKey={modal.data} mode={mode} rate={rate} onConfirm={spend} theme={theme}
      />
      <AddKidModal
        open={modal.kind==="addKid"} onClose={()=>setModal({kind:null,data:null})}
        onAdd={addKid} theme={theme}
      />
    </div>
  );
}