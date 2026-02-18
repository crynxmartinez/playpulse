import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendVerificationEmail, generateVerificationCode, getVerificationExpiry } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if ((user as any).emailVerified) {
      return NextResponse.json(
        { error: 'Email already verified' },
        { status: 400 }
      )
    }

    // Generate new code
    const verificationCode = generateVerificationCode()
    const verificationExpiry = getVerificationExpiry()

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationCode,
        verificationExpiry,
      } as any,
    })

    // Send verification email
    const emailResult = await sendVerificationEmail(user.email, verificationCode)
    
    if (!emailResult.success) {
      return NextResponse.json(
        { error: 'Failed to send verification email. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Verification code sent successfully',
    })
  } catch (error) {
    console.error('Resend code error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
