import { ImageResponse } from 'next/og';
import { getLogoDataUri } from '@/lib/logo';

export const runtime = 'nodejs';
export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default async function Icon() {
  const logo = await getLogoDataUri();
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex' }}>
        <img src={logo} width={32} height={32} style={{ objectFit: 'contain' }} />
      </div>
    ),
    { ...size }
  );
}
