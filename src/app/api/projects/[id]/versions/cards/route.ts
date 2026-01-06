import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface ChangeCard {
  id: string
  title: string
  subtitle: string
  icon: string
  changes: Array<{ type: string; text: string }>
}

interface VersionWithCards {
  id: string
  version: string
  title: string
  cards: ChangeCard[]
}

// GET /api/projects/[id]/versions/cards - Get all versions with their change cards
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Get all versions with their page content
    const versions = await prisma.projectVersion.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        page: true,
      },
    })

    // Extract change-cards from each version's page content
    const versionsWithCards: VersionWithCards[] = versions.map((version) => {
      const cards: ChangeCard[] = []
      
      if (version.page?.content) {
        const content = version.page.content as { rows?: Array<{ columns?: Array<{ elements?: Array<{ id: string; type: string; data: Record<string, unknown> }> }> }> }
        
        // Traverse rows -> columns -> elements to find change-cards
        if (content.rows) {
          for (const row of content.rows) {
            if (row.columns) {
              for (const col of row.columns) {
                if (col.elements) {
                  for (const element of col.elements) {
                    if (element.type === 'change-card') {
                      cards.push({
                        id: element.id,
                        title: (element.data.title as string) || 'Untitled',
                        subtitle: (element.data.subtitle as string) || '',
                        icon: (element.data.icon as string) || '',
                        changes: (element.data.changes as Array<{ type: string; text: string }>) || [],
                      })
                    }
                  }
                }
              }
            }
          }
        }
      }
      
      return {
        id: version.id,
        version: version.version,
        title: version.title,
        cards,
      }
    })

    return NextResponse.json({ versions: versionsWithCards })
  } catch (error) {
    console.error('Failed to fetch version cards:', error)
    return NextResponse.json(
      { error: 'Failed to fetch version cards' },
      { status: 500 }
    )
  }
}
