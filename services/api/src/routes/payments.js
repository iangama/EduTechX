import express from "express";
import { prisma } from "../lib.js";
import { requireAuth } from "../lib.js";
const router = express.Router();

router.post("/start", requireAuth, async (req,res)=>{
  const { enrollmentId } = req.body || {};
  if(!enrollmentId) return res.status(400).json({ error:"enrollmentId required" });
  const enr = await prisma.enrollment.findUnique({ where:{ id:enrollmentId } });
  if(!enr || enr.userId !== req.session.user.id) return res.status(404).json({ error:"enrollment not found" });
  const course = await prisma.course.findUnique({ where:{ id: enr.courseId } });
  const payment = await prisma.payment.create({
    data:{ userId:req.session.user.id, enrollmentId:enr.id, amountCents: course?.priceCents || 0, status:"STARTED", providerRef:"mock-"+Date.now() }
  });
  res.status(201).json(payment);
});

router.post("/approve", requireAuth, async (req,res)=>{
  const { paymentId } = req.body || {};
  if(!paymentId) return res.status(400).json({ error:"paymentId required" });
  const pay = await prisma.payment.update({ where:{ id:paymentId }, data:{ status:"APPROVED" } });
  await prisma.enrollment.update({ where:{ id:pay.enrollmentId }, data:{ status:"ACTIVE" } });
  res.json({ ok:true, payment:pay });
});

export default router;
