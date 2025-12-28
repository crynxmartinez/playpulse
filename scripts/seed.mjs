import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  const adminPassword = await bcrypt.hash('admin123', 12)
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@playpulse.com' },
    update: {},
    create: {
      email: 'admin@playpulse.com',
      password: adminPassword,
      name: 'Admin',
      role: 'ADMIN',
    },
  })

  console.log('Created admin user:', admin.email)
  console.log('Seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
