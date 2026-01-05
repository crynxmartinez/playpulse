export default function EditorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // This layout bypasses the parent dashboard layout
  // The editor page handles its own full-page UI
  return <>{children}</>
}
