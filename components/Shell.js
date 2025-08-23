export default function Shell({ children }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
        <div className="mx-auto max-w-4xl px-4 py-3 flex items-center justify-between">
          <div className="font-extrabold text-xl">
            <span className="text-blue-600">Pickle</span>
            <span className="text-emerald-600">Pal</span>
          </div>
          <nav className="text-sm">
            <a href="/" className="mr-4 hover:underline">Vote</a>
            <a href="/admin" className="hover:underline">Admin</a>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
      <footer className="mx-auto max-w-4xl px-4 py-8 text-xs text-slate-500">
        Built fast — we’ll connect Supabase/SendGrid next.
      </footer>
    </div>
  );
}
