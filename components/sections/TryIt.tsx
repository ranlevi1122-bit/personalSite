import Link from 'next/link';
import { Reveal } from '@/components/ui/Reveal';
import { Lines } from '@/components/ui/Lines';
import { Arrow } from '@/components/ui/Arrow';
import { Scheduler } from '@/components/demos/Scheduler';

/**
 * One system to work by hand: the scheduler, with its checks, its fairness
 * table and its assistant, on invented names.
 */
export function TryIt() {
  return (
    <section id="demo" data-section="demo" className="section" aria-labelledby="demo-title" data-tone="stone">
      <div className="shell">
        <div className="grid12 sec-head">
          <Lines id="demo-title" lines={['Staff the board', 'yourself']} />
          <Reveal as="div" className="sec-head__note">
            <p>
              A working model of the scheduler three companies plan with, on invented names. Drag people onto
              shifts or let it fill the board, and watch the checks catch what a planner would.
            </p>
          </Reveal>
        </div>
        <Reveal className="tryit">
          <Scheduler />
          <Link href="/projects/workforce-planning" className="arrow-link tryit__link">
            How the real system was delivered <Arrow />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
