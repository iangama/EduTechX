import assert from "node:assert";
const base = process.env.SMOKE_BASE || "http://localhost";
const fetchJson = async (url, opts={}) => {
  const res = await fetch(url, { ...opts, headers:{ "Content-Type":"application/json", ...(opts.headers||{}) }, redirect:"manual" });
  const json = await res.json().catch(()=> ({}));
  return { status: res.status, json, headers: res.headers };
};
(async () => {
  let r = await fetchJson(`${base}/api/health`); assert.equal(r.status,200);
  r = await fetchJson(`${base}/api/auth/login`, { method:"POST", body: JSON.stringify({ email:"admin@example.com", password:"123456" }), credentials:"include" });
  assert.equal(r.status,200);
  const cookie = r.headers.get("set-cookie"); assert(cookie);
  const meRes = await fetch(`${base}/api/auth/me`, { headers: { cookie } }); const me = await meRes.json();
  assert(me.user?.email === "admin@example.com");
  console.log("SMOKE OK");
})().catch(e=>{ console.error("SMOKE FAIL",e); process.exit(1); });
