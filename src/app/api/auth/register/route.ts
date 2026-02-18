import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import { sendVerificationEmail, generateVerificationCode, getVerificationExpiry } from '@/lib/email'

// Cast to any to avoid type errors before prisma generate runs
const db = prisma as any

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    const existingUser = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      )
    }

    const hashedPassword = await hashPassword(password)
    const verificationCode = generateVerificationCode()
    const verificationExpiry = getVerificationExpiry()

    const user = await db.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name: name || null,
        role: 'USER',
        emailVerified: false,
        verificationCode,
        verificationExpiry,
      },
    })

    // Send verification email
    const emailResult = await sendVerificationEmail(user.email, verificationCode)
    
    if (!emailResult.success) {
      console.error('Failed to send verification email:', emailResult.error)
      // Still return success - user can request resend
    }

    return NextResponse.json({
      message: 'Registration successful. Please check your email for verification code.',
      email: user.email,
      requiresVerification: true,
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
