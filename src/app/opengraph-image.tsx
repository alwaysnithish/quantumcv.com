import { ImageResponse } from 'next/og';
import { getLogoDataUri } from '@/lib/logo';

// Node runtime, not edge: the logo is read from public/ with fs.
export const runtime = 'nodejs';
export const alt = 'QuantumCV — build a resume from your raw career data';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpengraphImage() {
  const logo = await getLogoDataUri();

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#05070d',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -200,
            right: -150,
            width: 600,
            height: 600,
            display: 'flex',
            borderRadius: 300,
            background: 'radial-gradient(circle, rgba(29,155,240,0.35) 0%, rgba(0,0,0,0) 70%)',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 40 }}>
          {/* width + height are required — Satori will not infer them */}
          <img src={logo} width={104} height={104} style={{ borderRadius: 26 }} />
          <div style={{ display: 'flex', fontSize: 62, fontWeight: 800, color: '#fff', letterSpacing: -1.5 }}>
            QuantumCV
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            fontSize: 34,
            fontWeight: 700,
            color: '#ffffff',
            textAlign: 'center',
            maxWidth: 880,
            lineHeight: 1.3,
            marginBottom: 18,
          }}
        >
          Build a resume from your raw career data.
        </div>

        <div style={{ display: 'flex', fontSize: 22, color: 'rgba(255,255,255,0.55)' }}>
          AI generation, chat editing, and 30 ATS-ready templates
        </div>
      </div>
    ),
    { ...size }
  );
}
