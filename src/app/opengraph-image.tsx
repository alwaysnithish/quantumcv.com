import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'QuantumCV — AI Resume Builder';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpengraphImage() {
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
          background: '#000000',
          position: 'relative',
        }}
      >
        {/* subtle accent glow */}
        <div
          style={{
            position: 'absolute',
            top: -200,
            right: -150,
            width: 600,
            height: 600,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(29,155,240,0.35) 0%, rgba(0,0,0,0) 70%)',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 36 }}>
          <div
            style={{
              width: 84,
              height: 84,
              borderRadius: '50%',
              background: '#1d9bf0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 46,
              fontWeight: 800,
              color: 'white',
            }}
          >
            Q
          </div>
          <div style={{ fontSize: 56, fontWeight: 800, color: 'white', letterSpacing: -1.5 }}>QuantumCV</div>
        </div>

        <div
          style={{
            fontSize: 34,
            fontWeight: 700,
            color: 'white',
            textAlign: 'center',
            maxWidth: 880,
            lineHeight: 1.3,
            marginBottom: 18,
          }}
        >
          Build a resume that actually gets you hired.
        </div>

        <div style={{ fontSize: 22, color: 'rgba(255,255,255,0.55)', textAlign: 'center' }}>
          AI Generation · AI Chat Editing · 30 ATS-Optimised Templates
        </div>
      </div>
    ),
    { ...size }
  );
}
