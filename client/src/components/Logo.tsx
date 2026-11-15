interface LogoProps {
  size?: number;
  withWordmark?: boolean;
  className?: string;
}

export function OwlMark({ size = 34, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="4.5 4 31 31"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={`text-bone ${className}`}
    >
      <path
        d="M11 12.5 8.4 6.4 15.1 9.2"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path
        d="M29 12.5 31.6 6.4 24.9 9.2"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path
        d="M9.6 15.8c0-4.5 4.2-7.2 10.4-7.2s10.4 2.7 10.4 7.2v7.1c0 5.4-4.4 9.1-10.4 9.1s-10.4-3.7-10.4-9.1z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <circle cx="16.1" cy="18.4" r="3.1" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="23.9" cy="18.4" r="3.1" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="16.1" cy="18.4" r="1.3" className="fill-signal" />
      <circle cx="23.9" cy="18.4" r="1.3" className="fill-signal" />
      <path d="M20 23.2 18.5 26.1h3z" className="fill-signal" />
      <path
        d="M14.2 30h2.1M23.7 30h2.1"
        stroke="currentColor"
        strokeOpacity="0.45"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Logo({ size = 30, withWordmark = true, className = "" }: LogoProps) {
  return (
    <span className={`flex items-center gap-3.5 ${className}`}>
      <OwlMark size={size} />
      {withWordmark && (
        <span className="flex flex-col leading-none">
          <span className="font-serif text-[19px] leading-none font-semibold tracking-[0.08em] text-bone">
            GLORISON
          </span>
          <span className="mt-1.5 font-sans text-[13px] leading-none font-normal tracking-normal text-dim normal-case">
            Cyber Journal
          </span>
        </span>
      )}
    </span>
  );
}