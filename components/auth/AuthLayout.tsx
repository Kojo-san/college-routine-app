import Image from 'next/image'

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — form */}
      <div className="flex-1 bg-black flex items-center justify-center p-8">
        <div className="w-full" style={{ maxWidth: '420px' }}>
          {children}
        </div>
      </div>

      {/* Right panel — visual, hidden below md */}
      <div
        className="hidden md:block flex-1 relative overflow-hidden"
        style={{
          background:
            'linear-gradient(135deg, #4E2A84 0%, #C9006B 52%, #FF7043 100%)',
          minWidth: '50%',
          maxWidth: '50%',
        }}
      >
        {/* COLLEGE ROUTINE */}
        <div className="absolute inset-x-0 top-[8%] z-10 flex justify-center px-6 text-center">
          <h1
            style={{
              fontFamily: "'Syne', Georgia, Impact, serif",
              fontWeight: 900,
              fontSize: 'clamp(2.5rem, 4.5vw, 4rem)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#ffffff',
              textShadow: '2px 2px 0px rgba(0,0,0,0.4)',
              lineHeight: 1.1,
            }}
          >
            COLLEGE
            <br />
            ROUTINE
          </h1>
        </div>

        {/* Bear — lower 70% of panel */}
        <div className="absolute inset-x-0 bottom-0" style={{ height: '72%' }}>
          <Image
            src="/assets/bear_no_background.PNG"
            alt="College Routine Bear"
            fill
            className="object-contain object-bottom"
            priority
          />
        </div>
      </div>
    </div>
  )
}
