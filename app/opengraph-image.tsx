import { ImageResponse } from 'next/og';
import { person, positioning } from '@/data/portfolioData';

export const alt = 'Ran Levi, digital project manager, AI implementer and AI builder';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** Social preview card, generated at build time, in the site's palette. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#4a1019',
          padding: '64px 80px 72px',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', color: '#cbbdae', fontSize: 26 }}>{person.title}</div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              color: '#f1ebe3',
              fontSize: 150,
              lineHeight: 0.95,
              letterSpacing: -4,
              fontFamily: 'serif',
            }}
          >
            <span>{positioning.name}</span>
          </div>
          <div style={{ display: 'flex', marginTop: 36, color: '#e6dfd5', fontSize: 30, lineHeight: 1.4, maxWidth: 900 }}>
            {positioning.sentence}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
