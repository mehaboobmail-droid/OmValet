export const metadata = { title: "Retrieve Your Car" };

/** Public, mobile-first guest area — no staff chrome, no auth. */
export default function GuestLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-edge bg-obsidian/95 py-4 text-center backdrop-blur-md">
        <div className="font-serif text-lg font-light uppercase tracking-[0.35em] text-gold">
          Valet
        </div>
        <div className="mt-0.5 text-[9px] uppercase tracking-[0.22em] text-ink-dim">
          Car Retrieval Portal
        </div>
      </header>
      {children}
    </div>
  );
}
