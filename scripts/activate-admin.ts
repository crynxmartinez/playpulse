import 'dotenv/config'
import { prisma } from '../src/lib/prisma'

async function main() {
  const user = await (prisma as any).user.update({
    where: { email: 'admin@playpulse.com' },
    data: { emailVerified: true }
  })
  console.log('Activated:', user.email)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
