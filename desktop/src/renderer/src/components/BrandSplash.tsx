import { useEffect, useRef, useState } from 'react';
import iconUrl from '../../icon.png';

const MIN_MS = 1400;
const EXIT_MS = 420;

type Props = {
  status?: string;
  exiting?: boolean;
  onHidden?: () => void;
};

export function BrandSplash({ status, exiting, onHidden }: Props) {
  const [phase, setPhase] = useState<'enter' | 'exit'>('enter');
  const mountedAt = useRef(Date.now());
  const exitStarted = useRef(false);

  useEffect(() => {
    if (!exiting || exitStarted.current) return;
    exitStarted.current = true;
    const wait = Math.max(0, MIN_MS - (Date.now() - mountedAt.current));
    const t = window.setTimeout(() => {
      setPhase('exit');
      window.setTimeout(() => onHidden?.(), EXIT_MS);
    }, wait);
    return () => window.clearTimeout(t);
  }, [exiting, onHidden]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background ${
        phase === 'exit' ? 'brand-splash-exit' : 'brand-splash-enter'
      }`}
    >
      <div
        className="pointer-events-none absolute h-80 w-80 rounded-full"
        style={{ background: 'var(--accent)', opacity: 0.07 }}
      />
      <img
        src={iconUrl}
        alt=""
        width={88}
        height={88}
        className="brand-splash-icon relative"
      />
      <div className="brand-splash-copy relative mt-7 flex flex-col items-center">
        <p className="mono text-[10px] uppercase tracking-[0.22em] text-muted">
          Specialty coffee
        </p>
        <h1 className="mt-2 text-[1.35rem] font-semibold tracking-wide text-foreground">
          Kılıç Coffee Roaster
        </h1>
        <div className="brand-splash-line mt-[18px] h-[2px] bg-accent" />
        {status ? (
          <p className="mt-5 text-xs tracking-wide text-muted">{status}</p>
        ) : null}
      </div>
    </div>
  );
}
