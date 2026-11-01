import { ui } from '@/data/ui';
import type { Locale } from '@/lib/i18n';
import { BoardFill } from '@/components/demos/BoardFill';
import { Reveal } from '@/components/ui/Reveal';
import { Lines } from '@/components/ui/Lines';
import { Arrow } from '@/components/ui/Arrow';

/**
 * The first proof, straight after the opening's last screen: the scheduler
 * model staffing its board in two seconds, beside what a planning cycle took
 * by hand and takes with the real system. The full model is further down.
 */
export function Board({ locale }: { locale: Locale }) {
  const t = ui(locale).board;
  return (
    <section id="board" data-section="board" className="section board-sec" aria-labelledby="board-title" data-tone="stone">
      <div className="shell">
        <BoardFill
          words={t}
          intro={
            <>
              <Lines id="board-title" lines={t.title} />
              <Reveal as="div">
                <p className="fb-note">{t.note}</p>
              </Reveal>
            </>
          }
          link={
            <a href="#demo" className="arrow-link fb-link">
              {t.link} <Arrow />
            </a>
          }
        />
      </div>
    </section>
  );
}
