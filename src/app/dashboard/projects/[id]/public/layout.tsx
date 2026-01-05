export default function GamePageLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // This layout bypasses the parent project layout's ProjectHeader and ProjectLayoutNav
  // The GamePageWrapper component handles its own TopBar with the toggle
  return <>{children}</>
}
