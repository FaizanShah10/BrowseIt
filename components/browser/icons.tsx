import type { ReactNode } from "react";

type IconProps = {
  size?: number;
  className?: string;
};

function base(size: number, className: string | undefined, children: ReactNode) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function IconBack({ size = 18, className }: IconProps) {
  return base(size, className, <path d="M15 18l-6-6 6-6" />);
}

export function IconForward({ size = 18, className }: IconProps) {
  return base(size, className, <path d="M9 18l6-6-6-6" />);
}

export function IconSun({ size = 18, className }: IconProps) {
  return base(
    size,
    className,
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>,
  );
}

export function IconMoon({ size = 18, className }: IconProps) {
  return base(size, className, <path d="M20 14.5A7.5 7.5 0 0 1 9.5 4 7 7 0 1 0 20 14.5z" />);
}

export function IconImage({ size = 18, className }: IconProps) {
  return base(
    size,
    className,
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="10" r="1.5" />
      <path d="M21 16l-5-5-4 4-2-2-5 5" />
    </>,
  );
}

export function IconPlain({ size = 18, className }: IconProps) {
  return base(
    size,
    className,
    <>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M4 10h16" />
    </>,
  );
}

export function IconHistory({ size = 18, className }: IconProps) {
  return base(
    size,
    className,
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l2.5 2.5" />
    </>,
  );
}

export function IconSearch({ size = 18, className }: IconProps) {
  return base(
    size,
    className,
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16.5 16.5L21 21" />
    </>,
  );
}

export function IconPublish({ size = 18, className }: IconProps) {
  return base(
    size,
    className,
    <>
      <path d="M12 19V5" />
      <path d="M6 11l6-6 6 6" />
      <path d="M5 19h14" />
    </>,
  );
}

export function IconPerson({ size = 18, className }: IconProps) {
  return base(
    size,
    className,
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 19c1.8-3.2 4.2-4.8 7-4.8S17.2 15.8 19 19" />
    </>,
  );
}

export function IconClose({ size = 18, className }: IconProps) {
  return base(size, className, <path d="M6 6l12 12M18 6L6 18" />);
}

export function IconChevron({ size = 16, className }: IconProps) {
  return base(size, className, <path d="M8 10l4 4 4-4" />);
}

export function IconRefresh({ size = 18, className }: IconProps) {
  return base(
    size,
    className,
    <>
      <path d="M21 12a9 9 0 1 1-2.6-6.2" />
      <path d="M21 3v6h-6" />
    </>,
  );
}

export function IconGlobe({ size = 16, className }: IconProps) {
  return base(
    size,
    className,
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z" />
    </>,
  );
}

export function IconGrid({ size = 14, className }: IconProps) {
  return base(
    size,
    className,
    <>
      <rect x="4" y="4" width="6" height="6" rx="1" />
      <rect x="14" y="4" width="6" height="6" rx="1" />
      <rect x="4" y="14" width="6" height="6" rx="1" />
      <rect x="14" y="14" width="6" height="6" rx="1" />
    </>,
  );
}
