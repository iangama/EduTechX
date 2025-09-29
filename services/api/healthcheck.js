import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
try { await prisma.$queryRaw`SELECT 1`; console.log("ok"); process.exit(0); }
catch(e){ console.error(e); process.exit(1); }
