import 'dotenv/config'
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

async function main() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set')
  }
  
  const adapter = new PrismaPg({ connectionString })
  const prisma = new PrismaClient({ adapter })

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10)
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@playpulse.com' },
    update: {
      password: hashedPassword,
      role: 'ADMIN',
    },
    create: {
      email: 'admin@playpulse.com',
      password: hashedPassword,
      name: 'Admin',
      role: 'ADMIN',
    },
  })

  console.log('Admin user created/updated:', admin.email)
  
  await prisma.$disconnect()
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
