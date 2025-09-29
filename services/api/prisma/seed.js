import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();
async function main(){
  const admin = await prisma.user.upsert({
    where:{ email:"admin@example.com" },
    update:{},
    create:{ email:"admin@example.com", name:"Admin", role:"ADMIN", password:bcrypt.hashSync("123456",10) }
  });
  const inst = await prisma.user.upsert({
    where:{ email:"instructor@example.com" },
    update:{},
    create:{ email:"instructor@example.com", name:"Prof. Ada", role:"INSTRUCTOR", password:bcrypt.hashSync("123456",10) }
  });
  await prisma.course.create({
    data:{
      title:"Node.js do Zero ao Avançado",
      description:"Curso completo de Node, Express e padrões.",
      priceCents:9900, published:true, instructorId:inst.id,
      lessons:{ create:[ {title:"Introdução",content:"Bem-vindo!",order:1}, {title:"HTTP",content:"Requisições e respostas",order:2} ] }
    }
  });
  console.log("Seed ok:", admin.email, inst.email);
}
main().catch(e=>{console.error(e);process.exit(1)}).finally(async()=> prisma.$disconnect());
