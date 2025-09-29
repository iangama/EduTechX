import express from "express";
import { prisma } from "../lib.js";
import { requireRole } from "../lib.js";
import { z } from "zod";
const router = express.Router();

router.get("/", async (_req,res) => {
  const items = await prisma.course.findMany({
    where:{ published:true },
    select:{ id:true,title:true,description:true,priceCents:true, instructor:{ select:{ id:true,name:true } } }
  });
  res.json(items);
});

router.post("/", requireRole("INSTRUCTOR","ADMIN"), async (req,res)=>{
  const schema = z.object({ title:z.string().min(3), description:z.string().min(5), priceCents:z.number().int().nonnegative().default(0), published:z.boolean().default(false) });
  const parsed = schema.safeParse(req.body);
  if(!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const course = await prisma.course.create({ data:{ ...parsed.data, instructorId: req.session.user.id } });
  res.status(201).json(course);
});

router.get("/:id", async (req,res)=>{
  const course = await prisma.course.findUnique({ where:{ id:req.params.id }, include:{ lessons:true, instructor:{ select:{ id:true,name:true } } } });
  if(!course || !course.published) return res.status(404).json({ error:"not found" });
  res.json(course);
});

router.post("/:id/lessons", requireRole("INSTRUCTOR","ADMIN"), async (req,res)=>{
  const schema = z.object({ title:z.string().min(3), content:z.string().min(1), order:z.number().int().min(1) });
  const parsed = schema.safeParse(req.body);
  if(!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const c = await prisma.course.findUnique({ where:{ id:req.params.id } });
  if(!c) return res.status(404).json({ error:"course not found" });
  if(c.instructorId !== req.session.user.id && req.session.user.role !== "ADMIN") return res.status(403).json({ error:"forbidden" });
  const lesson = await prisma.lesson.create({ data:{ ...parsed.data, courseId:c.id } });
  res.status(201).json(lesson);
});

export default router;
