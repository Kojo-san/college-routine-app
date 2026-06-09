import Image from 'next/image'

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen overflow-hidden flex">
      {/* ── Left zone (form) ────────────────────────────────────────────── */}
      <div
        className="auth-left-panel relative z-10 flex flex-col justify-center
                   px-10 md:px-16 w-full md:w-[45%] shrink-0"
        style={{
          background:
            'linear-gradient(to right, #000000 0%, #000000 55%, #1a0a2e 80%, transparent 100%)',
        }}
      >


        {/* Form content */}
        <div className="w-full" style={{ maxWidth: '380px' }}>
          {children}
        </div>
      </div>

      {/* ── Right zone (visual) — hidden below md ───────────────────────── */}
      <div
        className="hidden md:block relative flex-1 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #4E2A84 0%, #C9006B 55%, #FF7043 100%)',
        }}
      >
        {/* Left-side black fade — blends the two zones together */}
        <div
          className="absolute inset-y-0 left-0 z-10 pointer-events-none"
          style={{
            width: '180px',
            background: 'linear-gradient(to right, #000000, transparent)',
          }}
        />

        {/* Bear — top at 5%, fills remaining height */}
        <div className="absolute inset-x-0 z-0" style={{ top: '5%', height: '95%' }}>
          <Image
            src="/assets/bear_no_background.PNG"
            alt="College Routine"
            fill
            className="object-contain object-top"
            priority
          />
        </div>
      </div>
    </div>
  )
}
