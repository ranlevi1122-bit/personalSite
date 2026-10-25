/**
 * portfolioData.ts
 * -----------------------------------------------------------------------------
 * Single source of truth for every piece of professional content on this site.
 *
 * FACTUAL RULE: everything here is derived from Ran Levi's CV, his GitHub
 * repositories, the capstone's project book and the Launch Engine's own documentation. Language and framing are sharpened, but no employer,
 * client, metric, technology, title, date or outcome is invented.
 *
 * The live demos run on sample data with invented names; they show how each
 * system works, not anyone's real records.
 */

/* -------------------------------------------------------------------------- */
/*  Identity & contact                                                        */
/* -------------------------------------------------------------------------- */

export const person = {
  name: 'Ran Levi',
  title: 'Digital Project Manager · AI Implementer · AI Builder',
  email: 'ranlevi1122@gmail.com',
  phone: '052-7813019',
  phoneHref: 'tel:+972527813019',
  linkedin: 'https://www.linkedin.com/in/ranlevi123',
  linkedinLabel: 'linkedin.com/in/ranlevi123',
  github: 'https://github.com/ranlevi1122-bit',
  githubLabel: 'github.com/ranlevi1122-bit',
  siteRepo: 'https://github.com/ranlevi1122-bit/personalSite',
  resumeHref: '/Ran-Levi-CV.pdf',
  location: 'Israel',
  languages: ['Hebrew', 'English'],
} as const;

export const positioning = {
  name: 'Ran Levi',
  /** Project management leads. */
  roles: ['Digital project manager', 'AI implementer', 'AI builder'] as const,
  /** The two authored lines of the hero headline. */
  headline: ['Digital projects,', 'delivered with AI'] as const,
  sentence:
    'I manage digital projects from the first requirement to the day people use them, and I implement and build the AI that gets them there faster.',
} as const;

export const portrait = {
  src: '/profile.png',
  width: 2057,
  height: 2261,
  alt: 'Ran Levi, smiling, seated at a wooden table in front of a lit stone wall',
} as const;

/* -------------------------------------------------------------------------- */
/*  Work                                                                      */
/* -------------------------------------------------------------------------- */

export type ProjectSlug =
  | 'launch-engine'
  | 'workforce-planning'
  | 'facility-management'
  | 'ai-data-analyst'
  | 'risk-prediction';

/** The interactive objects that stand in for each project. */
export type DemoKind = 'launch' | 'scheduler' | 'booking' | 'agents' | 'safebuild';

export interface GalleryItem {
  src: string;
  width: number;
  height: number;
  alt: string;
  caption: string;
  span: number;
}

export interface ProjectMetric {
  value: string;
  label: string;
}

export interface Project {
  slug: ProjectSlug;
  title: string;
  shortTitle: string;
  category: string;
  tech: string[];
  /** One line under the picture in the work list. */
  line: string;
  positioning: string;
  /** The live object that shows this project on the site. */
  demo: DemoKind;
  /** Who did the work, when it was not Ran alone. */
  team?: string;
  /** Screens of the real system, shown under the story; span is in 12 columns. */
  gallery?: GalleryItem[];
  metrics: ProjectMetric[];
  context: string;
  problem: string[];
  approach: string[];
  solution: string[];
  outcome: string[];
  skills: string[];
}

export const projects: Project[] = [
  {
    slug: 'launch-engine',
    title: 'Launch Engine: AI landing pages for design products',
    shortTitle: 'Launch Engine',
    category: 'R&D project: multi-agent system with human sign-off',
    tech: ['Claude Code', 'Next.js', 'OpenAI', 'Vercel AI SDK', 'Upstash Redis', 'n8n', 'Vercel'],
    line: 'Eight AI agents take one product photo to a checked, approved landing page.',
    positioning:
      'One product photo in; a checked landing page and a full launch kit out, with people signing off before anything goes live.',
    demo: 'launch',
    metrics: [
      { value: '8', label: 'Agents, each with one job and a fixed output' },
      { value: '50', label: 'Products from one Excel upload, with no extra technical work' },
    ],
    context:
      'Premium design products, such as taps, baths and tiles, sell on detail and trust, and every launch needs the same work: a page, copy for each reader, posts and a spec. This R&D project asked whether AI could do that work for one product end to end, then for fifty more, without inventing a single fact. It was tested against the brand book of a premium bathroom and design retailer.',
    problem: [
      'A single prompt invents specifications, drifts off brand and leaves nothing anyone can review.',
      'In premium products, one wrong material, standard or price costs more trust than good copy can earn.',
      'Product, marketing, creative and commerce each answer for a different part, and none should have to read everything.',
    ],
    approach: [
      'Wrote a master prompt as the spec: eight agents with fixed inputs and outputs, shared brand rules, a no-invention rule and human sign-off.',
      'Directed Claude Code as the builder and reviewed every result as a product manager would: against the brief, and as the person who would use it.',
      'Ran three reviews in parallel (fit to the brief, Hebrew quality, the data path) and turned the gaps into one fix list.',
      'Fixed the system, never just the output, so every correction carries over to the next 49 products.',
      'Shipped a live version early, tested it in a free demo mode, then on real products.',
      'Built in two days, 24 and 25 September 2026, and closed with an honest list of what is proven and what is open.',
    ],
    solution: [
      'Eight agents in order: product intelligence, brand guardian, audience and positioning, creative strategy, content, landing page builder, technical validator and launch QA.',
      'Every fact carries a status: verified, inferred from the photo, pending approval or missing. Missing stays missing.',
      'Prices come only from the data, on a product plate built in code; the AI never writes one.',
      'Claims without a source go back for rewriting before a person sees them.',
      'Five sign-offs, each role seeing only its part. Checks warn rather than block, and every override is logged.',
      'Products come in by form, from a maker’s spec sheet, by Excel for up to 50 at once, or through n8n and an API, with an email when a launch is ready.',
      'For each product: a landing page, copy for each reader, a sales kit, notes for architects, three posts and search texts.',
    ],
    outcome: [
      'A live system on Vercel and Upstash Redis, with its own page for testing and questioning each agent.',
      'Real launches with OpenAI on a tile, a concrete bathtub and a bath product; each fault they found became a fix in the system.',
      'Three n8n flows: a launch form, a launch from a catalogue sheet, and the engine itself.',
      'Documented end to end, with a source for every brand rule and an honest list of what is open.',
    ],
    skills: [
      'Product management',
      'Specification writing',
      'Multi-agent design',
      'Human-in-the-loop design',
      'Prompt engineering',
      'Automation (n8n, API)',
      'Quality control',
    ],
    gallery: [
      {
        src: '/work/launch-engine/landing-taste.jpg',
        width: 2880,
        height: 1640,
        alt: 'Generated landing page section “For every taste, every space”: one tap shown in four design worlds',
        caption: 'One product shown in four design worlds, from classic to bold.',
        span: 9,
      },
      {
        src: '/work/launch-engine/landing-mobile.jpg',
        width: 1170,
        height: 2532,
        alt: 'The generated landing page on a phone',
        caption: 'The same page on a phone.',
        span: 3,
      },
      {
        src: '/work/launch-engine/landing-story.jpg',
        width: 2880,
        height: 1410,
        alt: 'The landing page’s story section on a dark ground, beside the bronze tap',
        caption: 'The story section, in the brand’s voice.',
        span: 12,
      },
      {
        src: '/work/launch-engine/landing-spec.jpg',
        width: 2880,
        height: 1760,
        alt: 'Technical specification table where each value is marked pending approval or missing',
        caption: 'The spec table: every value shows where it came from, and missing data says so.',
        span: 6,
      },
      {
        src: '/work/launch-engine/agent-page.jpg',
        width: 2880,
        height: 1800,
        alt: 'The technical validator agent’s own page, with a test run and a chat',
        caption: 'Every agent has its own page: run it on a launch, then ask it why.',
        span: 6,
      },
    ],
  },
  {
    slug: 'workforce-planning',
    title: 'Digital Workforce Planning System',
    shortTitle: 'Workforce Planning',
    category: 'Operational planning and decision support',
    tech: ['Python', 'JavaScript', 'HTML5', 'Netlify', 'GitHub'],
    line: 'Led from process mapping to rollout: scheduling for 3 military companies, half a day down to about 30 minutes.',
    positioning: 'From roughly half a day of manual workforce planning to about 30 minutes.',
    demo: 'scheduler',
    metrics: [
      { value: '3', label: 'Companies using the system' },
      { value: '~30 min', label: 'Per assignment cycle, down from about half a day' },
    ],
    context:
      'An operational personnel scheduling process serving three military companies depended on manual coordination. Assignments were negotiated by hand against a moving set of constraints, and reporting was rebuilt from scratch each cycle.',
    problem: [
      'Building a single assignment cycle consumed close to half a working day.',
      'Constraints lived in people’s heads rather than in a system, so decisions were hard to review or repeat.',
      'Reporting was manual, which delayed visibility for everyone downstream of the plan.',
    ],
    approach: [
      'Mapped the existing scheduling process end to end and separated the inputs, the decision logic and the outputs.',
      'Translated informal scheduling rules into explicit, reviewable constraints.',
      'Defined a recommendation step so the system proposes assignments and the planner stays in control of the final call.',
      'Shipped iteratively against real planning cycles rather than building to a fixed specification up front.',
    ],
    solution: [
      'A digital operational scheduling system with structured inputs for personnel and constraints.',
      'Recommendation logic that proposes assignments instead of leaving the planner with a blank sheet.',
      'An assignment workflow that keeps the human decision-maker in the loop.',
      'Automated reporting generated from the same source of truth as the plan.',
      'Deployed via GitHub and Netlify so updates reached users without a manual release process.',
    ],
    outcome: [
      'Personnel assignment time was reduced from approximately half a day to approximately 30 minutes.',
      'The application was adopted by three military companies.',
      'Scheduling rules became explicit and reviewable rather than tacit knowledge.',
    ],
    skills: [
      'Operational planning',
      'Resource allocation',
      'Workflow automation',
      'Decision support',
      'Recommendation logic',
      'Reporting automation',
      'User-centred systems',
    ],
  },
  {
    slug: 'facility-management',
    title: 'Shared Facility Management Platform',
    shortTitle: 'Facility Platform',
    category: 'Product thinking and resource management',
    tech: ['Python', 'Streamlit'],
    line: 'Specified, built and rolled out a booking platform that replaced a WhatsApp group for 49 active users.',
    positioning:
      'Replacing fragmented WhatsApp coordination with one centralised resource-management platform.',
    demo: 'booking',
    metrics: [
      { value: '49', label: 'Active users on the platform' },
      { value: '3 roles', label: 'Admin, member and viewer, each with its own access' },
    ],
    context:
      'Reservations and coordination for a shared facility ran through manual WhatsApp messages. Availability, priority and history existed only as scrollback in a group chat.',
    problem: [
      'Coordination overhead grew with every additional user.',
      'Nobody could see actual availability or utilisation without reading the chat.',
      'Double-bookings and conflicts were resolved reactively, after they had already happened.',
    ],
    approach: [
      'Treated the group chat as the current system and mapped what it was really being used for: requests, approvals, conflicts and history.',
      'Defined roles first, because access rules were the difference between a shared calendar and a managed resource.',
      'Scoped an MVP around the smallest set of features that could replace the chat outright rather than sit alongside it.',
      'Released to real users and refined the workflow against how they actually booked.',
    ],
    solution: [
      'A centralised reservation and resource-management application built with Python and Streamlit.',
      'Role-based access so different users see and do different things.',
      'Reservation management with conflict prevention built into the booking flow.',
      'Usage monitoring that makes facility utilisation visible.',
    ],
    outcome: [
      'The platform serves 49 active users.',
      'Much of the manual WhatsApp coordination was replaced by a single system.',
      'Facility utilisation became transparent instead of anecdotal.',
    ],
    skills: [
      'Product thinking',
      'MVP development',
      'Role-based access',
      'Workflow design',
      'Conflict prevention',
      'Process digitisation',
    ],
  },
  {
    slug: 'ai-data-analyst',
    title: 'Multi-Agent AI Data Analyst',
    shortTitle: 'AI Data Analyst',
    category: 'Agentic workflows and analysis automation',
    tech: ['AutoGen Studio', 'Python', 'LLMs', 'Streamlit'],
    line: 'Designed a four-agent AutoGen workflow that takes raw data to charts and a written report.',
    positioning:
      'An autonomous AI workflow that takes raw data through analysis, visualisation and business insight.',
    demo: 'agents',
    metrics: [
      { value: '4', label: 'Agent stages, from raw data to insight report' },
      { value: '0', label: 'Manual hand-offs between the stages' },
    ],
    context:
      'Routine analysis work follows the same shape every time: load the data, interrogate it, chart it, then explain what it means. Each stage is repetitive but requires judgement, which makes it a natural fit for an agentic workflow.',
    problem: [
      'The analytical loop is repeated manually for every new dataset.',
      'The slowest part is rarely the computation; it is moving between analysis, visualisation and written interpretation.',
      'A single monolithic prompt handles that sequence poorly.',
    ],
    approach: [
      'Decomposed the analytical process into discrete stages that could each be owned by a specialised agent.',
      'Orchestrated the agents in AutoGen Studio so output from one stage becomes structured input to the next.',
      'Wrapped the workflow in a Streamlit interface so it is usable by someone who is not driving it from a terminal.',
    ],
    solution: [
      'A multi-agent architecture where each agent owns one stage of the analysis.',
      'Automated data analysis over the supplied dataset.',
      'Automated chart generation for the findings that matter.',
      'An interpretation step that turns results into a business insight report.',
      'A Streamlit user interface over the whole workflow.',
    ],
    outcome: [
      'A working end-to-end workflow that moves from raw data to a business insight report without manual hand-offs between stages.',
      'Practical experience designing LLM orchestration rather than consuming AI tools as an end user.',
    ],
    skills: [
      'Generative AI',
      'Agentic workflows',
      'Multi-agent systems',
      'LLM orchestration',
      'Data analysis',
      'Business insights',
    ],
  },
  {
    slug: 'risk-prediction',
    title: 'SafeBuild AI Pro: construction injury risk',
    shortTitle: 'SafeBuild AI Pro',
    category: 'Capstone: machine learning and decision support',
    tech: ['Python', 'MySQL', 'Gradient Boosting', 'LightGBM', 'SHAP', 'Streamlit', 'MS Project'],
    line: 'A team capstone: 233,271 OSHA records, two models and an underwriting app that explains every score.',
    positioning:
      'Prices a construction company’s injury risk before any incident, from five inputs on an insurance application.',
    demo: 'safebuild',
    team: 'Team of three: Gaia Cohen, Ran Levi and Bar Narkis. Supervised by Dr. Daniel Dor, Afeka.',
    metrics: [
      { value: '82.1%', label: 'Recall on 41,760 held-out records, against a 70% target' },
      { value: '76.3%', label: 'AUC of the risk model, against a 70% target' },
    ],
    context:
      'Construction accounts for about a fifth of US work fatalities. Workers’ compensation insurance is priced with the Experience Modification Rate, which needs three years of claims, so new and small companies, the largest segment, are priced on a rough industry rate. The project gives underwriters, safety managers and general contractors a risk assessment at the moment of the application, before any claim exists.',
    problem: [
      'New and small companies have no claims history, so they get no data-driven risk assessment at all.',
      'Most companies report zero injuries, so predicting a count of injuries does not work.',
      'Insurance decisions must be explainable; a score without a reason cannot be used to price a policy.',
    ],
    approach: [
      'Planned and ran the project with CRISP-DM, a 225-day MS Project plan, a change log and a risk register.',
      'Built an ELT pipeline: raw OSHA ITA data (2016–2023) loaded into MySQL, transformed in documented Python.',
      'Cleaned on business rules rather than statistics, so real extreme accidents were not deleted as outliers.',
      'Reframed the problem from counting injuries to the probability of one, after finding the zero inflation.',
      'Compared 10 classification algorithms and built two models: occurrence and, separately, severity.',
      'Checked forward in time before submission: trained on earlier years, tested on 2022–2023.',
    ],
    solution: [
      'Occurrence model: Gradient Boosting on 208,799 records and 9 features, recall 82.1% and AUC 76.3%.',
      'Severity model: LightGBM on 14,395 cases and 7 pre-incident features, AUC 65.4%, its limits documented.',
      'A Streamlit app on a live MySQL database, with underwriter, contractor and admin roles.',
      'From five inputs: a safety grade from A to F, injury and severity probabilities, expected days lost, an industry TRIR comparison, a premium estimate and safety recommendations.',
      'A “Why this score” panel built on SHAP that shows which inputs raised or lowered each prediction.',
    ],
    outcome: [
      'Both model targets were met: recall 82.1% against 70%, AUC 76.3% against 70%.',
      'Two exposure measures, hours worked and headcount, carry about 82% of the risk model’s predictive power.',
      'The temporal check confirmed the model holds up on later years without replacing it.',
      'A working prototype that returns a full underwriting report in seconds, on a standard computer with no cloud components.',
    ],
    skills: [
      'Project planning and control',
      'Risk management',
      'Data engineering (ELT)',
      'Machine learning',
      'Explainable AI',
      'Decision support',
      'Stakeholder analysis',
    ],
  },
];

export const projectBySlug = (slug: string): Project | undefined =>
  projects.find((p) => p.slug === slug);


/* -------------------------------------------------------------------------- */
/*  Hero: the project status card                                             */
/* -------------------------------------------------------------------------- */

export interface StatusProject {
  name: string;
  status: string;
  /** Delivery phases, in order; all completed. */
  phases: string[];
  result: { label: string; before: string; after: string };
  href: string;
}

/** Shown in turn in the hero card. Phases are taken from each case study. */
export const statusProjects: StatusProject[] = [
  {
    name: 'Launch Engine (R&D)',
    status: 'Built',
    phases: [
      'Master prompt written as the spec',
      'Eight agents and the brand rules built',
      'Reviewed against the brief',
      'Real products launched',
      'Documented with an honest status',
    ],
    result: { label: 'Products per launch', before: 'One at a time', after: 'Up to 50' },
    href: '/projects/launch-engine',
  },
  {
    name: 'Digital Workforce Planning System',
    status: 'Rolled out',
    phases: [
      'Current process mapped',
      'Scheduling rules made explicit',
      'Recommendation logic built',
      'Shipped against live cycles',
      'Adopted by 3 companies',
    ],
    result: { label: 'Assignment cycle', before: '~half a day', after: '~30 min' },
    href: '/projects/workforce-planning',
  },
  {
    name: 'Shared Facility Management Platform',
    status: 'Live',
    phases: [
      'WhatsApp coordination mapped',
      'Roles and access defined',
      'MVP scoped and built',
      'Released to real users',
      '49 active users',
    ],
    result: { label: 'Coordination', before: 'WhatsApp group', after: 'One platform' },
    href: '/projects/facility-management',
  },
  {
    name: 'SafeBuild AI Pro (capstone)',
    status: 'Submitted',
    phases: [
      'Scope and SOW signed off',
      'OSHA data loaded into MySQL',
      '10 algorithms compared',
      'Underwriting app with roles',
      'Temporal validation passed',
    ],
    result: { label: 'Risk model recall', before: 'Target 70%', after: '82.1%' },
    href: '/projects/risk-prediction',
  },
];

/** The tools strip under the hero. */
export const toolStrip = [
  'Claude Code',
  'ChatGPT',
  'AutoGen Studio',
  'LLM agents',
  'Python',
  'JavaScript',
  'TypeScript',
  'Next.js',
  'Streamlit',
  'SQL',
  'Tableau',
  'Advanced Excel',
  'MS Project',
  'SAP ERP',
  'GitHub',
  'Vercel',
  'Netlify',
];

/* -------------------------------------------------------------------------- */
/*  What I do                                                                 */
/* -------------------------------------------------------------------------- */

export interface Service {
  title: string;
  body: string;
  points: string[];
  tools: string[];
  proof: { label: string; href: string };
}

export const services: Service[] = [
  {
    title: 'Digital project management',
    body: 'From the first stakeholder conversation to the day people use the system: scope, requirements, a phased plan, and the rollout itself.',
    points: ['Requirements and functional specifications', 'Process mapping', 'Phased delivery plans', 'Rollout and adoption'],
    tools: ['MS Project', 'PMO practice', 'SAP ERP', 'Advanced Excel'],
    proof: { label: 'Workforce system, adopted by 3 companies', href: '/projects/workforce-planning' },
  },
  {
    title: 'AI implementation',
    body: 'Bringing AI into the way a team already works: finding the step worth automating, wiring the right model into it, and making sure it is used.',
    points: ['Workflow automation', 'LLM and agent workflows', 'Data analysis and reporting', 'Decision support'],
    tools: ['ChatGPT', 'AutoGen Studio', 'LLMs', 'Google Sheets API'],
    proof: { label: 'Eight agents with human sign-off, for design products', href: '/projects/launch-engine' },
  },
  {
    title: 'AI building',
    body: 'When the tool does not exist, building it: Claude Code and agents write and run the code while I set the brief, review every change and decide what ships.',
    points: ['Internal tools and platforms', 'Web front ends', 'Machine learning pipelines', 'Deployment'],
    tools: ['Claude Code', 'Python', 'JavaScript', 'TypeScript', 'Next.js', 'Streamlit'],
    proof: { label: 'This site, built with Claude Code', href: person.siteRepo },
  },
];

/* -------------------------------------------------------------------------- */
/*  Results                                                                   */
/* -------------------------------------------------------------------------- */

export interface Kpi {
  value: number;
  prefix?: string;
  suffix?: string;
  label: string;
}

export const kpis: Kpi[] = [
  { value: 3, label: 'military companies run their scheduling on the system I delivered' },
  { value: 30, prefix: '~', suffix: ' min', label: 'per assignment cycle, down from about half a day' },
  { value: 49, label: 'active users moved from a WhatsApp group onto one platform' },
  { value: 82, suffix: '%', label: 'of injury cases flagged by the capstone risk model on held-out data, against a 70% target' },
];

/* -------------------------------------------------------------------------- */
/*  Case studies                                                              */
/* -------------------------------------------------------------------------- */

/** Ran's part in each project, shown on the case list. */
export const caseRoles: Record<ProjectSlug, string> = {
  'launch-engine': 'Product owner: wrote the spec, directed the build with Claude Code, tested and documented',
  'workforce-planning': 'Led end to end: mapping, requirements, build and rollout',
  'facility-management': 'Specified, built and rolled out',
  'ai-data-analyst': 'Designed and built the agent workflow',
  'risk-prediction': 'Team of three; I ran the final temporal validation',
};

/* -------------------------------------------------------------------------- */
/*  Launch Engine: the real system                                            */
/* -------------------------------------------------------------------------- */

/** Screens of the running system, in demo mode, replaying its reference launch. */
export const launchSteps: PrototypeStep[] = [
  {
    title: 'A product goes in',
    body: 'A photo, its data and a price: typed in, read from a spec sheet, or fifty at once from Excel.',
    image: '/work/launch-engine/new-launch.jpg',
    alt: 'The new-launch screen: product image upload, technical data and price, beside the eight agent stages',
    width: 2880,
    height: 1800,
    focus: { x: 44.5, y: 8, w: 48.5, h: 92 },
  },
  {
    title: 'Eight agents, one job each',
    body: 'They run in order, each writing to a fixed schema. Here a revision round cut unsupported claims from three to none.',
    image: '/work/launch-engine/agents.jpg',
    alt: 'The agents’ work on one launch: eight stages complete and a revision round that cut unsupported claims from 3 to 0',
    width: 2880,
    height: 1800,
    focus: { x: 73, y: 8.5, w: 20.3, h: 73 },
  },
  {
    title: 'Nothing is invented',
    body: 'Verified, seen in the photo, or missing. Missing stays missing.',
    image: '/work/launch-engine/agents.jpg',
    alt: 'Product analysis in three columns: verified data, visual interpretation and missing information',
    width: 2880,
    height: 1800,
    focus: { x: 9, y: 41.5, w: 61, h: 58 },
  },
  {
    title: 'People sign off',
    body: 'Four teams approve their own parts, then a final sign-off. Checks warn; people decide.',
    image: '/work/launch-engine/review.jpg',
    alt: 'Review and approval: five steps, four team approvals and a final sign-off',
    width: 2880,
    height: 1800,
    focus: { x: 7, y: 41, w: 86, h: 52 },
  },
  {
    title: 'The page it writes',
    body: 'A full landing page in the brand’s voice, marked as a draft until the teams approve.',
    image: '/work/launch-engine/landing-hero.jpg',
    alt: 'Generated landing page for a designer basin tap in warm bronze',
    width: 2880,
    height: 1800,
    focus: { x: 11, y: 6.5, w: 78, h: 89 },
  },
];

/* -------------------------------------------------------------------------- */
/*  SafeBuild AI Pro: the real material                                       */
/* -------------------------------------------------------------------------- */

/** One view of the real prototype, with the area to point at, in % of the image. */
export interface PrototypeStep {
  title: string;
  body: string;
  image: string;
  alt: string;
  width: number;
  height: number;
  focus: { x: number; y: number; w: number; h: number };
}

export const safebuildSteps: PrototypeStep[] = [
  {
    title: 'Five inputs',
    body: 'An underwriter enters what is on the application: industry, employees, annual exposure hours, size and entity type.',
    image: '/work/safebuild/report.png',
    alt: 'SafeBuild AI Pro report for a roofing contractor with 54 employees: safety grade D, incident probability 62.1%',
    width: 1920,
    height: 888,
    focus: { x: 0.3, y: 1.5, w: 29.6, h: 97 },
  },
  {
    title: 'A grade, not a guess',
    body: 'A roofing contractor with 54 employees and 105,000 hours: grade D, a 62.1% chance of a recordable incident, 77.3% that it is severe.',
    image: '/work/safebuild/report.png',
    alt: 'Safety grade D with incident probability 62.1%, high-severity risk 77.3% and 27 workdays lost per incident',
    width: 1920,
    height: 888,
    focus: { x: 35, y: 22.5, w: 59.5, h: 56 },
  },
  {
    title: 'What to do about it',
    body: 'Recommendations for the trade, here fall arrest, edge protection and ladder safety, beside the severity split from the LightGBM model.',
    image: '/work/safebuild/severity.png',
    alt: 'Safety recommendations for roofing and a severity chart: 77.3% severe injury risk',
    width: 1918,
    height: 895,
    focus: { x: 28, y: 31, w: 71, h: 66 },
  },
  {
    title: 'Why this score',
    body: 'A recommended premium of $233,610, and the SHAP breakdown that shows which inputs pushed the risk up.',
    image: '/work/safebuild/why-this-score.png',
    alt: 'Recommended annual premium of $233,610 and a SHAP chart of feature contributions',
    width: 1914,
    height: 881,
    focus: { x: 27.5, y: 2, w: 69, h: 96 },
  },
];

export const safebuildTargets = [
  { label: 'Risk model recall', target: 70, achieved: 82.1, note: 'On 41,760 held-out records' },
  { label: 'Risk model AUC', target: 70, achieved: 76.3, note: 'Within the range accepted in the literature' },
  { label: 'Severity model AUC', target: null, achieved: 65.4, note: 'On 2,879 cases; limits documented' },
] as const;

/** The plan's main phases, simplified from the team's MS Project file (225 days). */
export const safebuildPlan = {
  start: '2025-07-28',
  end: '2026-06-08',
  days: 225,
  image: '/work/safebuild/gantt.png',
  phases: [
    { name: 'Scope and SOW', start: '2025-07-28', end: '2025-10-23', detail: 'Literature review, market scan and the scope of work, signed off on 23 October.' },
    { name: 'Data pipeline and database', start: '2025-08-25', end: '2025-11-12', detail: 'ETL from the OSHA files into MySQL, cleaning rules and the operational database.' },
    { name: 'Requirements and design review', start: '2025-08-25', end: '2025-12-15', detail: 'Requirements, data review and the design review, closed on 15 December.' },
    { name: 'System design', start: '2025-12-15', end: '2026-02-10', detail: 'System processes, roles and the architecture of the app.' },
    { name: 'Models and business logic', start: '2026-02-10', end: '2026-04-01', detail: 'The two models, the premium logic and the explanations.' },
    { name: 'Testing', start: '2026-04-01', end: '2026-05-08', detail: 'Ten system test scenarios, sensitivity checks and a data-integrity check.' },
    { name: 'Submission and review', start: '2026-05-08', end: '2026-06-08', detail: 'First submission to the supervisor, corrections and the final book.' },
  ],
};

/** Artefacts straight from the project files, shown as they were submitted. */
export const safebuildFiles = [
  {
    src: '/work/safebuild/model-comparison.png',
    width: 2100,
    height: 1500,
    alt: 'Four charts comparing ten algorithms: recall, AUC-ROC, precision against recall, and training time',
    caption: 'The comparison of ten algorithms: recall, AUC, precision against recall and training time.',
  },
  {
    src: '/work/safebuild/confusion-importance.png',
    width: 1811,
    height: 618,
    alt: 'Confusion matrix of the final model on 41,760 test records, and its feature importance chart',
    caption: 'The final model on the test set, and what drives it: exposure first, then the trade.',
  },
  {
    src: '/work/safebuild/sign-in.png',
    width: 1853,
    height: 861,
    alt: 'SafeBuild AI Pro sign-in screen with a role-based login',
    caption: 'Sign-in to the prototype: underwriter, contractor and admin each see their own view.',
  },
];

/** From the project book's risk register: what was foreseen, what happened, what was done. */
export const safebuildRisks = [
  {
    risk: 'Poor source data',
    happened: '11.71% of cells missing, and impossible values.',
    response: 'A transparent removal policy and business-rule thresholds, documented.',
  },
  {
    risk: 'Leakage in feature engineering',
    happened: 'Partly, during the research stage.',
    response: 'Pre-incident features kept separate, and a clean deployed model.',
  },
  {
    risk: 'Weak severity prediction',
    happened: 'Yes: the task is hard by nature.',
    response: 'Shown openly as a probability, with its threshold sensitivity documented.',
  },
  {
    risk: 'Deployment faults',
    happened: 'Duplicate imports from parallel connections.',
    response: 'An import lock in the database and an integrity check.',
  },
  {
    risk: 'Gaps in insurance knowledge',
    happened: 'Regulatory and actuarial knowledge was needed.',
    response: 'Systematic research, summarised in the book’s background chapter.',
  },
];

/* -------------------------------------------------------------------------- */
/*  How I run a project                                                       */
/* -------------------------------------------------------------------------- */

export const processSteps = [
  { title: 'Discover', body: 'Map the process as it runs today: who does what, how long it takes, who decides.' },
  { title: 'Specify', body: 'Turn rules that live in people’s heads into requirements people can sign off.' },
  { title: 'Plan', body: 'Phase the delivery into small releases, shipped against real cycles.' },
  { title: 'Build with AI', body: 'Claude Code and agents write the code; I direct, review and decide what ships.' },
  { title: 'Implement', body: 'Roles, access and the switch-over, so the tool replaces the old routine.' },
  { title: 'Measure', body: 'Adoption and time saved, then the next improvement.' },
];

/* -------------------------------------------------------------------------- */
/*  About, experience, education                                              */
/* -------------------------------------------------------------------------- */

export interface ExperienceEntry {
  org: string;
  role: string;
  period: string;
}

export const experience: ExperienceEntry[] = [
  { org: 'Afeka Academic College', role: 'Teaching Assistant, Arduino I', period: '2026 to now' },
  { org: 'Reserve service', role: 'Combat and Rescue Platoon Commander', period: 'Active' },
  { org: 'Buzzr', role: 'Distribution Route Planner', period: '2021 to 2023' },
];

export const education = [
  {
    degree: 'B.Sc. Industrial Engineering and Management',
    institution: 'Afeka Academic College of Engineering',
    period: '2022 to now',
  },
  {
    degree: 'Practical Engineer, Industrial Engineering and Management',
    institution: 'Tel Aviv College of Practical Engineering',
    period: '2019 to 2020',
  },
];

export const targetRoles = [
  'Digital project management',
  'AI implementation',
  'PMO and project coordination',
  'Product and technology operations',
];

/* -------------------------------------------------------------------------- */
/*  Navigation                                                                */
/* -------------------------------------------------------------------------- */

export const navLinks = [
  { href: '/#services', label: 'Services' },
  { href: '/#demo', label: 'Try it' },
  { href: '/#work', label: 'Case studies' },
  { href: '/#process', label: 'Process' },
  { href: '/#about', label: 'About' },
] as const;

/* -------------------------------------------------------------------------- */
/*  SEO                                                                       */
/* -------------------------------------------------------------------------- */

export const seo = {
  siteName: 'Ran Levi',
  title: 'Ran Levi | Digital project manager, AI implementer and builder',
  description:
    'Ran Levi runs digital projects from requirements to adoption, and implements and builds the AI tools that deliver them: Claude Code, LLM agents, Python and the web.',
  url: 'https://personal-site-black-psi.vercel.app/',
  keywords: [
    'Ran Levi',
    'Digital project manager',
    'Project management',
    'PMO',
    'AI implementation',
    'AI builder',
    'Requirements analysis',
    'Process mapping',
    'Claude Code',
    'LLM agents',
    'AutoGen',
    'Workflow automation',
    'Python',
    'Next.js',
    'Industrial Engineering and Management',
  ],
} as const;
