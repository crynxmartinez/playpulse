import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendVerificationEmail(email: string, code: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'PatchPlay <noreply@patchplay.live>',
      to: email,
      subject: 'Verify your PatchPlay account',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0f; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table width="100%" max-width="480" cellpadding="0" cellspacing="0" style="background-color: #0d0d15; border-radius: 16px; border: 1px solid #2a2a3e; overflow: hidden;">
                    <!-- Header -->
                    <tr>
                      <td style="padding: 32px 32px 24px; text-align: center;">
                        <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #8b5cf6, #6366f1); border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                          <span style="font-size: 24px;">✨</span>
                        </div>
                        <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">Verify your email</h1>
                        <p style="margin: 8px 0 0; color: #94a3b8; font-size: 14px;">Enter this code to complete your registration</p>
                      </td>
                    </tr>
                    
                    <!-- Code -->
                    <tr>
                      <td style="padding: 0 32px 32px; text-align: center;">
                        <div style="background-color: #1a1a2e; border-radius: 12px; padding: 24px; border: 1px solid #2a2a3e;">
                          <div style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #8b5cf6; font-family: monospace;">
                            ${code}
                          </div>
                        </div>
                        <p style="margin: 16px 0 0; color: #64748b; font-size: 12px;">
                          This code expires in 15 minutes
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 24px 32px; background-color: #1a1a2e; border-top: 1px solid #2a2a3e;">
                        <p style="margin: 0; color: #64748b; font-size: 12px; text-align: center;">
                          If you didn't create an account on PatchPlay, you can safely ignore this email.
                        </p>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Brand footer -->
                  <p style="margin: 24px 0 0; color: #475569; font-size: 12px;">
                    PatchPlay • devlogs • playtests • proof
                  </p>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    })

    if (error) {
      console.error('Failed to send verification email:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Email send error:', error)
    return { success: false, error: 'Failed to send email' }
  }
}

export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export function getVerificationExpiry(): Date {
  return new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
}
