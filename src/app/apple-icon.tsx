import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#000000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: 128,
            height: 128,
            borderRadius: '50%',
            background: '#1d9bf0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 72,
            fontWeight: 800,
            color: 'white',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          Q
        </div>
      </div>
    ),
    { ...size }
  );
}
