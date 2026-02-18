'use client'

import { useState } from 'react'
import { Twitter, Facebook, Linkedin, Link as LinkIcon, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ShareButtonsProps {
  title: string
  slug: string
}

export default function ShareButtons({ title, slug }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false)
  
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://patchplay.live'
  const url = `${baseUrl}/blog/${slug}`
  const encodedUrl = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <a
        href={shareLinks.twitter}
        target="_blank"
        rel="noopener noreferrer"
        className="w-9 h-9 rounded-lg bg-[#1a1a2e] hover:bg-[#1DA1F2]/20 flex items-center justify-center text-slate-400 hover:text-[#1DA1F2] transition-colors"
        title="Share on Twitter"
      >
        <Twitter className="h-4 w-4" />
      </a>
      <a
        href={shareLinks.facebook}
        target="_blank"
        rel="noopener noreferrer"
        className="w-9 h-9 rounded-lg bg-[#1a1a2e] hover:bg-[#4267B2]/20 flex items-center justify-center text-slate-400 hover:text-[#4267B2] transition-colors"
        title="Share on Facebook"
      >
        <Facebook className="h-4 w-4" />
      </a>
      <a
        href={shareLinks.linkedin}
        target="_blank"
        rel="noopener noreferrer"
        className="w-9 h-9 rounded-lg bg-[#1a1a2e] hover:bg-[#0A66C2]/20 flex items-center justify-center text-slate-400 hover:text-[#0A66C2] transition-colors"
        title="Share on LinkedIn"
      >
        <Linkedin className="h-4 w-4" />
      </a>
      <button
        onClick={copyLink}
        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
          copied 
            ? 'bg-green-500/20 text-green-400' 
            : 'bg-[#1a1a2e] hover:bg-purple-500/20 text-slate-400 hover:text-purple-400'
        }`}
        title={copied ? 'Copied!' : 'Copy link'}
      >
        {copied ? <Check className="h-4 w-4" /> : <LinkIcon className="h-4 w-4" />}
      </button>
    </div>
  )
}
