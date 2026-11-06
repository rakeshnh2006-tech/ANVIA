/**
 * AnviaLogo — inline SVG brand logo.
 * size="sm"  → icon only (32×32),  used in compact navbars
 * size="md"  → icon + wordmark,    default
 * size="lg"  → full logo with tagline
 */

interface Props {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/** Shared icon — woman silhouette with leaves */
function AnviaIcon({ scale = 1 }: { scale?: number }) {
  const w = 50 * scale
  const h = 50 * scale
  return (
    <svg width={w} height={h} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="av-lg1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e879c8"/>
          <stop offset="100%" stopColor="#7c3aed"/>
        </linearGradient>
        <linearGradient id="av-lg2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#c084fc"/>
          <stop offset="100%" stopColor="#6d28d9"/>
        </linearGradient>
        <linearGradient id="av-lg3" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ede9fe"/>
          <stop offset="100%" stopColor="#c4b5fd"/>
        </linearGradient>
        <linearGradient id="av-lg4" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7c3aed"/>
          <stop offset="100%" stopColor="#4c1d95"/>
        </linearGradient>
      </defs>
      {/* Back leaf */}
      <path d="M 8 80 C 2 50 10 18 32 8 C 42 4 52 12 53 28 C 54 46 44 65 30 76 Z" fill="url(#av-lg1)" opacity="0.85"/>
      {/* Middle leaf */}
      <path d="M 20 85 C 14 60 18 35 38 22 C 48 16 58 24 58 38 C 59 55 48 72 35 82 Z" fill="url(#av-lg2)" opacity="0.9"/>
      {/* Bottom swoosh */}
      <path d="M 14 90 C 32 84 52 76 62 64 C 67 58 66 52 60 54 C 50 57 36 70 20 80 Z" fill="url(#av-lg2)" opacity="0.85"/>
      {/* Face */}
      <path d="M 52 16 C 46 13 40 18 38 26 C 36 36 39 44 44 48 C 46 51 47 55 46 59 C 44 65 43 69 44 73 C 45 76 49 77 51 75 C 52 74 53 72 54 70 L 54 64 C 55 59 57 56 59 53 C 63 48 66 41 65 33 C 63 24 59 18 52 16 Z" fill="url(#av-lg3)"/>
      {/* Hair */}
      <path d="M 52 16 C 56 12 64 10 70 15 C 76 20 77 30 73 37 C 69 43 64 46 62 50 C 59 54 57 56 59 53 C 63 48 66 41 65 33 C 63 24 59 18 52 16 Z" fill="url(#av-lg4)"/>
      {/* Arc behind head */}
      <path d="M 38 12 C 33 6 32 2 38 1 C 46 0 54 6 56 15" stroke="url(#av-lg1)" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    </svg>
  )
}

export default function AnviaLogo({ size = 'md', className = '' }: Props) {
  if (size === 'sm') {
    return (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <AnviaIcon scale={0.56} />
        <span className="font-bold text-lg tracking-wide text-[#4c1d95]">ANVIA</span>
      </div>
    )
  }

  if (size === 'lg') {
    return (
      <div className={`flex flex-col items-center ${className}`}>
        <div className="flex items-center gap-3">
          <AnviaIcon scale={0.9} />
          <span className="font-bold text-4xl tracking-wide text-[#4c1d95]">ANVIA</span>
        </div>
        <p className="text-sm text-[#7c3aed] mt-1 tracking-wide">— Your Health. Our Priority. —</p>
      </div>
    )
  }

  // md (default)
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <AnviaIcon scale={0.7} />
      <span className="font-bold text-2xl tracking-wide text-[#4c1d95]">ANVIA</span>
    </div>
  )
}
