export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <span className="relative grid size-8 place-items-center">
        <span className="flicker absolute inset-0 rounded-full bg-accent/25 blur-md" />
        <svg viewBox="0 0 32 32" className="relative size-7" aria-hidden>
          <path d="M6 17c0-6 4.5-10.5 10-10.5S26 11 26 17z" fill="#f2c47e" />
          <ellipse cx="16" cy="17" rx="10" ry="1.6" fill="#fff3df" />
          <rect x="15.2" y="18" width="1.6" height="7.5" fill="#f6eee4" />
          <rect x="11" y="25.5" width="10" height="1.8" rx=".9" fill="#f6eee4" />
        </svg>
      </span>
      <span className="font-display text-xl tracking-[0.18em] font-light">LUMORA</span>
    </span>
  );
}
