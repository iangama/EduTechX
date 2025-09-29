import express from "express";
import { prisma } from "../lib.js";
import { requireAuth } from "../lib.js";
const router = express.Router();

router.post("/", requireAuth, async (req,res)=>{
  const { courseId } = req.body || {};
  if(!courseId) return res.status(400).json({ error:"courseId required" });
  const course = await prisma.course.findUnique({ where:{ id:courseId } });
  if(!course || !course.published) return res.status(404).json({ error:"course not found" });
  const enrollment = await prisma.enrollment.upsert({
    where:{ userId_courseId:{ userId:req.session.user.id, courseId } },
    update:{},
    create:{ userId:req.session.user.id, courseId, status:"PENDING" },
    include:{ course:true }
  });
  res.status(201).json(enrollment);
});

router.get("/mine", requireAuth, async (req,res)=>{
  const items = await prisma.enrollment.findMany({ where:{ userId:req.session.user.id, status:"ACTIVE" }, include:{ course:{ select:{ id:true,title:true } } } });
  res.json(items);
});

export default router;
