import { ImageResponse } from 'next/og';
import { person, positioning } from '@/data/portfolioData';

export const alt = 'Ran Levi — Technology Projects, Systems & Operations';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** Social preview card, generated at build time. */
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
          backgroundColor: '#07080b',
          backgroundImage:
            'radial-gradient(900px 500px at 50% -10%, rgba(123,140,255,0.22), transparent 70%)',
          padding: '72px 80px',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 44,
              height: 44,
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.18)',
              color: '#f4f6fa',
              fontSize: 18,
              fontWeight: 600,
            }}
          >
            RL
          </div>
          <div
            style={{
              color: '#a3afff',
              fontSize: 17,
              letterSpacing: 4,
              textTransform: 'uppercase',
            }}
          >
            Technology × Projects × Information Systems
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              color: '#f4f6fa',
              fontSize: 74,
              lineHeight: 1.03,
              letterSpacing: -2.5,
              fontWeight: 700,
              maxWidth: 940,
              display: 'flex',
            }}
          >
            {`${positioning.headlineLines.join(' ')} ${positioning.headlineAccent}`}
          </div>
          <div
            style={{
              marginTop: 28,
              color: '#8d96a6',
              fontSize: 26,
              lineHeight: 1.4,
              maxWidth: 820,
              display: 'flex',
            }}
          >
            Industrial Engineering &amp; Management — projects, information systems, data and automation.
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            paddingTop: 28,
          }}
        >
          <div style={{ display: 'flex', color: '#f4f6fa', fontSize: 24, fontWeight: 600 }}>
            {person.name}
          </div>
          <div style={{ display: 'flex', gap: 36, color: '#8d96a6', fontSize: 19 }}>
            <div style={{ display: 'flex' }}>3 companies</div>
            <div style={{ display: 'flex' }}>~30 min process</div>
            <div style={{ display: 'flex' }}>49 active users</div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
