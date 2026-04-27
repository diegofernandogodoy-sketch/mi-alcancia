import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://gbdeulaydljzbzfbxlfs.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdiZGV1bGF5ZGxqemJ6ZmJ4bGZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMzg0NTQsImV4cCI6MjA5MjgxNDQ1NH0.boj_PW7t2lvp61qdxy1u_sUGIJvBu9khzqkac-w5lWk";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const THEMES = {
  taylor: { name:"Taylor Swift", primary:"#c084fc", secondary:"#f0abfc", accent:"#7c3aed", bg:"#fdf4ff", emoji:"🌟" },
  anime:  { name:"Anime",        primary:"#f472b6", secondary:"#fda4af", accent:"#be185d", bg:"#fff1f2", emoji:"🌸" },
  nature: { name:"Naturaleza",   primary:"#34d399", secondary:"#6ee7b7", accent:"#065f46", bg:"#f0fdf4", emoji:"🌿" },
  kpop:   { name:"K-Pop",        primary:"#60a5fa", secondary:"#93c5fd", accent:"#1d4ed8", bg:"#eff6ff", emoji:"🎤" },
  dino:   { name:"Dinosaurios",  primary:"#fb923c", secondary:"#fcd34d", accent:"#92400e", bg:"#fffbeb", emoji:"🦕" },
  space:  { name:"Espacio",      primary:"#818cf8", secondary:"#c4b5fd", accent:"#3730a3", bg:"#eef2ff", emoji:"🚀" },
};

const BCRA_RATES = {
  AR:    { label:"Argentina (BCRA)",     rate:34    },
  MX:    { label:"México (Banxico)",     rate:11    },
  CL:    { label:"Chile (BCCh)",         rate:6.5   },
  CO:    { label:"Colombia (BanRep)",    rate:10.75 },
  PE:    { label:"Perú (BCRP)",          rate:5.75  },
  UY:    { label:"Uruguay (BCU)",        rate:9.25  },
  BR:    { label:"Brasil (BACEN)",       rate:13.75 },
  ES:    { label:"España (BCE)",         rate:4     },
  US:    { label:"Estados Unidos (Fed)", rate:5.25  },
  OTHER: { label:"Otro país",            rate:5     },
};

const CURRENCIES = {
  AR:"$", MX:"$", CL:"$", CO:"$", PE:"S/.", UY:"$U", BR:"R$", ES:"€", US:"USD", OTHER:"$"
};

const DEFAULT_STATE = {
  profile: { nombre:"", apellido:"", apodo:"", edad:"", ciudad:"", pais:"AR" },
  pin: "1234",
  theme: "taylor",
  weeklyIncome: 2000,
  rateMode: "bcra",
  customRate: 5,
  buckets: {
    gastos: { label:"Gastos del día", pct:25, emoji:"🍭", color:"#f472b6", balance:0, history:[] },
    meta:   { label:"Mi Meta",        pct:15, emoji:"🎮", color:"#a78bfa", balance:0, history:[], goalName:"Mi meta", goalAmount:5000 },
    sueno:  { label:"Sueño Grande",   pct:50, emoji:"✈️", color:"#34d399", balance:0, history:[] },
    dar:    { label:"Dar",            pct:10, emoji:"🤝", color:"#fb923c", balance:0, history:[], cause:"Causa solidaria" },
  },
  streak: 0,
  lastIncome: null,
};

const APP_ID = "mi-alcancia-default";
const fmt = (n, pais) => (CURRENCIES[pais] || "$") + Math.round(n).toLocaleString("es-AR");

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

function Inp({ value, onChange, placeholder, type="text", style={} }) {
  return (
    <input type={type} value={value} onChange={onChange} placeholder={placeholder}
      style={{ width:"100%", padding:"10px 12px", borderRadius:10, border:"1.5px solid #ddd",
               fontSize:14, boxSizing:"border-box", fontFamily:"sans-serif", ...style }}/>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom:12 }}>
      <p style={{ margin:"0 0 4px", fontSize:12, color:"#888", fontWeight:500 }}>{label}</p>
      {children}
    </div>
  );
}

function Loader({ theme }) {
  return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center",
                  justifyContent:"center", background: theme?.bg || "#fdf4ff", fontFamily:"sans-serif" }}>
      <div style={{ fontSize:48, marginBottom:12 }}>{theme?.emoji || "🐷"}</div>
      <p style={{ color: theme?.accent || "#7c3aed", fontWeight:600, fontSize:15 }}>Cargando Mi Alcancía...</p>
    </div>
  );
}

function deepMerge(target, source) {
  const out = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
      out[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      out[key] = source[key];
    }
  }
  return out;
}

export default function App() {
  const [state, setState]           = useState(DEFAULT_STATE);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [screen, setScreen]         = useState("login");
  const [pinInput, setPinInput]     = useState("");
  const [pinError, setPinError]     = useState(false);
  const [isParent, setIsParent]     = useState(false);
  const [parentPass, setParentPass] = useState("");
  const [tab, setTab]               = useState("home");
  const [parentTab, setParentTab]   = useState("perfil");
  const [activeBucket, setActiveBucket] = useState(null);
  const [spendAmt, setSpendAmt]     = useState("");
  const [spendDesc, setSpendDesc]   = useState("");
  const [showDist, setShowDist]     = useState(false);
  const [distAmt, setDistAmt]       = useState("");
  const [showOk, setShowOk]         = useState(false);

  const theme      = THEMES[state.theme] || THEMES.taylor;
  const pais       = state.profile.pais || "AR";
  const cur        = n => fmt(n, pais);
  const activeRate = state.rateMode === "bcra" ? (BCRA_RATES[pais]?.rate || 5) : state.customRate;
  const displayName = state.profile.apodo || state.profile.nombre || "Amigo/a";
  const totalPct   = Object.values(state.buckets).reduce((s,b) => s + (b.pct||0), 0);
  const total      = Object.values(state.buckets).reduce((s,b) => s + b.balance, 0);
  const metaPct    = Math.min(100, Math.round((state.buckets.meta.balance / (state.buckets.meta.goalAmount||1)) * 100));

  useEffect(() => {
    async function load() {
      try {
        const { data } = await supabase
          .from("alcancia_data").select("data").eq("app_id", APP_ID).single();
        if (data?.data) setState(prev => deepMerge(prev, data.data));
      } catch(e) { console.log("Primera vez"); }
      setLoading(false);
    }
    load();
  }, []);

  const saveToSupabase = useCallback(async (newState) => {
    setSaving(true);
    try {
      await supabase.from("alcancia_data")
        .upsert({ app_id: APP_ID, data: newState, updated_at: new Date().toISOString() },
                 { onConflict: "app_id" });
    } catch(e) { console.error(e); }
    setSaving(false);
  }, []);

  useEffect(() => {
    if (loading) return;
    const t = setTimeout(() => saveToSupabase(state), 800);
    return () => clearTimeout(t);
  }, [state, loading, saveToSupabase]);

  const upd = fn => setState(s => fn(s));
  const updProfile = (f,v) => upd(s => ({ ...s, profile: { ...s.profile, [f]:v } }));
  const updBucket  = (k,fn) => upd(s => ({ ...s, buckets: { ...s.buckets, [k]: fn(s.buckets[k]) } }));

  function handlePin(d) {
    if (pinInput.length >= 4) return;
    const next = pinInput + d;
    setPinInput(next);
    if (next.length === 4) {
      setTimeout(() => {
        if (next === state.pin) { setScreen("home"); setPinInput(""); setPinError(false); }
        else { setPinError(true); setPinInput(""); }
      }, 200);
    }
  }

  function handleParentLogin() {
    if (parentPass === "papa1234") { setParentMode(true); setScreen("parent"); setParentPass(""); setIsParent(false); }
    else alert("Contraseña incorrecta");
  }

  function distribute(amount) {
    const a = parseFloat(amount);
    if (!a || a <= 0 || totalPct !== 100) return;
    const now = new Date().toLocaleDateString("es-AR");
    upd(s => {
      const b = { ...s.buckets };
      Object.keys(b).forEach(k => {
        const add = (a * b[k].pct) / 100;
        b[k] = { ...b[k], balance: b[k].balance + add,
                 history: [{ date:now, desc:"Ingreso", amt:add }, ...b[k].history.slice(0,14)] };
      });
      return { ...s, buckets:b, streak: s.streak+1, lastIncome:now };
    });
    setShowDist(false); setDistAmt("");
    setShowOk(true); setTimeout(() => setShowOk(false), 2000);
  }

  function spend(key, amt, desc) {
    const a = parseFloat(amt);
    if (!a || a <= 0 || a > state.buckets[key].balance) return;
    const now = new Date().toLocaleDateString("es-AR");
    updBucket(key, b => ({ ...b, balance: b.balance - a,
      history: [{ date:now, desc: desc||"Gasto", amt:-a }, ...b.history.slice(0,14)] }));
    setActiveBucket(null); setSpendAmt(""); setSpendDesc("");
  }

  if (loading) return <Loader theme={theme}/>;

  // ── LOGIN ───────────────────────────────────────────────────
  if (screen === "login") return (
    <div style={{ minHeight:"100vh", background:theme.bg, display:"flex", flexDirection:"column",
                  alignItems:"center", justifyContent:"center", padding:"2rem", fontFamily:"sans-serif" }}>
      <div style={{ fontSize:52, marginBottom:6 }}>{theme.emoji}</div>
      <h1 style={{ fontSize:26, fontWeight:800, color:theme.accent, margin:"0 0 2px" }}>Mi Alcancía</h1>
      <p style={{ color:"#999", fontSize:13, margin:"0 0 28px" }}>
        {state.profile.nombre ? `Hola ${displayName}!` : "Tu app de finanzas"} — Ingresá tu PIN
      </p>
      {showOk && <p style={{ color:"#22c55e", fontWeight:700, fontSize:14, marginBottom:8 }}>🎉 ¡Plata distribuida!</p>}
      {!isParent ? (
        <>
          <div style={{ display:"flex", gap:10, marginBottom:20 }}>
            {[0,1,2,3].map(i => (
              <div key={i} style={{ width:16, height:16, borderRadius:"50%",
                background: i < pinInput.length ? theme.primary : "#ddd", transition:"background 0.15s" }}/>
            ))}
          </div>
          {pinError && <p style={{ color:"#ef4444", fontSize:13, marginBottom:10 }}>PIN incorrecto</p>}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 68px)", gap:8, marginBottom:18 }}>
            {[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((d,i) => (
              <button key={i}
                onClick={() => d==="⌫" ? setPinInput(p=>p.slice(0,-1)) : d!=="" ? handlePin(String(d)) : null}
                style={{ height:58, borderRadius:12, border:`2px solid ${theme.secondary}`,
                         background:"white", fontSize: d==="⌫"?18:20, fontWeight:600,
                         color:theme.accent, cursor: d===""?"default":"pointer", opacity: d===""?0:1 }}>
                {d}
              </button>
            ))}
          </div>
          <button onClick={() => setIsParent(true)}
            style={{ background:"none", border:"none", color:"#bbb", fontSize:12, cursor:"pointer", textDecoration:"underline" }}>
            Acceso adulto
          </button>
        </>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:10, width:230, alignItems:"center" }}>
          <p style={{ color:"#666", fontSize:14, margin:0 }}>Contraseña del adulto</p>
          <Inp type="password" value={parentPass} onChange={e=>setParentPass(e.target.value)} placeholder="Contraseña"/>
          <button onClick={handleParentLogin}
            style={{ background:theme.accent, color:"white", border:"none", borderRadius:10, padding:10,
                     fontSize:14, fontWeight:700, cursor:"pointer", width:"100%" }}>
            Entrar
          </button>
          <button onClick={() => setIsParent(false)}
            style={{ background:"none", border:"none", color:"#bbb", fontSize:12, cursor:"pointer" }}>
            Volver
          </button>
        </div>
      )}
    </div>
  );

  // ── PANEL ADULTO ────────────────────────────────────────────
  if (screen === "parent") return (
    <div style={{ minHeight:"100vh", fontFamily:"sans-serif", background:theme.bg }}>
      <div style={{ background:theme.accent, padding:"16px 20px", color:"white",
                    display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <p style={{ margin:0, fontSize:12, opacity:0.8 }}>Panel del adulto {saving?"· 💾":""}</p>
          <h2 style={{ margin:"2px 0 0", fontSize:20, fontWeight:700 }}>Configuración</h2>
        </div>
        <button onClick={() => { setScreen("login"); setParentMode(false); }}
          style={{ background:"rgba(255,255,255,0.2)", border:"none", borderRadius:10,
                   padding:"8px 12px", color:"white", cursor:"pointer", fontSize:14 }}>
          Cerrar sesión
        </button>
      </div>

      <div style={{ display:"flex", gap:3, margin:"12px 14px 0", background:"rgba(255,255,255,0.6)", borderRadius:12, padding:3 }}>
        {[["perfil","👤 Perfil"],["alcancías","🐷 Alcancías"],["interes","📈 Interés"],["tema","🎨 Tema"]].map(([t,l]) => (
          <button key={t} onClick={() => setParentTab(t)}
            style={{ flex:1, padding:"7px 2px", borderRadius:9, border:"none",
                     background: parentTab===t?"white":"transparent",
                     color: parentTab===t?theme.accent:"#888",
                     fontWeight: parentTab===t?600:400, cursor:"pointer", fontSize:11 }}>
            {l}
          </button>
        ))}
      </div>

      <div style={{ padding:"14px 16px 40px" }}>
        {parentTab === "perfil" && (
          <div style={{ background:"white", borderRadius:16, padding:18, border:"0.5px solid #eee" }}>
            <h3 style={{ margin:"0 0 14px", color:theme.accent, fontSize:15 }}>Datos del niño/a</h3>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              <Field label="Nombre"><Inp value={state.profile.nombre} onChange={e=>updProfile("nombre",e.target.value)} placeholder="Martina"/></Field>
              <Field label="Apellido"><Inp value={state.profile.apellido} onChange={e=>updProfile("apellido",e.target.value)} placeholder="García"/></Field>
            </div>
            <Field label="Apodo"><Inp value={state.profile.apodo} onChange={e=>updProfile("apodo",e.target.value)} placeholder="Marti"/></Field>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              <Field label="Edad"><Inp type="number" value={state.profile.edad} onChange={e=>updProfile("edad",e.target.value)} placeholder="10"/></Field>
              <Field label="Ciudad"><Inp value={state.profile.ciudad} onChange={e=>updProfile("ciudad",e.target.value)} placeholder="Buenos Aires"/></Field>
            </div>
            <Field label="País">
              <select value={state.profile.pais} onChange={e=>updProfile("pais",e.target.value)}
                style={{ width:"100%", padding:"10px 12px", borderRadius:10, border:"1.5px solid #ddd", fontSize:14, background:"white" }}>
                {Object.entries(BCRA_RATES).map(([k,v]) => <option key={k} value={k}>{v.label.split("(")[0].trim()}</option>)}
              </select>
            </Field>
            <Field label="PIN del niño/a (4 dígitos)">
              <Inp type="password" value={state.pin} onChange={e=>setState(s=>({...s,pin:e.target.value.slice(0,4)}))} placeholder="1234"/>
            </Field>
            <Field label={`Ingreso semanal (${CURRENCIES[pais]||"$"})`}>
              <Inp type="number" value={state.weeklyIncome} onChange={e=>setState(s=>({...s,weeklyIncome:parseFloat(e.target.value)||0}))} placeholder="2000"/>
            </Field>
          </div>
        )}

        {parentTab === "alcancías" && (
          <div style={{ background:"white", borderRadius:16, padding:18, border:"0.5px solid #eee" }}>
            <h3 style={{ margin:"0 0 4px", color:theme.accent, fontSize:15 }}>Porcentajes</h3>
            <p style={{ margin:"0 0 14px", fontSize:12, color:"#aaa" }}>Deben sumar exactamente 100%</p>
            {Object.entries(state.buckets).map(([key,b]) => (
              <div key={key} style={{ marginBottom:14 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                  <label style={{ fontSize:14, fontWeight:500 }}>{b.emoji} {b.label}</label>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <input type="number" min="0" max="100" value={b.pct}
                      onChange={e => updBucket(key, bk=>({...bk, pct:parseInt(e.target.value)||0}))}
                      style={{ width:56, padding:"6px 8px", borderRadius:8, border:`1.5px solid ${b.color}`,
                               fontSize:14, fontWeight:700, textAlign:"center", color:b.color }}/>
                    <span style={{ fontSize:14, color:b.color, fontWeight:600 }}>%</span>
                  </div>
                </div>
                <div style={{ background:"#f0f0f0", borderRadius:6, height:8, overflow:"hidden" }}>
                  <div style={{ width:`${b.pct}%`, background:b.color, height:"100%", borderRadius:6 }}/>
                </div>
                {key==="meta" && (
                  <div style={{ marginTop:8, display:"flex", gap:8 }}>
                    <Inp value={b.goalName} onChange={e=>updBucket("meta",bk=>({...bk,goalName:e.target.value}))} placeholder="Nombre de la meta" style={{ fontSize:12 }}/>
                    <Inp type="number" value={b.goalAmount} onChange={e=>updBucket("meta",bk=>({...bk,goalAmount:parseFloat(e.target.value)||0}))} placeholder="Monto" style={{ fontSize:12, width:120 }}/>
                  </div>
                )}
                {key==="dar" && (
                  <Inp value={b.cause} onChange={e=>updBucket("dar",bk=>({...bk,cause:e.target.value}))} placeholder="¿A quién le van a donar?" style={{ marginTop:6, fontSize:12 }}/>
                )}
              </div>
            ))}
            <div style={{ display:"flex", justifyContent:"space-between", padding:"10px 12px", borderRadius:10,
                          background: totalPct===100?"#f0fdf4":"#fef2f2",
                          border:`1.5px solid ${totalPct===100?"#86efac":"#fca5a5"}` }}>
              <span style={{ fontWeight:700, fontSize:14, color: totalPct===100?"#166534":"#991b1b" }}>Total: {totalPct}%</span>
              <span style={{ fontSize:12, color: totalPct===100?"#166534":"#991b1b" }}>{totalPct===100?"✅ Listo!":"Debe sumar 100%"}</span>
            </div>
          </div>
        )}

        {parentTab === "interes" && (
          <div style={{ background:"white", borderRadius:16, padding:18, border:"0.5px solid #eee" }}>
            <h3 style={{ margin:"0 0 4px", color:theme.accent, fontSize:15 }}>Tasa de interés</h3>
            <p style={{ margin:"0 0 14px", fontSize:12, color:"#aaa" }}>Se aplica al Sueño Grande anualmente</p>
            <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:16 }}>
              {[["bcra","📊 Tasa oficial del banco central"],["custom","✏️ Tasa personalizada"]].map(([v,l]) => (
                <button key={v} onClick={() => setState(s=>({...s,rateMode:v}))}
                  style={{ padding:"12px 14px", borderRadius:12, border:`2px solid ${state.rateMode===v?theme.accent:"#e5e5e5"}`,
                           background: state.rateMode===v?theme.bg:"white", color: state.rateMode===v?theme.accent:"#666",
                           fontWeight: state.rateMode===v?700:400, cursor:"pointer", textAlign:"left", fontSize:14 }}>
                  {l}
                </button>
              ))}
            </div>
            {state.rateMode==="bcra" ? (
              <div style={{ padding:14, background:theme.bg, borderRadius:12, border:`1px solid ${theme.secondary}` }}>
                <p style={{ margin:"0 0 4px", fontSize:13, color:"#666" }}>{BCRA_RATES[pais]?.label}</p>
                <p style={{ margin:0, fontSize:22, fontWeight:800, color:theme.accent }}>{BCRA_RATES[pais]?.rate}% anual</p>
              </div>
            ) : (
              <div style={{ padding:14, background:theme.bg, borderRadius:12, border:`1px solid ${theme.secondary}` }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <input type="number" min="0" max="200" step="0.5" value={state.customRate}
                    onChange={e => setState(s=>({...s,customRate:parseFloat(e.target.value)||0}))}
                    style={{ width:80, padding:10, borderRadius:8, border:`2px solid ${theme.accent}`,
                             fontSize:20, fontWeight:800, textAlign:"center", color:theme.accent }}/>
                  <span style={{ fontSize:18, fontWeight:700, color:theme.accent }}>% anual</span>
                </div>
              </div>
            )}
            <div style={{ marginTop:14, padding:12, background:"#f8f8f8", borderRadius:10 }}>
              {[1,3,6,12].map(m => (
                <div key={m} style={{ display:"flex", justifyContent:"space-between", padding:"4px 0", borderBottom:"0.5px solid #eee" }}>
                  <span style={{ fontSize:12, color:"#888" }}>En {m} {m===1?"mes":"meses"}</span>
                  <span style={{ fontSize:12, fontWeight:700, color:"#22c55e" }}>
                    +{cur((state.buckets.sueno.balance||1000)*(activeRate/100)*(m/12))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {parentTab === "tema" && (
          <div style={{ background:"white", borderRadius:16, padding:18, border:"0.5px solid #eee" }}>
            <h3 style={{ margin:"0 0 14px", color:theme.accent, fontSize:15 }}>Tema visual</h3>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {Object.entries(THEMES).map(([k,t]) => (
                <button key={k} onClick={() => setState(s=>({...s,theme:k}))}
                  style={{ padding:"14px 10px", borderRadius:14,
                           border:`2px solid ${state.theme===k?t.accent:"#e5e5e5"}`,
                           background: state.theme===k?t.bg:"white", cursor:"pointer", textAlign:"center" }}>
                  <div style={{ fontSize:26, marginBottom:4 }}>{t.emoji}</div>
                  <p style={{ margin:0, fontSize:13, fontWeight: state.theme===k?700:400,
                              color: state.theme===k?t.accent:"#666" }}>{t.name}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        <button onClick={() => setScreen("home")}
          style={{ width:"100%", marginTop:16, background:theme.accent, color:"white", border:"none",
                   borderRadius:12, padding:14, fontSize:15, fontWeight:700, cursor:"pointer" }}>
          Ir a la alcancía de {displayName} →
        </button>
      </div>
    </div>
  );

  // ── PANTALLA NIÑO/A ─────────────────────────────────────────
  return (
    <div style={{ minHeight:"100vh", background:theme.bg, fontFamily:"sans-serif" }}>
      <div style={{ background:theme.primary, padding:"16px 18px 20px", color:"white" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <p style={{ margin:0, fontSize:13, opacity:0.85 }}>Hola {displayName}! {theme.emoji}</p>
            <p style={{ margin:"2px 0 0", fontSize:26, fontWeight:800 }}>{cur(total)}</p>
            <p style={{ margin:0, fontSize:11, opacity:0.75 }}>tu total ahorrado {saving?"· 💾":""}</p>
          </div>
          <button onClick={() => setScreen("login")}
            style={{ background:"rgba(255,255,255,0.2)", border:"none", borderRadius:10,
                     padding:"8px 10px", color:"white", cursor:"pointer", fontSize:15 }}>🔒</button>
        </div>
        {state.streak > 0 && (
          <div style={{ marginTop:8, background:"rgba(255,255,255,0.2)", borderRadius:8,
                        padding:"3px 10px", display:"inline-block", fontSize:12 }}>
            🔥 {state.streak} semana{state.streak!==1?"s":""} ahorrando seguido
          </div>
        )}
      </div>

      {showOk && (
        <div style={{ background:"#f0fdf4", border:"1px solid #86efac", margin:"10px 14px",
                      borderRadius:12, padding:"10px 14px", textAlign:"center" }}>
          <p style={{ margin:0, color:"#166534", fontWeight:700, fontSize:14 }}>🎉 ¡Plata distribuida correctamente!</p>
        </div>
      )}

      <div style={{ display:"flex", gap:3, margin:"10px 14px 0", background:"rgba(255,255,255,0.6)", borderRadius:12, padding:3 }}>
        {[["home","🏠 Inicio"],["logros","🏆 Logros"],["historial","📋 Historial"]].map(([t,l]) => (
          <button key={t} onClick={() => setTab(t)}
            style={{ flex:1, padding:"7px 2px", borderRadius:9, border:"none",
                     background: tab===t?"white":"transparent",
                     color: tab===t?theme.accent:"#888",
                     fontWeight: tab===t?600:400, cursor:"pointer", fontSize:11 }}>
            {l}
          </button>
        ))}
      </div>

      {tab === "home" && (
        <div style={{ padding:"12px 14px 60px" }}>
          {!showDist ? (
            <button onClick={() => { setDistAmt(String(state.weeklyIncome)); setShowDist(true); }}
              style={{ width:"100%", background:theme.accent, color:"white", border:"none",
                       borderRadius:14, padding:14, fontSize:15, fontWeight:700, cursor:"pointer", marginBottom:14 }}>
              + Recibí mi plata esta semana!
            </button>
          ) : (
            <div style={{ background:"white", borderRadius:14, padding:14, marginBottom:14, border:`2px solid ${theme.primary}` }}>
              <p style={{ margin:"0 0 6px", fontWeight:700, color:theme.accent }}>¿Cuánto recibiste?</p>
              <input type="number" value={distAmt} onChange={e=>setDistAmt(e.target.value)}
                style={{ width:"100%", padding:10, borderRadius:8, border:"1.5px solid #ddd",
                         fontSize:18, fontWeight:700, boxSizing:"border-box", marginBottom:8 }}/>
              <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginBottom:10 }}>
                {Object.values(state.buckets).map(b => (
                  <span key={b.label} style={{ fontSize:11, background:theme.bg, padding:"3px 8px", borderRadius:8, color:theme.accent }}>
                    {b.emoji} {cur((parseFloat(distAmt)||0)*b.pct/100)}
                  </span>
                ))}
              </div>
              {totalPct!==100 && <p style={{ color:"#ef4444", fontSize:12, margin:"0 0 8px" }}>⚠️ Pedile al adulto que corrija los porcentajes</p>}
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={() => distribute(distAmt)} disabled={totalPct!==100}
                  style={{ flex:1, background: totalPct===100?theme.accent:"#ccc", color:"white", border:"none",
                           borderRadius:10, padding:12, fontWeight:700, cursor: totalPct===100?"pointer":"not-allowed" }}>
                  Distribuir
                </button>
                <button onClick={() => setShowDist(false)}
                  style={{ flex:1, background:"#f0f0f0", border:"none", borderRadius:10, padding:12, color:"#666", cursor:"pointer" }}>
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {Object.entries(state.buckets).map(([key,b]) => (
            <div key={key} style={{ background:"white", borderRadius:16, padding:14, marginBottom:10,
                                    border: activeBucket===key?`2px solid ${b.color}`:"1.5px solid #f0f0f0" }}>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <PiggyIcon color={b.color} size={42}/>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", justifyContent:"space-between" }}>
                    <div>
                      <p style={{ margin:0, fontWeight:700, fontSize:14, color:"#333" }}>{b.emoji} {b.label}</p>
                      <p style={{ margin:0, fontSize:11, color:"#aaa" }}>{b.pct}% de tu plata</p>
                    </div>
                    <p style={{ margin:0, fontWeight:800, fontSize:18, color:b.color }}>{cur(b.balance)}</p>
                  </div>
                  {key==="meta" && (
                    <div style={{ marginTop:6 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                        <span style={{ fontSize:11, color:"#666" }}>{b.goalName}</span>
                        <span style={{ fontSize:11, fontWeight:700, color:b.color }}>{metaPct}%</span>
                      </div>
                      <div style={{ background:"#f0f0f0", borderRadius:6, height:7, overflow:"hidden" }}>
                        <div style={{ width:`${metaPct}%`, background:b.color, height:"100%", borderRadius:6, transition:"width 0.5s" }}/>
                      </div>
                      <p style={{ margin:"3px 0 0", fontSize:10, color:"#aaa" }}>Objetivo: {cur(b.goalAmount)}</p>
                    </div>
                  )}
                  {key==="sueno" && <p style={{ margin:"5px 0 0", fontSize:11, color:"#22c55e", fontWeight:600 }}>+{activeRate}% anual simulado 📈</p>}
                  {key==="dar" && <p style={{ margin:"5px 0 0", fontSize:11, color:"#fb923c" }}>{b.cause} 💛</p>}
                </div>
              </div>
              <button onClick={() => setActiveBucket(activeBucket===key?null:key)}
                style={{ width:"100%", marginTop:10, padding:8, borderRadius:10,
                         border:`1.5px solid ${b.color}`, background: activeBucket===key?b.color:"transparent",
                         color: activeBucket===key?"white":b.color, fontWeight:600, cursor:"pointer", fontSize:13 }}>
                {activeBucket===key?"Cancelar":"Registrar gasto"}
              </button>
              {activeBucket===key && (
                <div style={{ marginTop:10, display:"flex", flexDirection:"column", gap:8 }}>
                  <input type="number" placeholder="¿Cuánto?" value={spendAmt} onChange={e=>setSpendAmt(e.target.value)}
                    style={{ padding:10, borderRadius:8, border:"1.5px solid #ddd", fontSize:14 }}/>
                  <input type="text" placeholder="¿En qué? (snack, útiles...)" value={spendDesc} onChange={e=>setSpendDesc(e.target.value)}
                    style={{ padding:10, borderRadius:8, border:"1.5px solid #ddd", fontSize:14 }}/>
                  <button onClick={() => spend(key, spendAmt, spendDesc)}
                    style={{ padding:10, borderRadius:10, border:"none", background:b.color, color:"white", fontWeight:700, cursor:"pointer" }}>
                    Confirmar gasto
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === "logros" && (
        <div style={{ padding:"12px 14px 60px" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {[
              { icon:"🔥", label:"Primera semana",   desc:"Distribuiste tu plata",     done: state.streak>=1 },
              { icon:"💎", label:"Sueño en marcha",  desc:"Guardaste en Sueño Grande", done: state.buckets.sueno.balance>0 },
              { icon:"🤝", label:"Corazón generoso", desc:"Tenés plata para donar",    done: state.buckets.dar.balance>0 },
              { icon:"🌟", label:"Super ahorradora", desc:"3 semanas seguidas",        done: state.streak>=3 },
              { icon:"🎯", label:"Mitad de meta",    desc:"50% de tu objetivo",        done: metaPct>=50 },
              { icon:"🏆", label:"¡Meta cumplida!",  desc:"Alcanzaste el 100%",        done: metaPct>=100 },
              { icon:"💰", label:"Gran tesoro",      desc:"Más de 10.000 guardados",   done: total>=10000 },
              { icon:"🌈", label:"5 semanas!",       desc:"Racha de 5 semanas",        done: state.streak>=5 },
            ].map((b,i) => (
              <div key={i} style={{ background: b.done?"white":"#f8f8f8", borderRadius:14, padding:12,
                                    border: b.done?`2px solid ${theme.primary}`:"1.5px solid #eee", opacity: b.done?1:0.5 }}>
                <div style={{ fontSize:26, marginBottom:4 }}>{b.icon}</div>
                <p style={{ margin:"0 0 2px", fontWeight:600, fontSize:12, color: b.done?theme.accent:"#888" }}>{b.label}</p>
                <p style={{ margin:0, fontSize:10, color:"#aaa" }}>{b.desc}</p>
                {b.done && <span style={{ fontSize:9, background:theme.secondary, color:theme.accent, padding:"2px 6px", borderRadius:6, marginTop:4, display:"inline-block" }}>✅ Desbloqueado</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "historial" && (
        <div style={{ padding:"12px 14px 60px" }}>
          {Object.entries(state.buckets).map(([key,b]) => b.history.length>0 && (
            <div key={key} style={{ marginBottom:14 }}>
              <h3 style={{ margin:"0 0 8px", fontSize:13, color:theme.accent }}>{b.emoji} {b.label}</h3>
              {b.history.map((h,i) => (
                <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"8px 10px",
                                      background:"white", borderRadius:8, marginBottom:4, border:"0.5px solid #eee" }}>
                  <div>
                    <p style={{ margin:0, fontSize:12, fontWeight:500 }}>{h.desc}</p>
                    <p style={{ margin:0, fontSize:10, color:"#bbb" }}>{h.date}</p>
                  </div>
                  <p style={{ margin:0, fontWeight:700, color: h.amt>0?"#22c55e":"#ef4444", fontSize:13 }}>
                    {h.amt>0?"+":""}{cur(h.amt)}
                  </p>
                </div>
              ))}
            </div>
          ))}
          {Object.values(state.buckets).every(b=>b.history.length===0) && (
            <p style={{ textAlign:"center", color:"#bbb", marginTop:40, fontSize:14 }}>Todavía no hay movimientos.</p>
          )}
        </div>
      )}
    </div>
  );
}