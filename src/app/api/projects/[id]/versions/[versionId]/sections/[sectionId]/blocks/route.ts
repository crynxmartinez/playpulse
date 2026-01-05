import { NextResponse } from 'next/server'

// DEPRECATED: This API is no longer used. VersionBlock model was replaced with VersionPage JSON content.

export async function GET() {
  return NextResponse.json({ error: 'This API is deprecated' }, { status: 410 })
}

export async function POST() {
  return NextResponse.json({ error: 'This API is deprecated' }, { status: 410 })
}
