'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { trackDemo } from '@/lib/analytics/client';
import { useLocale } from '@/components/LocaleProvider';

/**
 * The facility platform, before and after: the WhatsApp group the bookings
 * ran through, re-created with invented names, against the platform's working
 * model. A handle wipes between them; drag it anywhere on the picture, or use
 * the arrow keys. The first time it is seen it sweeps once by itself.
 */

interface Message {
  who?: string;
  text: string;
  at: string;
}

const en = {
  before: 'Before: a WhatsApp group',
  after: 'After: one platform',
  handle: 'Before and after',
  value: (n: number) => `${n}% of the group chat shown`,
  group: 'Facility bookings',
  members: 'Maya, Yoni, Shira, Tom and more',
  messages: [
    { who: 'Maya', text: 'Did anyone take the facility on Tuesday at 18:00?', at: '21:02' },
    { text: 'Me! I wrote it here yesterday', at: '21:04' },
    { who: 'Yoni', text: 'Wait, I also wrote 18:00 Tuesday', at: '21:05' },
    { who: 'Shira', text: 'Who approves these anyway? I can’t find the message', at: '21:09' },
    { who: 'Tom', text: 'Scroll up, it was 200 messages ago', at: '21:10' },
    { text: 'So are we both coming?', at: '21:11' },
  ] as Message[],
  alt: 'The platform’s working model: a week of bookings by name, requests waiting for approval, and a double booking it turns away.',
};

const he: typeof en = {
  before: 'לפני: קבוצת WhatsApp',
  after: 'אחרי: מערכת אחת',
  handle: 'לפני ואחרי',
  value: (n) => `${n}% מהקבוצה מוצג`,
  group: 'הזמנות למתקן',
  members: 'מאיה, יוני, שירה, תום ועוד',
  messages: [
    { who: 'מאיה', text: 'מישהו תפס את המתקן ביום שלישי ב-18:00?', at: '21:02' },
    { text: 'אני! רשמתי כבר אתמול', at: '21:04' },
    { who: 'יוני', text: 'רגע, גם אני רשמתי 18:00 בשלישי', at: '21:05' },
    { who: 'שירה', text: 'מי מאשר את זה בכלל? לא מוצאת את ההודעה', at: '21:09' },
    { who: 'תום', text: 'תגללו למעלה, זה היה לפני 200 הודעות', at: '21:10' },
    { text: 'אז מה, שנינו באים?', at: '21:11' },
  ],
  alt: 'המודל העובד של הפלטפורמה: שבוע של הזמנות לפי שם, בקשות שמחכות לאישור, והזמנה כפולה שהמערכת דוחה.',
};

const clamp = (v: number) => Math.min(96, Math.max(4, v));

export function BeforeAfter({ size = 'card' }: { size?: 'card' | 'wide' }) {
  const locale = useLocale();
  const T = locale === 'he' ? he : en;
  const rtl = locale === 'he';
  const box = useRef<HTMLDivElement>(null);
  const [cut, setCut] = useState(50);
  const touched = useRef(false);
  const dragging = useRef(false);

  /** Moves the handle to a pointer's position, measured from where reading starts. */
  const follow = useCallback(
    (clientX: number) => {
      const r = box.current!.getBoundingClientRect();
      const fromStart = rtl ? r.right - clientX : clientX - r.left;
      setCut(clamp((fromStart / r.width) * 100));
    },
    [rtl],
  );

  const grab = () => {
    if (!touched.current) trackDemo('booking: moved the before-and-after handle');
    touched.current = true;
  };
  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    grab();
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    follow(e.clientX);
  };
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (dragging.current) follow(e.clientX);
  };
  const onUp = () => {
    dragging.current = false;
  };
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    // The arrows move the handle the way they point, in either language.
    const towardsEnd = rtl ? 'ArrowLeft' : 'ArrowRight';
    const towardsStart = rtl ? 'ArrowRight' : 'ArrowLeft';
    const moves: Record<string, (c: number) => number> = {
      [towardsEnd]: (c) => c + 5,
      [towardsStart]: (c) => c - 5,
      Home: () => 4,
      End: () => 96,
    };
    if (!moves[e.key]) return;
    e.preventDefault();
    grab();
    setCut((c) => clamp(moves[e.key](c)));
  };

  // The first time it is seen, it shows both sides once, unless someone got there first.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    // On a narrow picture the chat takes more of the width, so the handle rests further over.
    const rest = el.offsetWidth < 520 ? 62 : 50;
    setCut(rest);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let frame = 0;
    const seen = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        seen.disconnect();
        const t0 = performance.now();
        const tick = (t: number) => {
          if (touched.current) return;
          const k = Math.min(1, (t - t0) / 2800);
          setCut(clamp(rest + Math.sin(k * Math.PI * 2) * 34 * (1 - k * 0.2)));
          if (k < 1) frame = requestAnimationFrame(tick);
          else setCut(rest);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.6 },
    );
    seen.observe(el);
    return () => {
      seen.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);

  // Each name shows only while its side of the handle has room for it, in % of the width.
  const [room, setRoom] = useState({ before: 22, after: 22 });
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => {
      const w = el.offsetWidth || 1;
      const width = (sel: string) => ((el.querySelector<HTMLElement>(sel)?.offsetWidth ?? 0) + 24) / w * 100;
      setRoom({ before: width('.ba__label--before'), after: width('.ba__label--after') });
    };
    measure();
    const watch = new ResizeObserver(measure);
    watch.observe(el);
    return () => watch.disconnect();
  }, []);

  const shown = Math.round(cut);

  return (
    <div
      ref={box}
      className="ba"
      data-size={size}
      data-demo=""
      data-ui=""
      style={{ ['--cut' as string]: `${cut}%` }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      <div className="ba__after">
        <Image
          src={rtl ? '/work/screens/booking-he.jpg' : '/work/screens/booking.jpg'}
          alt={T.alt}
          width={2684}
          height={rtl ? 957 : 956}
          sizes="(max-width: 767px) 92vw, 60vw"
          draggable={false}
        />
      </div>

      <div className="ba__before" aria-hidden="true">
        <div className="ba__chathead">
          <span className="ba__avatar" />
          <span>
            <b>{T.group}</b>
            <small>{T.members}</small>
          </span>
        </div>
        <div className="ba__chat">
          {T.messages.map((m, i) => (
            <p key={i} className="ba__bubble" data-me={m.who ? undefined : ''}>
              {m.who && <b>{m.who}</b>}
              {m.text}
              <time>{m.at}</time>
            </p>
          ))}
        </div>
      </div>

      <span className="ba__label ba__label--before" style={{ opacity: room.before < cut ? 1 : 0 }}>
        {T.before}
      </span>
      <span className="ba__label ba__label--after" style={{ opacity: room.after < 100 - cut ? 1 : 0 }}>
        {T.after}
      </span>

      <div
        className="ba__handle"
        role="slider"
        tabIndex={0}
        aria-label={T.handle}
        aria-valuemin={4}
        aria-valuemax={96}
        aria-valuenow={shown}
        aria-valuetext={T.value(shown)}
        onKeyDown={onKey}
      >
        <span aria-hidden="true">
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path d="M9 6l-6 6 6 6M15 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
    </div>
  );
}
