import { Metadata } from 'next'
import Link from 'next/link'
import { FileText, Calendar, User, MessageSquare, ArrowRight } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import StarsBackground from '@/components/ui/stars-background'

export const metadata: Metadata = {
  title: 'Blog | PatchPlay',
  description: 'News, updates, guides, and insights from the PatchPlay team.',
  openGraph: {
    title: 'Blog | PatchPlay',
    description: 'News, updates, guides, and insights from the PatchPlay team.',
    type: 'website',
  },
}

const CATEGORY_COLORS: Record<string, string> = {
  ANNOUNCEMENT: 'bg-red-500/20 text-red-400',
  GUIDES: 'bg-blue-500/20 text-blue-400',
  UPDATES: 'bg-green-500/20 text-green-400',
  DEV_BLOG: 'bg-purple-500/20 text-purple-400',
  TIPS: 'bg-yellow-500/20 text-yellow-400',
  COMMUNITY: 'bg-pink-500/20 text-pink-400',
}

async function getPosts() {
  const db = prisma as any
  const posts = await db.blogPost.findMany({
    where: { status: 'PUBLISHED' },
    include: {
      author: {
        select: {
          displayName: true,
          name: true,
          avatarUrl: true,
        }
      },
      _count: {
        select: { comments: true }
      }
    },
    orderBy: { publishedAt: 'desc' }
  })
  return posts
}

export default async function BlogPage() {
  const posts = await getPosts()
  const featuredPost = posts[0]
  const otherPosts = posts.slice(1)

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative">
      <StarsBackground starCount={100} />
      
      {/* Header */}
      <header className="relative z-10 border-b border-[#1a1a2e]">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="text-white font-semibold">PatchPlay</span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/" className="text-slate-400 hover:text-white transition-colors">
              Home
            </Link>
            <Link href="/blog" className="text-white font-medium">
              Blog
            </Link>
            <Link href="/login" className="text-slate-400 hover:text-white transition-colors">
              Login
            </Link>
            <Link 
              href="/register" 
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-4 py-12">
        {/* Page Title */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">PatchPlay Blog</h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            News, updates, guides, and insights from the PatchPlay team
          </p>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-20">
            <FileText className="h-16 w-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">No blog posts yet</p>
            <p className="text-slate-500">Check back soon for updates!</p>
          </div>
        ) : (
          <>
            {/* Featured Post */}
            {featuredPost && (
              <Link href={`/blog/${featuredPost.slug}`} className="block mb-12 group">
                <article className="rounded-3xl bg-[#0d0d15] border border-[#1a1a2e] overflow-hidden hover:border-purple-500/30 transition-colors">
                  <div className="grid md:grid-cols-2 gap-6">
                    {featuredPost.coverImage ? (
                      <div className="aspect-video md:aspect-auto md:h-full">
                        <img 
                          src={featuredPost.coverImage} 
                          alt={featuredPost.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="aspect-video md:aspect-auto md:h-full bg-gradient-to-br from-purple-600/20 to-blue-600/20 flex items-center justify-center">
                        <FileText className="h-20 w-20 text-purple-400/50" />
                      </div>
                    )}
                    <div className="p-8 flex flex-col justify-center">
                      <div className="flex items-center gap-3 mb-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${CATEGORY_COLORS[featuredPost.category] || 'bg-slate-500/20 text-slate-400'}`}>
                          {featuredPost.category.replace('_', ' ')}
                        </span>
                        <span className="text-slate-500 text-sm flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(featuredPost.publishedAt).toLocaleDateString('en-US', { 
                            month: 'long', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </span>
                      </div>
                      <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 group-hover:text-purple-400 transition-colors">
                        {featuredPost.title}
                      </h2>
                      {featuredPost.excerpt && (
                        <p className="text-slate-400 mb-6 line-clamp-3">
                          {featuredPost.excerpt}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <User className="h-4 w-4" />
                          {featuredPost.author.displayName || featuredPost.author.name}
                        </div>
                        <span className="text-purple-400 flex items-center gap-1 text-sm font-medium group-hover:gap-2 transition-all">
                          Read more <ArrowRight className="h-4 w-4" />
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              </Link>
            )}

            {/* Other Posts Grid */}
            {otherPosts.length > 0 && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {otherPosts.map((post: any) => (
                  <Link key={post.id} href={`/blog/${post.slug}`} className="group">
                    <article className="rounded-2xl bg-[#0d0d15] border border-[#1a1a2e] overflow-hidden hover:border-purple-500/30 transition-colors h-full flex flex-col">
                      {post.coverImage ? (
                        <div className="aspect-video">
                          <img 
                            src={post.coverImage} 
                            alt={post.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="aspect-video bg-gradient-to-br from-purple-600/10 to-blue-600/10 flex items-center justify-center">
                          <FileText className="h-12 w-12 text-purple-400/30" />
                        </div>
                      )}
                      <div className="p-5 flex-1 flex flex-col">
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[post.category] || 'bg-slate-500/20 text-slate-400'}`}>
                            {post.category.replace('_', ' ')}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-purple-400 transition-colors line-clamp-2">
                          {post.title}
                        </h3>
                        {post.excerpt && (
                          <p className="text-slate-400 text-sm mb-4 line-clamp-2 flex-1">
                            {post.excerpt}
                          </p>
                        )}
                        <div className="flex items-center justify-between text-xs text-slate-500 mt-auto">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(post.publishedAt).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {post._count.comments}
                          </span>
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[#1a1a2e] py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-slate-500 text-sm">
          © {new Date().getFullYear()} PatchPlay. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
