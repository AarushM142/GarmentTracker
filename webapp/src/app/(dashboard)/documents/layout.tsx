// This layout intentionally renders nothing extra so the document
// pages can use their own standalone HTML shell (for clean A4 print).
// The dashboard sidebar/nav is deliberately excluded from print pages.

export default function DocumentsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
