import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'
import crypto from 'crypto'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const user = await (prisma as any).user.findUnique({ where: { email } })

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ success: true })
    }

    // Invalidate any existing tokens
    await (prisma as any).passwordResetToken.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true }
    })

    // Create new token (expires in 1 hour)
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

    await (prisma as any).passwordResetToken.create({
      data: { token, userId: user.id, expiresAt }
    })

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.patchplay.live'}/reset-password?token=${token}`

    await resend.emails.send({
      from: 'PatchPlay <noreply@patchplay.live>',
      to: email,
      subject: 'Reset your PatchPlay password',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; background: #0a0a0f; color: #fff; padding: 32px; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <div style="display: inline-block; background: linear-gradient(135deg, #8b5cf6, #6366f1); border-radius: 12px; padding: 12px; margin-bottom: 16px;">
              <span style="font-size: 24px;">✨</span>
            </div>
            <h1 style="font-size: 24px; font-weight: bold; margin: 0;">PatchPlay</h1>
          </div>
          <h2 style="font-size: 20px; margin-bottom: 8px;">Reset your password</h2>
          <p style="color: #94a3b8; margin-bottom: 24px;">
            We received a request to reset your password. Click the button below to choose a new one.
            This link expires in <strong style="color: #fff;">1 hour</strong>.
          </p>
          <a href="${resetUrl}" style="display: block; text-align: center; background: linear-gradient(135deg, #8b5cf6, #6366f1); color: #fff; padding: 14px 24px; border-radius: 12px; text-decoration: none; font-weight: 600; margin-bottom: 24px;">
            Reset Password
          </a>
          <p style="color: #64748b; font-size: 13px; text-align: center;">
            If you didn't request this, you can safely ignore this email.
          </p>
        </div>
      `
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ error: 'Failed to send reset email' }, { status: 500 })
  }
}
