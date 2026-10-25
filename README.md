# Ran Levi — personal site

Ran Levi's business card and portfolio: a digital project manager who also implements and builds
AI, shown through what he delivers, the results, five case studies with live demos and how he runs
a project. A private dashboard at `/stats` shows who visited and what they did.

Built with Next.js 15 (App Router), React 19, TypeScript and Tailwind's base layer, with the design
in plain CSS (`app/globals.css`). Every public route is statically generated.

## Running it

```bash
npm install
npm run dev     # http://localhost:3210
npm run build && npm start
```

Pushing to `main` deploys to Vercel.

## The look

Business, with old money: an off-white page with stone and maroon bands and an oxblood footer,
Source Serif 4 for headlines and Onest for reading. Every section is a band in one tone, named on
the section with `data-tone` (`light`, `stone`, `dark`, `deep`).

## Content lives in one file

Everything factual is in **`data/portfolioData.ts`**: identity and contact, the hero status card,
the tools strip, services, results, the five case studies and Ran's role in each, the process,
experience, education and SEO.

The CV, the GitHub repositories and the capstone's project book are the sources. No employer,
metric, technology, date or outcome is invented.

## Page order

| Section | Claim | Component |
| --- | --- | --- |
| Hero | What Ran delivers, with a live project status card | `components/sections/Hero.tsx`, `components/StatusCard.tsx` |
| Tools | The stack, running past | `components/sections/ToolStrip.tsx` |
| Services | Project management, AI implementation, AI building | `components/sections/Services.tsx` |
| Results | Four figures the work delivered | `components/sections/Results.tsx` |
| Try it | The scheduler, to work by hand | `components/sections/TryIt.tsx` |
| Case studies | The five systems, each with its live demo playing | `components/sections/Cases.tsx` |
| Process | How a project runs, step by step | `components/sections/Process.tsx` |
| About | Short profile, experience, education, CV | `components/sections/About.tsx` |
| Contact | One invitation and every way to reach him | `components/sections/Contact.tsx` |

Case studies: `app/projects/[slug]/page.tsx`.

## Live demos

Each project is shown by a working object in `components/demos/`, not a drawn screen. On the case
list they play by themselves while on screen (`mode="preview"`); on the case pages and in the
home page's Try it section they are worked by hand.

- **Launch Engine** (`Walkthrough.tsx`, steps in `launchSteps`): a guided tour of the real
  system's screens, shot in its demo mode replaying the reference launch, plus a gallery of the
  generated landing page. The screenshots are in `public/work/launch-engine/`, with the retailer's
  logo and name removed.
- **Scheduler** (`Scheduler.tsx`): modelled on the real company scheduler. Its checks follow the
  real system's: a full shift, a person already on it, someone not on base yet, a later arrival,
  who stood guard last night. The fairness table and the three assistant questions mirror the
  real ones; the real assistant uses Gemini, the demo works its answers out from the board.
  All names are invented; the real system's screens are not published because they show real
  people.
- **Bookings** (`Booking.tsx`): member, admin and viewer roles, conflict blocking, approvals,
  weekly use. Invented names.
- **AI analyst** (`Agents.tsx`): four agents run in turn on sample data; the chart and every
  figure in the report are computed from the data shown.
- **SafeBuild AI Pro** (`SafeBuild.tsx`): the team's real prototype screens in a guided
  walkthrough, the test results (targets, the confusion matrix against a naive guess, the
  model-selection rule), the plan from MS Project and the risk register, all from the project
  book. The screenshots are in `public/work/safebuild/`.

Demos report what visitors do with them through `trackDemo`; generic click tracking skips
anything inside `data-demo`.

## Private analytics

First-party and anonymous: no IP addresses, no names, no third-party scripts. Visitors who send
Global Privacy Control or Do Not Track are not counted, and neither is any browser that has signed
in to `/stats`.

- `components/Analytics.tsx` records page views, the home sections reached (`data-section`),
  clicks, scroll depth and time in view; `lib/analytics/client.ts` batches them to `/api/track`.
- Events are stored in Upstash Redis, one list per day, kept 180 days (`lib/analytics/store.ts`).
  Without Redis in development they go to `.analytics/events.jsonl`.
- `/stats` is the dashboard, behind a password and a signed cookie (`lib/analytics/auth.ts`).
- **Tracking links:** add `?ref=name` to the address (the dashboard builds them) and every visit
  through that link is labelled, so you can tell which application or message it came from.

It is built to cost nothing:

- Upstash's Free plan (256MB, 500K commands a month) needs no payment method, so it cannot bill.
  Each day keeps at most 4,000 events, roughly 100 to 200 visits; past that, the rest of the day
  is not saved and the dashboard says so. Six months of full days stay under 200MB.
- Vercel's Hobby plan does not bill either; if a limit were ever reached it pauses the project
  instead. The tracker sends a visit's events in a few batched requests (every 20 seconds, at 30
  events, and when the page is left), far inside the Hobby allowance.
- Never add a payment method to Upstash or move the project to Vercel Pro; that is what would
  turn on paid usage.

Setup on Vercel, once:

1. Project → Storage → create an **Upstash for Redis** database on the **Free** plan and
   connect it to this project. Vercel adds `KV_REST_API_URL` and `KV_REST_API_TOKEN`.
2. Project → Settings → Environment Variables → add `STATS_PASSWORD` (8 characters or more).
3. Redeploy, open `/stats` and sign in.

For local development copy `.env.example` to `.env.local` and set `STATS_PASSWORD`.

## Motion

Sleek and controlled, nothing tied to the cursor.

- The headline lines rise from behind their baselines; the pitch, actions and byline follow.
- The status card ticks off each delivered project's phases, then moves to the next every seven
  seconds; it holds while pointed at, and the dots switch projects by hand.
- The tools strip runs slowly and pauses on hover.
- Section headings rise line by line; each section's parts rise into place once, in reading order
  (`components/ui/Lines.tsx`, `components/ui/Reveal.tsx`, position-based in `lib/revealObserver.ts`).
- Results count up once in view (`components/ui/CountUp.tsx`).
- Case previews sweep open as they arrive and play only while on screen; the process line draws
  itself and each step lights in turn.
- Services lift on hover; buttons fill on hover; text links draw an underline.

Content is hidden only under `html.js`, and `prefers-reduced-motion` stops the strip, the card
rotation, the demo previews and every travel.
