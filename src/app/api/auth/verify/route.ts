import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateToken } from '@/lib/auth'
import { cookies } from 'next/headers'

// Cast to any to avoid type errors before prisma generate runs
const db = prisma as any

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json()

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email and code are required' },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { error: 'Email already verified' },
        { status: 400 }
      )
    }

    if (!user.verificationCode || !user.verificationExpiry) {
      return NextResponse.json(
        { error: 'No verification code found. Please request a new one.' },
        { status: 400 }
      )
    }

    if (new Date() > user.verificationExpiry) {
      return NextResponse.json(
        { error: 'Verification code has expired. Please request a new one.' },
        { status: 400 }
      )
    }

    if (user.verificationCode !== code) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      )
    }

    // Mark email as verified and clear the code
    await db.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationCode: null,
        verificationExpiry: null,
      },
    })

    // Generate token and log user in
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    const cookieStore = await cookies()
    cookieStore.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    return NextResponse.json({
      message: 'Email verified successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    })
  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
