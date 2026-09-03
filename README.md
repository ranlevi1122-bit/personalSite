# Ran Levi — personal site

A high-conversion professional landing experience for **Ran Levi**: Industrial Engineering &
Management, working at the intersection of projects, systems, data, operations and people.

Built with Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS and Framer Motion.
Every route is statically prerendered.

---

## Running it

```bash
npm install
npm run dev     # http://localhost:3210
```

```bash
npm run build && npm start
```

## Deploying

The whole site is static, so any host works. Netlify (already in Ran's stack):

- Build command: `npm run build`
- Publish directory: `.next`
- Add the official Next.js Netlify plugin, or deploy to Vercel with zero configuration.

**Before going live**, set the real domain in `data/portfolioData.ts` → `seo.url`.
It feeds the canonical tags, OpenGraph URLs, `sitemap.xml` and `robots.txt`.

---

## Content lives in one file

All professional content is in **`data/portfolioData.ts`**. Nothing factual is hardcoded in a
component. To change a project, a metric, a skill or the contact details, edit that file only.

The file is organised as:

| Export | What it drives |
| --- | --- |
| `person` | Name, email, phone, LinkedIn, resume link, languages |
| `positioning` | Hero eyebrow, headline lines, subhead, value proposition |
| `domains` / `domainEdges` | The five nodes of the interactive hero graph |
| `capabilities` | Section 02 — Structure / Build / Analyze / Execute |
| `projects` | The four case studies, including the full 7-part detail structure |
| `impactStats` | Section 04 — verified numbers only |
| `experience` | Afeka, Active Reserve Service, Buzzr |
| `skillGroups` | The technology ecosystem, with `usedIn` project evidence |
| `education` | Both qualifications and their academic themes |
| `principles` | Operating principles (site copy, not attributed quotes) |
| `recruiterView` | The 60-second view |
| `askEntries` | The "Ask about Ran" answers |
| `seo` | Titles, description, keywords, canonical URL |

### Factual rule

The CV is the source of truth. No employer, client, metric, technology, date, title or outcome is
invented anywhere in this codebase. Language and framing are sharpened; facts are not.

Two places state an explicit boundary so nothing reads as an overclaim:

- The risk-prediction visual is labelled *"Illustrative of the dashboard output, not reported model results."*
- That project's outcome notes it was scoped as an MVP decision-support prototype, not a production safety system.

`skillGroups` distinguishes **evidence** from **background**: a skill with `usedIn` points at real
projects and shows a dot in the UI; a skill with only a `note` is listed as background.

---

## Structure

```
app/
  layout.tsx              Fonts, metadata, Person JSON-LD, site chrome
  page.tsx                Section order for the home page
  globals.css             Design tokens, base styles, motion preferences
  projects/[slug]/        Statically generated case studies (7-part structure)
  opengraph-image.tsx     Social card, generated at build time
  sitemap.ts / robots.ts  Generated from portfolioData
components/
  Nav.tsx                 Floating nav, active-section indicator, mobile menu
  RecruiterMode.tsx       The 60-second view (modal dialog, focus-trapped)
  CursorLight.tsx         Ambient cursor illumination
  SiteChrome.tsx          Shared chrome + the recruiter-mode context
  hero/HeroGraph.tsx      Interactive five-domain system graph
  sections/               One file per page section
  visuals/                A distinct visual identity per project
  ui/                     Reveal primitives, buttons, counter, lit panels
lib/hooks.ts              Pointer, scroll, motion-preference and focus hooks
data/portfolioData.ts     All content
```

### Reading levels

The page is built for three depths, deliberately:

1. **10 seconds** — hero positioning plus three verified proof points, above the fold.
2. **60 seconds** — capabilities, the four projects, the impact numbers, or the 60-second view.
3. **3–5 minutes** — experience, the full ecosystem, and the four case-study routes.

---

## Interaction and performance notes

Pointer-driven effects never re-render React. The cursor light and the hero graph each run a
single `requestAnimationFrame` loop that writes directly to element transforms and SVG attributes;
card lighting and the magnetic CTAs write CSS custom properties from their own event handlers.
The hero graph commits React state only when the *highlighted* node changes.

Everything cursor-driven is gated behind `(hover: hover) and (pointer: fine)`, so touch devices
never pay for effects they cannot use. `prefers-reduced-motion` collapses every entrance
animation to a plain render, stops the graph drift and the looping visuals, and disables the
cursor light entirely.

### Accessibility

- Semantic landmarks, one `h1`, ordered heading levels, skip link.
- The recruiter overlay is a real dialog: `aria-modal`, focus moved in and restored on close,
  Tab trapped inside, Escape to close, body scroll locked without layout shift.
- Every hover interaction in the skills ecosystem is also reachable by keyboard focus and by tap.
- Colour tokens are tuned to clear 4.5:1 against the background — most metadata here is small text.
- Tap targets grow under `(pointer: coarse)`.

### Verified

`npm run build` and `tsc --noEmit` are clean and all 12 routes prerender. Lighthouse against the
production build:

| | Performance | Accessibility | Best practices | SEO |
| --- | --- | --- | --- | --- |
| Home, desktop | 100 | 100 | 100 | 100 |
| Home, mobile | 87–91 | 100 | 100 | 100 |
| Case study, mobile | 94 | 100 | 100 | 100 |

Mobile performance is a range because the numbers were sampled on a busy development machine;
the spread is run-to-run noise, not a difference in the build. On mobile the limiting metric is
largest contentful paint, which lands on the hero paragraph as soon as it is painted.

Three findings from that work are worth keeping in mind before changing the hero:

1. The hero animates in CSS, not JavaScript. Moving it back to motion components delayed the
   largest contentful paint until the bundle had loaded and run.
2. The hero paragraph uses `.enter-slide`, which moves without fading. An element at zero opacity
   does not count as painted, so fading the largest text pushed LCP out by the whole animation.
3. Scroll reveals are position-based, not `IntersectionObserver`-based. An observer only fires when
   a threshold is crossed, so a fast flick or an anchor jump could carry an element from below the
   viewport to above it without ever reporting it — leaving that content invisible permanently.
