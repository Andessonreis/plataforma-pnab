// Layout compartilhado pelas páginas públicas (header + footer)
// Implementar Header e Footer como componentes em src/components/layout/

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* <Header /> */}
      <main className="flex-1">{children}</main>
      {/* <Footer /> */}
    </div>
  )
}
