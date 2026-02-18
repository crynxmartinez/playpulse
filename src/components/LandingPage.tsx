'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { 
  Sparkles, 
  BarChart3, 
  FileText, 
  Globe, 
  Camera,
  GitBranch,
  Users,
  Zap,
  ChevronRight,
  ArrowRight,
  Play,
  Star,
  TrendingUp,
  Shield,
  Gamepad2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import StarsBackground from '@/components/ui/stars-background'

// Animation hook for scroll reveal
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [])

  return { ref, isVisible }
}

// Animated counter component
function AnimatedCounter({ end, duration = 2000, suffix = '' }: { end: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const { ref, isVisible } = useScrollReveal()

  useEffect(() => {
    if (!isVisible) return

    let startTime: number
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)
      setCount(Math.floor(progress * end))
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    requestAnimationFrame(animate)
  }, [isVisible, end, duration])

  return <span ref={ref}>{count}{suffix}</span>
}

// Feature card component
function FeatureCard({ 
  icon: Icon, 
  title, 
  description, 
  delay = 0 
}: { 
  icon: React.ElementType
  title: string
  description: string
  delay?: number
}) {
  const { ref, isVisible } = useScrollReveal()

  return (
    <div 
      ref={ref}
      className={`group relative p-6 rounded-3xl bg-gradient-to-b from-white/5 to-transparent border border-white/10 hover:border-purple-500/50 transition-all duration-500 hover:transform hover:-translate-y-2 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative">
        <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center mb-4 group-hover:bg-purple-500/30 transition-colors">
          <Icon className="h-6 w-6 text-purple-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        <p className="text-white/60 text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

// Screenshot showcase component
function ScreenshotShowcase({ images }: { images: string[] }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const { ref, isVisible } = useScrollReveal()

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % images.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [images.length])

  return (
    <div 
      ref={ref}
      className={`relative transition-all duration-1000 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
      }`}
    >
      {/* Main screenshot */}
      <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-purple-500/20">
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent z-10 pointer-events-none" />
        <img 
          src={images[activeIndex]} 
          alt="PatchPlay Dashboard"
          className="w-full h-auto transition-opacity duration-500"
        />
      </div>

      {/* Thumbnail navigation */}
      <div className="flex justify-center gap-2 mt-6">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => setActiveIndex(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === activeIndex 
                ? 'bg-purple-500 w-8' 
                : 'bg-white/20 hover:bg-white/40'
            }`}
          />
        ))}
      </div>
    </div>
  )
}

// How it works step component
function HowItWorksStep({ 
  number, 
  title, 
  description, 
  delay = 0 
}: { 
  number: number
  title: string
  description: string
  delay?: number
}) {
  const { ref, isVisible } = useScrollReveal()

  return (
    <div 
      ref={ref}
      className={`flex gap-6 transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="flex-shrink-0">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-purple-500/30">
          {number}
        </div>
      </div>
      <div>
        <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
        <p className="text-white/60 leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

export default function LandingPage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const screenshots = [
    'https://storage.googleapis.com/msgsndr/xzA6eU8kOYmBuwFdr3CF/media/695e1cb4a0a4843791f719f7.png',
    'https://storage.googleapis.com/msgsndr/xzA6eU8kOYmBuwFdr3CF/media/695e1ca30597df34827e135a.png',
    'https://storage.googleapis.com/msgsndr/xzA6eU8kOYmBuwFdr3CF/media/695e1c7f0597dfac0c7e104c.png',
    'https://storage.googleapis.com/msgsndr/xzA6eU8kOYmBuwFdr3CF/media/695e1c68c9833034c3082581.png',
    'https://storage.googleapis.com/msgsndr/xzA6eU8kOYmBuwFdr3CF/media/695e1c510597df80107e0604.png',
    'https://storage.googleapis.com/msgsndr/xzA6eU8kOYmBuwFdr3CF/media/695e1c3fd461d4cd83cc764b.png',
    'https://storage.googleapis.com/msgsndr/xzA6eU8kOYmBuwFdr3CF/media/695e1c26c98330ed6b081f19.png',
    'https://storage.googleapis.com/msgsndr/xzA6eU8kOYmBuwFdr3CF/media/695e1c00d461d43bf0cc6eb1.png',
  ]

  const features = [
    {
      icon: FileText,
      title: 'Custom Feedback Forms',
      description: 'Create forms with game-specific stats like Fun Factor, Difficulty, Balance, and more. Tailored for game development.'
    },
    {
      icon: BarChart3,
      title: 'Real-time Analytics',
      description: 'Beautiful radar charts, bar charts, and category breakdowns. See exactly how players feel about your game.'
    },
    {
      icon: Globe,
      title: 'Public Game Pages',
      description: 'Auto-generated landing pages for your games. Share your development progress with the community.'
    },
    {
      icon: Camera,
      title: 'Snapshot History',
      description: 'Save chart states to track progress over time. Prove your game is improving with visual evidence.'
    },
    {
      icon: GitBranch,
      title: 'Version Tracking',
      description: 'Devlog and changelog system. Keep players updated on every iteration and improvement.'
    },
    {
      icon: Users,
      title: 'Community Building',
      description: 'Feedback threads, discussions, and voting. Build a community around your game during development.'
    },
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden">
      <StarsBackground starCount={150} />
      
      {/* Gradient orbs */}
      <div 
        className="fixed w-[600px] h-[600px] rounded-full bg-purple-600/20 blur-[120px] pointer-events-none transition-transform duration-1000 ease-out"
        style={{ 
          left: mousePosition.x - 300, 
          top: mousePosition.y - 300,
          transform: 'translate(-50%, -50%)'
        }}
      />
      <div className="fixed top-0 right-0 w-[800px] h-[800px] rounded-full bg-indigo-600/10 blur-[150px] pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[600px] h-[600px] rounded-full bg-purple-800/10 blur-[120px] pointer-events-none" />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-lg">PatchPlay</div>
              <div className="text-xs text-white/50">devlogs • playtests • proof</div>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-white/70 hover:text-white transition-colors">Features</a>
            <a href="#screenshots" className="text-sm text-white/70 hover:text-white transition-colors">Screenshots</a>
            <a href="#how-it-works" className="text-sm text-white/70 hover:text-white transition-colors">How it Works</a>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10 rounded-xl">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-purple-500/30">
                Get Started <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm mb-8 animate-fade-in">
              <Zap className="h-4 w-4" />
              Built for indie game developers
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">
                Turn Playtester Chaos
              </span>
              <br />
              <span className="bg-gradient-to-r from-purple-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Into Actionable Insights
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl text-white/60 mb-10 max-w-2xl mx-auto leading-relaxed">
              Collect structured feedback, visualize player sentiment with beautiful analytics, 
              and showcase your game's development journey — all in one platform.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link href="/register">
                <Button size="lg" className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-2xl px-8 py-6 text-lg shadow-xl shadow-purple-500/30 group">
                  Start Free <ChevronRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <a href="#screenshots">
                <Button size="lg" variant="outline" className="rounded-2xl px-8 py-6 text-lg border-white/20 text-white hover:bg-white/10 group">
                  <Play className="h-5 w-5 mr-2" /> See it in Action
                </Button>
              </a>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">
                  <AnimatedCounter end={100} suffix="%" />
                </div>
                <div className="text-sm text-white/50">Free to Start</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">
                  <AnimatedCounter end={5} suffix=" min" />
                </div>
                <div className="text-sm text-white/50">Setup Time</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">
                  <AnimatedCounter end={24} suffix="/7" />
                </div>
                <div className="text-sm text-white/50">Live Analytics</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Screenshots Section */}
      <section id="screenshots" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              See PatchPlay in Action
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              A powerful dashboard designed specifically for game developers. 
              Track feedback, analyze trends, and share your progress.
            </p>
          </div>

          <ScreenshotShowcase images={screenshots} />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm mb-6">
              <Star className="h-4 w-4" />
              Features
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Everything You Need to
              <br />
              <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                Level Up Your Playtests
              </span>
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              Stop cobbling together Google Forms, spreadsheets, and random websites. 
              PatchPlay gives you everything in one place.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <FeatureCard 
                key={feature.title}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                delay={index * 100}
              />
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm mb-6">
              <TrendingUp className="h-4 w-4" />
              How it Works
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              From Chaos to Clarity
              <br />
              <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                in 4 Simple Steps
              </span>
            </h2>
          </div>

          <div className="space-y-12">
            <HowItWorksStep 
              number={1}
              title="Create Your Game Project"
              description="Set up your game with a custom slug, banner, description, and all the details. Your public game page is automatically generated."
              delay={0}
            />
            <HowItWorksStep 
              number={2}
              title="Define Custom Stats"
              description="Create stats that matter for YOUR game — Fun Factor, Difficulty, Balance, UI Clarity, whatever you need. Organize them into categories."
              delay={100}
            />
            <HowItWorksStep 
              number={3}
              title="Share Feedback Forms"
              description="Generate shareable forms with your custom stats. Playtesters rate each stat on sliders. No more vague 'it was fun' feedback."
              delay={200}
            />
            <HowItWorksStep 
              number={4}
              title="Analyze & Improve"
              description="Watch your analytics update in real-time. See radar charts, category breakdowns, and trends. Save snapshots to track progress over time."
              delay={300}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-indigo-600/20" />
            <div className="absolute inset-0 bg-[#0a0a0f]/50" />
            
            {/* Content */}
            <div className="relative p-12 md:p-16 text-center">
              <Gamepad2 className="h-16 w-16 mx-auto mb-6 text-purple-400" />
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Level Up Your Playtests?
              </h2>
              <p className="text-white/60 mb-8 max-w-xl mx-auto">
                Join indie developers who are turning random feedback into actionable insights. 
                Start free, no credit card required.
              </p>
              <Link href="/register">
                <Button size="lg" className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-2xl px-10 py-6 text-lg shadow-xl shadow-purple-500/30">
                  Get Started Free <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="font-bold">PatchPlay</div>
                <div className="text-xs text-white/50">devlogs • playtests • proof</div>
              </div>
            </div>

            <div className="flex items-center gap-8 text-sm text-white/50">
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#screenshots" className="hover:text-white transition-colors">Screenshots</a>
              <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
            </div>

            <div className="text-sm text-white/40">
              © 2026 PatchPlay. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
