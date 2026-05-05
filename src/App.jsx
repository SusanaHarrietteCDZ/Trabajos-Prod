import { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult } from "firebase/auth";
import { getFirestore, collection, addDoc, updateDoc, doc, onSnapshot, query, orderBy, where, serverTimestamp, getDoc, setDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import * as XLSX from "xlsx";

const firebaseConfig = {
  apiKey: "AIzaSyDbqKar3q6FlvSkXvAB76wBo2bqwWF3-YE",
  authDomain: "trabajos-prod.firebaseapp.com",
  projectId: "trabajos-prod",
  storageBucket: "trabajos-prod.firebasestorage.app",
  messagingSenderId: "996151293287",
  appId: "1:996151293287:web:af79ea14a52634fed3ebc2",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

const USUARIOS = {
  "daranibar@crucedelzorro.com": "Daniel Aranibar",
  "ventas@crucedelzorro.com": "Camila Justiniano",
  "benjaminrodriguez@crucedelzorro.com": "Benjamin Rodriguez",
  "raquelmorales@crucedelzorro.com": "Raquel Morales",
  "claramalaga@crucedelzorro.com": "Clara Malaga",
  "jesussierra@crucedelzorro.com": "Jesus Sierra",
  "admin@crucedelzorro.com": "Admin",
  "susanaharriette@crucedelzorro.com": "Susana Harriette",
  "soledadlara@crucedelzorro.com": "Soledad Lara",
};

const TRABAJOS_REALIZADOS = [
  "Fijar qué N° de tanque entra uva molida",
  "Sacar % de sangría",
  "Agregado de insumos",
  "Remontajes",
  "Anotar datos de temperaturas Grado B°, frío abierto o cerrado",
  "Descube",
  "Prensado",
  "1er Trasiego",
  "2do Trasiego",
  "Clarificación",
  "Desborre",
  "Definición de cortes",
  "Selección de vinos a barrica",
  "Filtrado",
  "Embotellado",
  "Traslado",
];

const VARIEDADES = [
  "Malbec",
  "Syrah",
  "Tannat",
  "Petit Verdot",
  "Cabernet Sauvignon",
  "Chenin/Sauvignon",
  "Sangría",
  "Corte Porfiado Blend",
  "Corte Porfiado Franc",
  "Corte CDZ Pettit Verdot",
  "Corte CDZ Blend",
  "Corte CDZ Cabernet Sau. (Innovacion)",
  "Corte Rose(Innovacion)",
];

const TANQUES = [
  "Tanque 1", "Tanque 2", "Tanque 3", "Tanque 4", "Tanque 5",
  "Tanque 6", "Tanque 7", "Tanque 8", "Tanque 9", "Tanque 10",
  "Tanque 11", "Tanque 12", "Tanque 13", "Tanque 14", "Tanque 15",
  "Tanque 16", "Tanque 17", "Tanque 18",
  "Tanque 20", "Tanque 21", "Tanque 22", "Tanque 23", "Tanque 24",
  "Tanque 25", "Tanque 26", "Tanque 27", "Tanque 28", "Tanque 29",
  "Tanque 30", "Tanque 31", "Tanque 32",
  "Barrica 25001", "Barrica 25002", "Barrica 25003", "Barrica 25004",
  "Barrica 25005", "Barrica 25006", "Barrica 25007", "Barrica 25008",
];

const C = {
  bg: "#0a0a0a",
  card: "#141414",
  cardBorder: "#2a2a2a",
  gold: "#C8962E",
  goldLight: "#e0b44a",
  goldDim: "rgba(200,150,46,0.15)",
  text: "#f0ead6",
  textMuted: "#7a6a55",
  textSub: "#b0a090",
  danger: "#dc3545",
  success: "#28a745",
  info: "#3a8fd4",
};

const inp = {
  width: "100%", padding: "12px 14px", borderRadius: 10,
  border: "1px solid #333", background: "#1a1a1a",
  color: C.text, fontSize: 15, outline: "none", boxSizing: "border-box",
  WebkitAppearance: "none",
};
const sel = { ...inp };
const lbl = { display: "block", fontSize: 11, color: C.textMuted, marginBottom: 6, letterSpacing: 1, textTransform: "uppercase", fontWeight: 600 };
const btn = (v = "primary") => ({
  padding: "13px 24px", borderRadius: 10, border: "none", cursor: "pointer",
  fontSize: 15, fontWeight: 700, letterSpacing: 0.3, transition: "all 0.18s",
  ...(v === "primary" ? { background: `linear-gradient(135deg, #8B4513, ${C.gold})`, color: "#fff", boxShadow: "0 4px 16px rgba(139,69,19,0.35)" }
    : v === "ghost" ? { background: "transparent", color: C.textMuted, border: "1px solid #333" }
    : v === "success" ? { background: "rgba(40,167,69,0.15)", color: C.success, border: `1px solid ${C.success}` }
    : v === "danger" ? { background: "rgba(220,53,69,0.12)", color: C.danger, border: `1px solid ${C.danger}` }
    : { background: C.goldDim, color: C.gold, border: `1px solid ${C.gold}` }),
});
const card = { background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 14, padding: 20, marginBottom: 18 };
const section = { fontSize: 13, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 14, paddingBottom: 8, borderBottom: "1px solid #222" };

function Login() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    getRedirectResult(auth).catch(() => {});
  }, []);

  const doLogin = async () => {
    setErr(""); setLoading(true);
    try { await signInWithEmailAndPassword(auth, email, pass); }
    catch { setErr("Email o contraseña incorrectos."); }
    finally { setLoading(false); }
  };

  const doGoogleLogin = async () => {
    setErr(""); setGoogleLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    }
    catch (e) {
      if (e.code === "auth/popup-blocked" || e.code === "auth/cancelled-popup-request") {
        try {
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch { setErr("Error al iniciar sesión con Google."); }
      } else if (e.code === "auth/popup-closed-by-user") {
      } else if (e.code === "auth/account-exists-with-different-credential") {
        setErr("Ya existe una cuenta con este email usando otro método de inicio de sesión.");
      } else {
        setErr("Error al iniciar sesión con Google.");
      }
    }
    finally { setGoogleLoading(false); }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: `radial-gradient(ellipse at center, #1a0800 0%, ${C.bg} 70%)` }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />
      <div style={{ ...card, width: "min(90vw,380px)", padding: 40, textAlign: "center" }}>
        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: C.gold, fontWeight: 500, letterSpacing: 1.5, marginBottom: 20 }}>Registro de Trabajos de Producción</div>
        <img src="/logo-cdz.png" alt="CDZ" style={{ width: 64, height: 64, marginBottom: 6, filter: "invert(1)", mixBlendMode: "screen" }} />
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 30, color: C.gold, fontWeight: 700, letterSpacing: 2 }}>CDZ</div>
        <div style={{ fontSize: 11, color: C.textMuted, letterSpacing: 4, textTransform: "uppercase", marginBottom: 32 }}>Bodega</div>
        <div style={{ marginBottom: 14, textAlign: "left" }}>
          <label style={lbl}>Email</label>
          <input style={inp} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@crucedelzorro.com" onKeyDown={e => e.key === "Enter" && doLogin()} />
        </div>
        <div style={{ marginBottom: 24, textAlign: "left" }}>
          <label style={lbl}>Contraseña</label>
          <input style={inp} type="password" value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === "Enter" && doLogin()} />
        </div>
        {err && <div style={{ color: C.danger, fontSize: 13, marginBottom: 16, padding: "10px 14px", background: "rgba(220,53,69,0.08)", borderRadius: 8, border: "1px solid rgba(220,53,69,0.25)" }}>{err}</div>}
        <button style={{ ...btn("primary"), width: "100%", padding: 15, fontSize: 16 }} onClick={doLogin} disabled={loading || googleLoading}>
          {loading ? "Ingresando..." : "Ingresar"}
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
          <div style={{ flex: 1, height: 1, background: "#333" }} />
          <span style={{ fontSize: 12, color: C.textMuted, textTransform: "uppercase", letterSpacing: 1 }}>o</span>
          <div style={{ flex: 1, height: 1, background: "#333" }} />
        </div>
        <button
          style={{
            width: "100%", padding: 14, borderRadius: 10, border: "1px solid #333",
            background: "#1a1a1a", color: C.text, fontSize: 15, fontWeight: 600,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            transition: "all 0.18s",
          }}
          onClick={doGoogleLogin}
          disabled={loading || googleLoading}
        >
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.01 24.01 0 0 0 0 21.56l7.98-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          {googleLoading ? "Ingresando..." : "Continuar con Google"}
        </button>
      </div>
    </div>
  );
}

function FormTrabajo({ user, nombreUsuario }) {
  const empty = () => ({
    fecha: new Date().toISOString().slice(0, 10),
    trabajoRealizado: "",
    variedad: "",
    traslado: "",
    deTanque: "",
    aTanque: "",
    tanque: "",
    litrosTanqueFinal: "",
    observaciones: "",
    imagenes: [],
  });

  const [vista, setVista] = useState("form");
  const [form, setForm] = useState(empty());
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleImages = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    try {
      const urls = await Promise.all(files.map(async (file) => {
        const r = ref(storage, `trabajos/${Date.now()}_${file.name}`);
        await uploadBytes(r, file);
        return getDownloadURL(r);
      }));
      setForm(f => ({ ...f, imagenes: [...f.imagenes, ...urls] }));
    } catch (err) { alert("Error al subir imagen: " + err.message); }
    finally { setUploading(false); }
  };

  const handleSubmit = async () => {
    if (!form.fecha) return alert("Seleccioná la fecha.");
    if (!form.trabajoRealizado) return alert("Seleccioná el trabajo realizado.");
    if (!form.variedad) return alert("Seleccioná la variedad.");
    if (!form.traslado) return alert("Seleccioná si hubo traslado (Sí/No).");
    if (form.traslado === "Sí") {
      if (!form.deTanque) return alert("Seleccioná el tanque de origen (De Tanque).");
      if (!form.aTanque) return alert("Seleccioná el tanque de destino (A Tanque).");
    } else {
      if (!form.tanque) return alert("Seleccioná el tanque.");
    }
    setSaving(true);
    try {
      const trabajoData = {
        usuarioEmail: user.email,
        nombreUsuario,
        fecha: form.fecha,
        trabajoRealizado: form.trabajoRealizado,
        variedad: form.variedad,
        traslado: form.traslado,
        deTanque: form.traslado === "Sí" ? form.deTanque : "",
        aTanque: form.traslado === "Sí" ? form.aTanque : "",
        tanque: form.traslado === "No" ? form.tanque : "",
        litrosTanqueFinal: form.litrosTanqueFinal,
        observaciones: form.observaciones,
        imagenes: form.imagenes,
        createdAt: serverTimestamp(),
      };
      await addDoc(collection(db, "trabajos"), trabajoData);
      try {
        await fetch(window.location.origin + "/api/sync-sheet", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fecha: form.fecha,
            nombreUsuario,
            trabajoRealizado: form.trabajoRealizado,
            variedad: form.variedad,
            traslado: form.traslado,
            deTanque: form.traslado === "Sí" ? form.deTanque : "",
            aTanque: form.traslado === "Sí" ? form.aTanque : "",
            tanque: form.traslado === "No" ? form.tanque : "",
            litrosTanqueFinal: form.litrosTanqueFinal,
            observaciones: form.observaciones,
          }),
        });
      } catch (sheetErr) {
        console.warn("No se pudo sincronizar con Google Sheets:", sheetErr);
      }
      setSaved(true);
      setForm(empty());
      setTimeout(() => setSaved(false), 4000);
    } catch (e) { alert("Error al guardar: " + e.message); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Inter', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />

      <div style={{ background: "linear-gradient(135deg, #1a0800, #2a1200)", borderBottom: "1px solid #3a2010", padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src="/logo-cdz.png" alt="CDZ" style={{ width: 28, height: 28, filter: "invert(1)", mixBlendMode: "screen" }} />
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", color: C.gold, fontSize: 18, fontWeight: 700, lineHeight: 1 }}>CDZ</div>
            <div style={{ fontSize: 10, color: C.textMuted, letterSpacing: 2 }}>BODEGA</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{nombreUsuario}</div>
            <div style={{ fontSize: 10, color: C.textMuted }}>Operario</div>
          </div>
          <button style={{ ...btn("ghost"), padding: "6px 12px", fontSize: 12 }} onClick={() => signOut(auth)}>Salir</button>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: 0, background: "#111", borderBottom: "1px solid #2a2a2a" }}>
        {[
          { key: "form", label: "Nuevo Trabajo" },
          { key: "panel", label: "Mis Registros" },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setVista(t.key)}
            style={{
              padding: "12px 28px", fontSize: 14, fontWeight: vista === t.key ? 700 : 400,
              color: vista === t.key ? C.gold : C.textMuted, background: "transparent",
              border: "none", borderBottom: vista === t.key ? `2px solid ${C.gold}` : "2px solid transparent",
              cursor: "pointer", transition: "all 0.2s", letterSpacing: 0.5,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {vista === "form" && (
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "20px 16px 40px" }}>

          {saved && (
            <div style={{ background: "rgba(40,167,69,0.12)", border: `1px solid ${C.success}`, borderRadius: 12, padding: 18, marginBottom: 20, textAlign: "center", color: C.success, fontWeight: 700, fontSize: 16 }}>
              Trabajo registrado correctamente
            </div>
          )}

          <div style={card}>
            <div style={section}>Trabajo Realizado</div>

            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Fecha *</label>
              <input style={inp} type="date" value={form.fecha} onChange={e => set("fecha", e.target.value)} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Trabajo Realizado *</label>
              <select style={sel} value={form.trabajoRealizado} onChange={e => set("trabajoRealizado", e.target.value)}>
                <option value="">— Seleccionar trabajo —</option>
                {TRABAJOS_REALIZADOS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Variedad *</label>
              <select style={sel} value={form.variedad} onChange={e => set("variedad", e.target.value)}>
                <option value="">— Seleccionar variedad —</option>
                {VARIEDADES.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Traslado *</label>
              <div style={{ display: "flex", gap: 12 }}>
                {["Sí", "No"].map(opt => (
                  <button
                    key={opt}
                    onClick={() => {
                      set("traslado", opt);
                      if (opt === "Sí") setForm(f => ({ ...f, traslado: opt, tanque: "" }));
                      else setForm(f => ({ ...f, traslado: opt, deTanque: "", aTanque: "" }));
                    }}
                    style={{
                      flex: 1, padding: "12px 0", borderRadius: 10, fontSize: 15, fontWeight: 700,
                      cursor: "pointer", transition: "all 0.2s",
                      background: form.traslado === opt ? (opt === "Sí" ? "rgba(40,167,69,0.15)" : "rgba(220,53,69,0.12)") : "#1a1a1a",
                      color: form.traslado === opt ? (opt === "Sí" ? C.success : C.danger) : C.textMuted,
                      border: `1px solid ${form.traslado === opt ? (opt === "Sí" ? C.success : C.danger) : "#333"}`,
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {form.traslado === "Sí" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={lbl}>De Tanque *</label>
                  <select style={sel} value={form.deTanque} onChange={e => set("deTanque", e.target.value)}>
                    <option value="">— Seleccionar —</option>
                    {TANQUES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>A Tanque *</label>
                  <select style={sel} value={form.aTanque} onChange={e => set("aTanque", e.target.value)}>
                    <option value="">— Seleccionar —</option>
                    {TANQUES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            )}

            {form.traslado === "No" && (
              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>Tanque *</label>
                <select style={sel} value={form.tanque} onChange={e => set("tanque", e.target.value)}>
                  <option value="">— Seleccionar tanque —</option>
                  {TANQUES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            )}

            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Litros en Tanque Final</label>
              <input
                style={inp}
                type="text"
                inputMode="numeric"
                value={form.litrosTanqueFinal}
                onChange={e => {
                  const v = e.target.value.replace(/[^0-9]/g, "").slice(0, 9);
                  set("litrosTanqueFinal", v);
                }}
                placeholder="Ej: 15000"
                maxLength={9}
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Observaciones</label>
              <textarea
                style={{ ...inp, minHeight: 70, resize: "vertical" }}
                value={form.observaciones}
                onChange={e => {
                  if (e.target.value.length <= 244) set("observaciones", e.target.value);
                }}
                placeholder="Observaciones adicionales..."
                maxLength={244}
              />
              <div style={{ fontSize: 10, color: C.textMuted, textAlign: "right", marginTop: 4 }}>{form.observaciones.length}/244</div>
            </div>
          </div>

          <div style={card}>
            <div style={section}>Fotos</div>
            <div>
              <div
                style={{ border: "2px dashed #333", borderRadius: 10, padding: 20, textAlign: "center", cursor: "pointer", color: C.textMuted }}
                onClick={() => fileRef.current.click()}
              >
                {uploading ? "Subiendo..." : (
                  <>
                    <div style={{ fontSize: 28, marginBottom: 6 }}>+</div>
                    <div style={{ fontSize: 13 }}>Tocar para subir foto</div>
                    <div style={{ fontSize: 11, marginTop: 4 }}>JPG, PNG</div>
                  </>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleImages} />
              {form.imagenes.length > 0 && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                  {form.imagenes.map((url, i) => (
                    <img key={i} src={url} alt="" style={{ width: 70, height: 70, objectFit: "cover", borderRadius: 8, border: "1px solid #333" }} />
                  ))}
                </div>
              )}
            </div>
          </div>

          <button style={{ ...btn("primary"), width: "100%", padding: 18, fontSize: 17, borderRadius: 12 }} onClick={handleSubmit} disabled={saving}>
            {saving ? "Guardando..." : "Registrar Trabajo"}
          </button>
        </div>
      )}

      {vista === "panel" && (
        <PanelRegistros user={user} nombreUsuario={nombreUsuario} />
      )}
    </div>
  );
}

function PanelRegistros({ user, nombreUsuario }) {
  const [trabajos, setTrabajos] = useState([]);
  const [filtroTrabajo, setFiltroTrabajo] = useState("Todos");
  const [filtroVariedad, setFiltroVariedad] = useState("Todos");
  const [busqueda, setBusqueda] = useState("");
  const [detalle, setDetalle] = useState(null);

  useEffect(() => {
    const q = query(collection(db, "trabajos"), where("usuarioEmail", "==", user.email));
    return onSnapshot(q, snap => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      docs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setTrabajos(docs);
    }, (error) => {
      console.error("Error loading registros:", error);
    });
  }, [user.email]);

  const filtrados = trabajos.filter(t => {
    const matchT = filtroTrabajo === "Todos" || t.trabajoRealizado === filtroTrabajo;
    const matchV = filtroVariedad === "Todos" || t.variedad === filtroVariedad;
    const matchB = !busqueda || t.observaciones?.toLowerCase().includes(busqueda.toLowerCase()) || t.trabajoRealizado?.toLowerCase().includes(busqueda.toLowerCase());
    return matchT && matchV && matchB;
  });

  const exportar = () => {
    const rows = filtrados.map(t => ({
      "Fecha": t.fecha || "-",
      "Trabajo Realizado": t.trabajoRealizado || "",
      "Variedad": t.variedad || "",
      "Traslado": t.traslado || "",
      "De Tanque": t.deTanque || "",
      "A Tanque": t.aTanque || "",
      "Tanque": t.tanque || "",
      "Litros Tanque Final": t.litrosTanqueFinal || "",
      "Observaciones": t.observaciones || "",
      "Registrado": t.createdAt?.toDate?.()?.toLocaleString?.("es-BO") || "-",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = Object.keys(rows[0] || {}).map(() => ({ wch: 22 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Mis Trabajos");
    XLSX.writeFile(wb, `CDZ_Trabajos_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 20px" }}>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ fontFamily: "'Playfair Display', serif", color: C.gold, fontSize: 20, fontWeight: 700 }}>Mis Registros</div>
        <button style={{ ...btn("success"), padding: "9px 20px", fontSize: 13 }} onClick={exportar}>Exportar Excel</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total Registros", val: trabajos.length },
          { label: "Filtrados", val: filtrados.length },
        ].map(s => (
          <div key={s.label} style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 12, padding: 16, textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: C.gold, fontFamily: "'Playfair Display', serif" }}>{s.val}</div>
            <div style={{ fontSize: 11, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ ...card, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
        <div style={{ flex: "1 1 180px" }}>
          <label style={lbl}>Buscar</label>
          <input style={inp} placeholder="Trabajo u observación..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
        </div>
        <div style={{ flex: "1 1 150px" }}>
          <label style={lbl}>Trabajo</label>
          <select style={sel} value={filtroTrabajo} onChange={e => setFiltroTrabajo(e.target.value)}>
            <option value="Todos">Todos</option>
            {TRABAJOS_REALIZADOS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div style={{ flex: "1 1 150px" }}>
          <label style={lbl}>Variedad</label>
          <select style={sel} value={filtroVariedad} onChange={e => setFiltroVariedad(e.target.value)}>
            <option value="Todos">Todos</option>
            {VARIEDADES.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
      </div>

      {detalle && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
          onClick={e => e.target === e.currentTarget && setDetalle(null)}>
          <div style={{ background: "#161616", border: "1px solid #333", borderRadius: 16, padding: 28, width: "min(95vw,580px)", maxHeight: "90vh", overflowY: "auto" }}>
            {(() => {
              const t = detalle;
              return (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
                    <div style={{ fontFamily: "'Playfair Display', serif", color: C.gold, fontSize: 20, fontWeight: 700 }}>Detalle del Trabajo</div>
                    <button style={{ ...btn("ghost"), padding: "5px 12px" }} onClick={() => setDetalle(null)}>X</button>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                    {[
                      ["Fecha", t.fecha || "-"],
                      ["Trabajo", t.trabajoRealizado || "-"],
                      ["Variedad", t.variedad || "-"],
                      ["Traslado", t.traslado || "-"],
                      ...(t.traslado === "Sí" ? [["De Tanque", t.deTanque || "-"], ["A Tanque", t.aTanque || "-"]] : [["Tanque", t.tanque || "-"]]),
                      ["Litros Tanque Final", t.litrosTanqueFinal ? `${Number(t.litrosTanqueFinal).toLocaleString()} L` : "-"],
                      ["Registrado", t.createdAt?.toDate?.()?.toLocaleString?.("es-BO") || "-"],
                    ].map(([k, v]) => (
                      <div key={k} style={{ background: "#1a1a1a", borderRadius: 8, padding: 10 }}>
                        <div style={{ fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 3 }}>{k}</div>
                        <div style={{ fontSize: 13, color: C.text }}>{v}</div>
                      </div>
                    ))}
                  </div>

                  {t.observaciones && (
                    <div style={{ background: "#1a1a1a", borderRadius: 8, padding: 12, fontSize: 13, color: C.textSub, marginBottom: 16 }}>
                      <b style={{ color: C.gold }}>Observaciones:</b> {t.observaciones}
                    </div>
                  )}

                  {(t.imagenes || []).length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 11, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>Fotos</div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {t.imagenes.map((url, i) => (
                          <a key={i} href={url} target="_blank" rel="noreferrer">
                            <img src={url} alt="" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8, border: "1px solid #333" }} />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}

      <div style={card}>
        <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 14 }}>
          Mostrando <b style={{ color: C.gold }}>{filtrados.length}</b> de {trabajos.length} registros
        </div>
        {filtrados.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: C.textMuted }}>
            <img src="/logo-cdz.png" alt="CDZ" style={{ width: 52, height: 52, marginBottom: 12, filter: "invert(1)", mixBlendMode: "screen" }} />
            <div>No hay registros que mostrar</div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  {["Fecha", "Trabajo", "Variedad", "Tanque(s)", "Litros", "Obs.", "Fotos", ""].map(h => (
                    <th key={h} style={{ padding: "10px 12px", textAlign: "left", borderBottom: "1px solid #2a2a2a", color: C.textMuted, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.8, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtrados.map(t => (
                  <tr key={t.id} style={{ cursor: "pointer", borderBottom: "1px solid #1a1a1a" }}
                    onClick={() => setDetalle(t)}
                    onMouseEnter={e => e.currentTarget.style.background = "#1a1a1a"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <td style={{ padding: "11px 12px", color: C.textMuted, whiteSpace: "nowrap", fontSize: 12 }}>{t.fecha || "-"}</td>
                    <td style={{ padding: "11px 12px", color: C.text, fontWeight: 600, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.trabajoRealizado}</td>
                    <td style={{ padding: "11px 12px", color: C.textSub, fontSize: 12 }}>{t.variedad}</td>
                    <td style={{ padding: "11px 12px", color: C.gold, fontSize: 12, whiteSpace: "nowrap" }}>
                      {t.traslado === "Sí" ? `${t.deTanque} → ${t.aTanque}` : t.tanque || "-"}
                    </td>
                    <td style={{ padding: "11px 12px", color: C.gold, fontWeight: 700, whiteSpace: "nowrap" }}>
                      {t.litrosTanqueFinal ? `${Number(t.litrosTanqueFinal).toLocaleString()} L` : "-"}
                    </td>
                    <td style={{ padding: "11px 12px", color: C.textMuted, fontSize: 12, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {t.observaciones || "-"}
                    </td>
                    <td style={{ padding: "11px 12px", textAlign: "center" }}>
                      {(t.imagenes || []).length > 0 ? (
                        <span style={{ fontSize: 11, color: C.success, fontWeight: 700 }}>{(t.imagenes || []).length}</span>
                      ) : (
                        <span style={{ fontSize: 11, color: C.textMuted }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: "11px 12px" }} onClick={e => e.stopPropagation()}>
                      <button style={{ ...btn("ghost"), padding: "5px 12px", fontSize: 12 }} onClick={() => setDetalle(t)}>Ver</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function PanelAdmin({ user, role }) {
  const [trabajos, setTrabajos] = useState([]);
  const [filtroUsuario, setFiltroUsuario] = useState("Todos");
  const [filtroTrabajo, setFiltroTrabajo] = useState("Todos");
  const [filtroVariedad, setFiltroVariedad] = useState("Todos");
  const [busqueda, setBusqueda] = useState("");
  const [detalle, setDetalle] = useState(null);

  useEffect(() => {
    const q = query(collection(db, "trabajos"), orderBy("createdAt", "desc"));
    return onSnapshot(q, snap => setTrabajos(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, []);

  const usuariosUnicos = [...new Set(trabajos.map(t => t.nombreUsuario))].filter(Boolean);

  const filtrados = trabajos.filter(t => {
    const matchU = filtroUsuario === "Todos" || t.nombreUsuario === filtroUsuario;
    const matchT = filtroTrabajo === "Todos" || t.trabajoRealizado === filtroTrabajo;
    const matchV = filtroVariedad === "Todos" || t.variedad === filtroVariedad;
    const matchB = !busqueda || t.observaciones?.toLowerCase().includes(busqueda.toLowerCase()) || t.trabajoRealizado?.toLowerCase().includes(busqueda.toLowerCase()) || t.nombreUsuario?.toLowerCase().includes(busqueda.toLowerCase());
    return matchU && matchT && matchV && matchB;
  });

  const exportar = () => {
    const rows = filtrados.map(t => ({
      "Fecha": t.fecha || "-",
      "Usuario": t.nombreUsuario || "",
      "Trabajo Realizado": t.trabajoRealizado || "",
      "Variedad": t.variedad || "",
      "Traslado": t.traslado || "",
      "De Tanque": t.deTanque || "",
      "A Tanque": t.aTanque || "",
      "Tanque": t.tanque || "",
      "Litros Tanque Final": t.litrosTanqueFinal || "",
      "Observaciones": t.observaciones || "",
      "Registrado": t.createdAt?.toDate?.()?.toLocaleString?.("es-BO") || "-",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = Object.keys(rows[0] || {}).map(() => ({ wch: 22 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Trabajos CDZ");
    XLSX.writeFile(wb, `CDZ_Trabajos_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Inter', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />

      <div style={{ background: "linear-gradient(135deg, #1a0800, #2a1200)", borderBottom: "1px solid #3a2010", padding: "14px 28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src="/logo-cdz.png" alt="CDZ" style={{ width: 32, height: 32, filter: "invert(1)", mixBlendMode: "screen" }} />
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", color: C.gold, fontSize: 22, fontWeight: 700, letterSpacing: 2 }}>CDZ — Panel Admin</div>
            <div style={{ fontSize: 10, color: C.textMuted, letterSpacing: 3 }}>TRABAJOS DE BODEGA</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button style={{ ...btn("success"), padding: "9px 20px", fontSize: 13 }} onClick={exportar}>Exportar Excel</button>
          <button style={{ ...btn("ghost"), padding: "9px 16px", fontSize: 13 }} onClick={() => signOut(auth)}>Salir</button>
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "24px 20px" }}>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 24 }}>
          {[
            { label: "Total Registros", val: trabajos.length },
            { label: "Filtrados", val: filtrados.length },
            { label: "Usuarios", val: usuariosUnicos.length },
          ].map(s => (
            <div key={s.label} style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 12, padding: 16, textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: C.gold, fontFamily: "'Playfair Display', serif" }}>{s.val}</div>
              <div style={{ fontSize: 11, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ ...card, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: "1 1 180px" }}>
            <label style={lbl}>Buscar</label>
            <input style={inp} placeholder="Trabajo, observación o usuario..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
          </div>
          <div style={{ flex: "1 1 150px" }}>
            <label style={lbl}>Usuario</label>
            <select style={sel} value={filtroUsuario} onChange={e => setFiltroUsuario(e.target.value)}>
              <option value="Todos">Todos</option>
              {usuariosUnicos.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div style={{ flex: "1 1 150px" }}>
            <label style={lbl}>Trabajo</label>
            <select style={sel} value={filtroTrabajo} onChange={e => setFiltroTrabajo(e.target.value)}>
              <option value="Todos">Todos</option>
              {TRABAJOS_REALIZADOS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div style={{ flex: "1 1 150px" }}>
            <label style={lbl}>Variedad</label>
            <select style={sel} value={filtroVariedad} onChange={e => setFiltroVariedad(e.target.value)}>
              <option value="Todos">Todos</option>
              {VARIEDADES.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        </div>

        {detalle && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
            onClick={e => e.target === e.currentTarget && setDetalle(null)}>
            <div style={{ background: "#161616", border: "1px solid #333", borderRadius: 16, padding: 28, width: "min(95vw,580px)", maxHeight: "90vh", overflowY: "auto" }}>
              {(() => {
                const t = detalle;
                return (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
                      <div style={{ fontFamily: "'Playfair Display', serif", color: C.gold, fontSize: 20, fontWeight: 700 }}>Detalle del Trabajo</div>
                      <button style={{ ...btn("ghost"), padding: "5px 12px" }} onClick={() => setDetalle(null)}>X</button>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                      {[
                        ["Fecha", t.fecha || "-"],
                        ["Usuario", t.nombreUsuario || "-"],
                        ["Trabajo", t.trabajoRealizado || "-"],
                        ["Variedad", t.variedad || "-"],
                        ["Traslado", t.traslado || "-"],
                        ...(t.traslado === "Sí" ? [["De Tanque", t.deTanque || "-"], ["A Tanque", t.aTanque || "-"]] : [["Tanque", t.tanque || "-"]]),
                        ["Litros Tanque Final", t.litrosTanqueFinal ? `${Number(t.litrosTanqueFinal).toLocaleString()} L` : "-"],
                        ["Registrado", t.createdAt?.toDate?.()?.toLocaleString?.("es-BO") || "-"],
                      ].map(([k, v]) => (
                        <div key={k} style={{ background: "#1a1a1a", borderRadius: 8, padding: 10 }}>
                          <div style={{ fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 3 }}>{k}</div>
                          <div style={{ fontSize: 13, color: C.text }}>{v}</div>
                        </div>
                      ))}
                    </div>

                    {t.observaciones && (
                      <div style={{ background: "#1a1a1a", borderRadius: 8, padding: 12, fontSize: 13, color: C.textSub, marginBottom: 16 }}>
                        <b style={{ color: C.gold }}>Observaciones:</b> {t.observaciones}
                      </div>
                    )}

                    {(t.imagenes || []).length > 0 && (
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 11, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>Fotos</div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {t.imagenes.map((url, i) => (
                            <a key={i} href={url} target="_blank" rel="noreferrer">
                              <img src={url} alt="" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8, border: "1px solid #333" }} />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        )}

        <div style={card}>
          <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 14 }}>
            Mostrando <b style={{ color: C.gold }}>{filtrados.length}</b> de {trabajos.length} registros
          </div>
          {filtrados.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60, color: C.textMuted }}>
              <img src="/logo-cdz.png" alt="CDZ" style={{ width: 52, height: 52, marginBottom: 12, filter: "invert(1)", mixBlendMode: "screen" }} />
              <div>No hay registros que coincidan</div>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr>
                    {["Fecha", "Usuario", "Trabajo", "Variedad", "Tanque(s)", "Litros", "Obs.", "Fotos", ""].map(h => (
                      <th key={h} style={{ padding: "10px 12px", textAlign: "left", borderBottom: "1px solid #2a2a2a", color: C.textMuted, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.8, whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map(t => (
                    <tr key={t.id} style={{ cursor: "pointer", borderBottom: "1px solid #1a1a1a" }}
                      onClick={() => setDetalle(t)}
                      onMouseEnter={e => e.currentTarget.style.background = "#1a1a1a"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <td style={{ padding: "11px 12px", color: C.textMuted, whiteSpace: "nowrap", fontSize: 12 }}>{t.fecha || "-"}</td>
                      <td style={{ padding: "11px 12px", color: C.textSub, fontSize: 12, whiteSpace: "nowrap" }}>{t.nombreUsuario}</td>
                      <td style={{ padding: "11px 12px", color: C.text, fontWeight: 600, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.trabajoRealizado}</td>
                      <td style={{ padding: "11px 12px", color: C.textSub, fontSize: 12 }}>{t.variedad}</td>
                      <td style={{ padding: "11px 12px", color: C.gold, fontSize: 12, whiteSpace: "nowrap" }}>
                        {t.traslado === "Sí" ? `${t.deTanque} → ${t.aTanque}` : t.tanque || "-"}
                      </td>
                      <td style={{ padding: "11px 12px", color: C.gold, fontWeight: 700, whiteSpace: "nowrap" }}>
                        {t.litrosTanqueFinal ? `${Number(t.litrosTanqueFinal).toLocaleString()} L` : "-"}
                      </td>
                      <td style={{ padding: "11px 12px", color: C.textMuted, fontSize: 12, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {t.observaciones || "-"}
                      </td>
                      <td style={{ padding: "11px 12px", textAlign: "center" }}>
                        {(t.imagenes || []).length > 0 ? (
                          <span style={{ fontSize: 11, color: C.success, fontWeight: 700 }}>{(t.imagenes || []).length}</span>
                        ) : (
                          <span style={{ fontSize: 11, color: C.textMuted }}>-</span>
                        )}
                      </td>
                      <td style={{ padding: "11px 12px" }} onClick={e => e.stopPropagation()}>
                        <button style={{ ...btn("ghost"), padding: "5px 12px", fontSize: 12 }} onClick={() => setDetalle(t)}>Ver</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        try {
          const snap = await getDoc(doc(db, "users", u.uid));
          if (snap.exists()) {
            setUserRole(snap.data().role || "vendedor");
          } else {
            await setDoc(doc(db, "users", u.uid), { email: u.email, role: "vendedor", createdAt: serverTimestamp() });
            setUserRole("vendedor");
          }
        } catch { setUserRole("vendedor"); }
        setNombreUsuario(USUARIOS[u.email] || u.email);
      } else {
        setUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a0a" }}>
      <div style={{ color: "#C8962E", fontSize: 18, fontFamily: "Georgia, serif", display: "flex", alignItems: "center", gap: 8 }}><img src="/logo-cdz.png" alt="CDZ" style={{ width: 28, height: 28, filter: "invert(1)", mixBlendMode: "screen" }} /> Cargando...</div>
    </div>
  );

  if (!user) return <Login />;
  if (userRole === "admin") return <PanelAdmin user={user} role="admin" />;
  if (userRole === "comm") return <PanelAdmin user={user} role="comm" />;
  if (userRole === "finan") return <PanelAdmin user={user} role="finan" />;
  return <FormTrabajo user={user} nombreUsuario={nombreUsuario} />;
}
