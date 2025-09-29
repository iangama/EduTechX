import express from "express";
import { prisma, hashPassword, verifyPassword } from "../lib.js";
import { z } from "zod";
const router = express.Router();

router.post("/register", async (req, res) => {
  const schema = z.object({ email:z.string().email(), password:z.string().min(6), name:z.string().min(2), role:z.enum(["STUDENT","INSTRUCTOR","ADMIN"]).optional() });
  const parsed = schema.safeParse(req.body);
  if(!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { email,password,name,role } = parsed.data;
  const exists = await prisma.user.findUnique({ where: { email } });
  if(exists) return res.status(409).json({ error: "email in use" });
  const user = await prisma.user.create({ data:{ email,name,role:role||"STUDENT", password: await hashPassword(password) }, select:{ id:true,email:true,name:true,role:true } });
  req.session.user = user;
  res.json({ user });
});

router.post("/login", async (req, res) => {
  const schema = z.object({ email:z.string().email(), password:z.string().min(6) });
  const parsed = schema.safeParse(req.body);
  if(!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { email,password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if(!user || !(await verifyPassword(password, user.password))) return res.status(401).json({ error:"invalid credentials" });
  const safe = { id:user.id, email:user.email, name:user.name, role:user.role };
  req.session.user = safe;
  res.json({ user: safe });
});

router.get("/me", (req,res)=> res.json({ user: req.session?.user || null }));
router.post("/logout", (req,res)=> req.session.destroy(()=> res.json({ ok:true })));
export default router;
