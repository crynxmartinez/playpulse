'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Sparkles, Mail, RefreshCw } from 'lucide-react'
import StarsBackground from '@/components/ui/stars-background'

function VerifyContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''
  
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  // Auto-submit when all digits entered
  useEffect(() => {
    if (code.every(digit => digit !== '') && !loading) {
      handleVerify()
    }
  }, [code])

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return // Only allow digits
    
    const newCode = [...code]
    newCode[index] = value.slice(-1) // Only take last character
    setCode(newCode)
    setError('')

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pastedData.length === 6) {
      setCode(pastedData.split(''))
      inputRefs.current[5]?.focus()
    }
  }

  const handleVerify = async () => {
    const fullCode = code.join('')
    if (fullCode.length !== 6) {
      setError('Please enter the complete 6-digit code')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: fullCode }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Verification failed')
        setCode(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (resendCooldown > 0 || resending) return

    setResending(true)
    setError('')

    try {
      const res = await fetch('/api/auth/resend-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to resend code')
        return
      }

      setResendCooldown(60) // 60 second cooldown
      setCode(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } catch {
      setError('Failed to resend code')
    } finally {
      setResending(false)
    }
  }

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] relative">
        <StarsBackground starCount={100} />
        <div className="text-center z-10">
          <p className="text-white/70 mb-4">No email provided</p>
          <Link href="/register" className="text-purple-400 hover:text-purple-300">
            Go to registration
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] relative">
      <StarsBackground starCount={100} />
      <Link 
        href="/register" 
        className="absolute top-6 left-6 z-20 flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all group"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium">Back</span>
      </Link>

      <div className="bg-[#0d0d15] backdrop-blur-lg rounded-2xl p-8 w-full max-w-md shadow-2xl border border-[#1a1a2e] relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-white mb-2">Verify your email</h1>
          <p className="text-white/60 text-sm">
            We sent a 6-digit code to
          </p>
          <p className="text-white font-medium flex items-center justify-center gap-2 mt-1">
            <Mail className="h-4 w-4 text-purple-400" />
            {email}
          </p>
        </div>

        <div className="space-y-6">
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm text-center">
              {error}
            </div>
          )}

          {/* Code input boxes */}
          <div className="flex justify-center gap-2">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={el => { inputRefs.current[index] = el }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                disabled={loading}
                className="w-12 h-14 text-center text-2xl font-bold bg-[#1a1a2e] border border-[#2a2a3e] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 transition-all"
                autoFocus={index === 0}
              />
            ))}
          </div>

          <button
            onClick={handleVerify}
            disabled={loading || code.some(d => !d)}
            className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Verifying...
              </span>
            ) : (
              'Verify Email'
            )}
          </button>

          <div className="text-center">
            <p className="text-white/50 text-sm mb-2">Didn't receive the code?</p>
            <button
              onClick={handleResend}
              disabled={resendCooldown > 0 || resending}
              className="text-purple-400 hover:text-purple-300 text-sm font-medium disabled:text-white/30 disabled:cursor-not-allowed transition-colors"
            >
              {resending ? (
                <span className="flex items-center justify-center gap-2">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  Sending...
                </span>
              ) : resendCooldown > 0 ? (
                `Resend code in ${resendCooldown}s`
              ) : (
                'Resend code'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] relative">
      <StarsBackground starCount={100} />
      <div className="text-center z-10">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <VerifyContent />
    </Suspense>
  )
}
