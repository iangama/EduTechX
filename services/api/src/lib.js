import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
export const prisma = new PrismaClient();
export async function hashPassword(pw){ return bcrypt.hash(pw,10); }
export async function verifyPassword(pw,hash){ return bcrypt.compare(pw,hash); }
export function requireAuth(req,res,next){ if(!req.session?.user) return res.status(401).json({error:"unauthorized"}); next(); }
export function requireRole(...roles){ return (req,res,next)=>{ if(!req.session?.user) return res.status(401).json({error:"unauthorized"}); if(!roles.includes(req.session.user.role)) return res.status(403).json({error:"forbidden"}); next(); }; }
