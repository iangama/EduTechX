import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
const api = (path, opts={}) => fetch(import.meta.env.VITE_API_BASE + path, { credentials:"include", headers:{"Content-Type":"application/json"}, ...opts });

function Login({ onLogin }) {
  const [email,setEmail] = useState("admin@example.com");
  const [password,setPassword] = useState("123456");
  const [error,setError] = useState("");
  const submit = async (e)=>{ e.preventDefault(); setError(""); const r = await api("/auth/login",{ method:"POST", body: JSON.stringify({ email,password }) }); if(r.ok) onLogin(await r.json()); else setError("Credenciais inválidas"); };
  return (
    <form onSubmit={submit} style={{ display:"grid", gap:8, maxWidth:320 }}>
      <h2>Entrar</h2>
      <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="email"/>
      <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="senha"/>
      <button>Login</button>
      {error && <small style={{color:"crimson"}}>{error}</small>}
    </form>
  );
}

function Courses() {
  const [courses,setCourses] = useState([]);
  const [me,setMe] = useState(null);
  useEffect(()=>{ (async()=>{ const r1=await api("/auth/me"); const j1=await r1.json(); setMe(j1.user); const r2=await api("/courses"); const j2=await r2.json(); setCourses(j2); })(); },[]);
  const enroll = async (id)=>{
    const r = await api("/enrollments",{ method:"POST", body: JSON.stringify({ courseId:id }) });
    if(!r.ok){ alert("falhou"); return; }
    const enr = await r.json();
    const p = await api("/payments/start",{ method:"POST", body: JSON.stringify({ enrollmentId: enr.id }) });
    const pj = await p.json();
    await api("/payments/approve",{ method:"POST", body: JSON.stringify({ paymentId: pj.id }) });
    alert("Inscrição ativa!");
  };
  if(!me) return <p>Faça login para ver os cursos.</p>;
  return (
    <div>
      <h2>Cursos publicados</h2>
      <ul>
        {courses.map(c=>(
          <li key={c.id}><b>{c.title}</b> — R$ {(c.priceCents/100).toFixed(2)} — Instrutor: {c.instructor?.name}
            <button style={{marginLeft:8}} onClick={()=>enroll(c.id)}>Inscrever</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function App(){ const [user,setUser]=useState(null); return (<div style={{padding:24,display:"grid",gap:16}}><h1>EduTechX</h1>{user?<p>Bem-vindo(a)!</p>:null}{user?<Courses/>:<Login onLogin={setUser}/>}</div>); }
createRoot(document.getElementById("root")).render(<App />);
