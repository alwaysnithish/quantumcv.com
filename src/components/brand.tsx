/**
 * QuantumCV brand mark — single source of truth.
 *
 * Built only from divs + inline styles (no <svg>, no CSS classes, no external
 * images) so the exact same component renders in:
 *   - the browser (React DOM)
 *   - next/og ImageResponse (Satori) for icon / apple-icon / opengraph / twitter
 *
 * Satori rules respected here:
 *   - every div declares an explicit `display`
 *   - only px numbers and simple transforms (rotate / translate)
 *   - no box-shadow, filter, mask, or SVG text
 */

export const BRAND = {
  name: 'QuantumCV',
  accent: '#1d9bf0',
  accentDeep: '#0b63b4',
  ink: '#05070d',
  paper: '#ffffff',
} as const;

type MarkProps = {
  /** Rendered box in px. Everything below scales from this. */
  size?: number;
  /** Drop the orbit ring. Use for anything under ~40px, where it turns to mush. */
  minimal?: boolean;
  /** Square-ish app-icon shape vs the full circle used in-product. */
  shape?: 'squircle' | 'circle';
};

export function BrandMark({ size = 40, minimal = false, shape = 'squircle' }: MarkProps) {
  const s = size;
  const px = (n: number) => Math.round(n * 100) / 100;

  // Nucleus ring thickness never drops below 2px or the mark disappears at 16px.
  const coreBorder = Math.max(2, px(s * 0.085));
  const orbitBorder = Math.max(1.5, px(s * 0.05));

  return (
    <div
      style={{
        width: s,
        height: s,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        borderRadius: shape === 'circle' ? s / 2 : px(s * 0.26),
        background: `linear-gradient(135deg, ${BRAND.accent} 0%, ${BRAND.accentDeep} 100%)`,
      }}
    >
      {/* nucleus — the O of the Q */}
      <div
        style={{
          position: 'absolute',
          display: 'flex',
          width: px(s * 0.44),
          height: px(s * 0.44),
          borderRadius: px(s * 0.22),
          border: `${coreBorder}px solid ${BRAND.paper}`,
        }}
      />

      {/* tail — the stroke of the Q, sitting lower-right */}
      <div
        style={{
          position: 'absolute',
          display: 'flex',
          width: px(s * 0.055) < 2 ? 2 : px(s * 0.055),
          height: px(s * 0.2),
          borderRadius: px(s * 0.03),
          background: BRAND.paper,
          transform: `translate(${px(s * 0.155)}px, ${px(s * 0.165)}px) rotate(-45deg)`,
        }}
      />

      {/* orbit — the "quantum" half of the name */}
      {!minimal && (
        <div
          style={{
            position: 'absolute',
            display: 'flex',
            width: px(s * 0.92),
            height: px(s * 0.36),
            borderRadius: px(s * 0.18),
            border: `${orbitBorder}px solid rgba(255,255,255,0.55)`,
            transform: 'rotate(-35deg)',
          }}
        />
      )}
    </div>
  );
}

type LockupProps = MarkProps & {
  /** Hide the word and show the mark alone. */
  markOnly?: boolean;
  /** Small line under the wordmark. Pass null to omit. */
  tagline?: string | null;
  color?: string;
  mutedColor?: string;
};

/** Mark + wordmark. Use this in headers, the login card, and the OG image. */
export function BrandLockup({
  size = 40,
  minimal,
  shape,
  markOnly = false,
  tagline = null,
  color = 'currentColor',
  mutedColor = 'rgba(120,130,145,1)',
}: LockupProps) {
  const s = size;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: Math.round(s * 0.3) }}>
      <BrandMark size={s} minimal={minimal} shape={shape} />
      {!markOnly && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              fontSize: Math.round(s * 0.42),
              fontWeight: 800,
              letterSpacing: -(s * 0.012),
              color,
            }}
          >
            {BRAND.name}
          </div>
          {tagline && (
            <div style={{ display: 'flex', fontSize: Math.round(s * 0.24), color: mutedColor }}>
              {tagline}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default BrandMark;
