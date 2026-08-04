type BrandMarkProps = {
  className?: string;
  title?: string;
};

export default function BrandMark({ className, title }: BrandMarkProps) {
  const labelled = Boolean(title);

  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      role={labelled ? "img" : undefined}
      aria-label={title}
      aria-hidden={labelled ? undefined : true}
      focusable="false"
    >
      <rect x="2" y="2" width="60" height="60" fill="#dfff4f" stroke="#171c19" strokeWidth="4" />
      <circle cx="32" cy="32" r="20" fill="#f3f0e7" stroke="#171c19" strokeWidth="4" />
      <path d="M15 23h27" fill="none" stroke="#171c19" strokeWidth="6" strokeLinecap="square" />
      <path d="m36 16 7 7-7 7" fill="none" stroke="#171c19" strokeWidth="6" strokeLinejoin="miter" />
      <path d="M49 41H22" fill="none" stroke="#ff6b3d" strokeWidth="6" strokeLinecap="square" />
      <path d="m28 34-7 7 7 7" fill="none" stroke="#ff6b3d" strokeWidth="6" strokeLinejoin="miter" />
      <circle cx="32" cy="32" r="3.5" fill="#171c19" />
    </svg>
  );
}
