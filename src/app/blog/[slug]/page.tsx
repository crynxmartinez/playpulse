import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Calendar, User, ArrowLeft, MessageSquare, Share2 } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import StarsBackground from '@/components/ui/stars-background'
import BlogComments from './BlogComments'
import ShareButtons from './ShareButtons'

const db = prisma as any

interface Props {
  params: Promise<{ slug: string }>
}

async function getPost(slug: string) {
  const post = await db.blogPost.findUnique({
    where: { slug },
    include: {
      author: {
        select: {
          displayName: true,
          name: true,
          avatarUrl: true,
        }
      },
      comments: {
        include: {
          author: {
            select: {
              id: true,
              displayName: true,
              name: true,
              avatarUrl: true,
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      }
    }
  })
  return post
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)
  
  if (!post || post.status !== 'PUBLISHED') {
    return { title: 'Post Not Found | PatchPlay' }
  }

  const title = post.metaTitle || post.title
  const description = post.metaDescription || post.excerpt || `Read ${post.title} on PatchPlay Blog`

  return {
    title: `${title} | PatchPlay Blog`,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime: post.publishedAt?.toISOString(),
      authors: [post.author.displayName || post.author.name],
      images: post.coverImage ? [post.coverImage] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: post.coverImage ? [post.coverImage] : [],
    },
  }
}

const CATEGORY_COLORS: Record<string, string> = {
  ANNOUNCEMENT: 'bg-red-500/20 text-red-400',
  GUIDES: 'bg-blue-500/20 text-blue-400',
  UPDATES: 'bg-green-500/20 text-green-400',
  DEV_BLOG: 'bg-purple-500/20 text-purple-400',
  TIPS: 'bg-yellow-500/20 text-yellow-400',
  COMMUNITY: 'bg-pink-500/20 text-pink-400',
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const post = await getPost(slug)

  if (!post || post.status !== 'PUBLISHED') {
    notFound()
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative">
      <StarsBackground starCount={100} />
      
      {/* Header */}
      <header className="relative z-10 border-b border-[#1a1a2e]">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
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
          </nav>
        </div>
      </header>

      <main className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        {/* Back link */}
        <Link 
          href="/blog" 
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Blog
        </Link>

        <article>
          {/* Cover Image */}
          {post.coverImage && (
            <div className="rounded-2xl overflow-hidden mb-8">
              <img 
                src={post.coverImage} 
                alt={post.title}
                className="w-full h-auto max-h-[400px] object-cover"
              />
            </div>
          )}

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${CATEGORY_COLORS[post.category] || 'bg-slate-500/20 text-slate-400'}`}>
              {post.category.replace('_', ' ')}
            </span>
            <span className="text-slate-500 flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {new Date(post.publishedAt).toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
              })}
            </span>
            <span className="text-slate-500 flex items-center gap-1">
              <User className="h-4 w-4" />
              {post.author.displayName || post.author.name}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-6">
            {post.title}
          </h1>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {post.tags.map((tag: string) => (
                <span 
                  key={tag} 
                  className="px-2 py-1 rounded-lg bg-[#1a1a2e] text-slate-400 text-xs"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Content */}
          <div 
            className="prose prose-invert prose-purple max-w-none mb-12"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Share Buttons */}
          <div className="border-t border-[#1a1a2e] pt-8 mb-12">
            <div className="flex items-center gap-4">
              <span className="text-slate-400 flex items-center gap-2">
                <Share2 className="h-4 w-4" />
                Share this post:
              </span>
              <ShareButtons 
                title={post.title} 
                slug={post.slug} 
              />
            </div>
          </div>

          {/* Comments */}
          <div className="border-t border-[#1a1a2e] pt-8">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-purple-400" />
              Comments ({post.comments.length})
            </h2>
            <BlogComments 
              slug={post.slug} 
              initialComments={post.comments} 
            />
          </div>
        </article>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[#1a1a2e] py-8">
        <div className="max-w-4xl mx-auto px-4 text-center text-slate-500 text-sm">
          © {new Date().getFullYear()} PatchPlay. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
