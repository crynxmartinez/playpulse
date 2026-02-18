import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// One-time endpoint to activate admin account
// DELETE THIS FILE AFTER USE
export async function POST(request: Request) {
  try {
    const { email, secret, makeAdmin } = await request.json()
    
    // Simple secret to prevent random access
    if (secret !== 'activate-admin-2026') {
      return NextResponse.json({ error: 'Invalid secret' }, { status: 403 })
    }

    const updateData: any = { emailVerified: true }
    if (makeAdmin) {
      updateData.role = 'ADMIN'
    }

    const user = await (prisma as any).user.update({
      where: { email },
      data: updateData
    })

    return NextResponse.json({ 
      message: makeAdmin ? 'Account activated as ADMIN' : 'Account activated',
      email: user.email,
      role: user.role
    })
  } catch (error) {
    console.error('Activation error:', error)
    return NextResponse.json({ error: 'Failed to activate' }, { status: 500 })
  }
}
