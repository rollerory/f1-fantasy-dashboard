interface Props {
  color: string;
  size?: number;
}

/** Placeholder helmet glyph — stands in for a driver photo until we have real art. */
export function Helmet({ color, size = 56 }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <path
        d="M32 6c14 0 24 12 24 26 0 8-4 14-11 18v6c0 3-2 5-5 5H24c-3 0-5-2-5-5v-6C12 46 8 40 8 32 8 18 18 6 32 6Z"
        fill={color}
      />
      <rect x="13" y="29" width="38" height="13" rx="6.5" fill="#0b0b0b" opacity="0.82" />
      <rect x="13" y="29" width="38" height="4" rx="2" fill="#ffffff" opacity="0.22" />
    </svg>
  );
}
