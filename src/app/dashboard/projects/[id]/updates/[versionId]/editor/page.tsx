import { redirect } from 'next/navigation'

export default async function OldEditorPage({
  params,
}: {
  params: Promise<{ id: string; versionId: string }>
}) {
  const { id, versionId } = await params
  redirect(`/editor/${id}/${versionId}`)
}
