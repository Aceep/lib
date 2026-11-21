/** The "KYLE" wordmark with the dinosaur's green crest on the K. Sized by the parent's font-size. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`logo ${className}`.trim()} aria-label="Kyle Lib">
      <svg className="logo-crest" viewBox="0 0 40 18" aria-hidden="true">
        <path d="M0 18c0-7 4-12 8-12s8 5 8 12zm12 0c0-9 4-16 8-16s8 7 8 16zm14 0c0-6 3-10 7-10s7 4 7 10z" />
      </svg>
      <span aria-hidden="true">KYLE</span>
    </span>
  );
}
