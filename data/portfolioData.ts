/**
 * portfolioData.ts
 * -----------------------------------------------------------------------------
 * Single source of truth for every piece of professional content on this site.
 *
 * FACTUAL RULE: everything here is derived from Ran Levi's CV. Language and
 * framing are sharpened for a recruiter audience, but no employer, client,
 * metric, technology, title, date or outcome is invented.
 */

/* -------------------------------------------------------------------------- */
/*  Identity & contact                                                        */
/* -------------------------------------------------------------------------- */

export const person = {
  name: 'Ran Levi',
  initials: 'RL',
  /** Positioning line taken directly from the CV header. */
  title: 'Technology Project Management · Information Systems Analysis & Implementation · Product Management',
  shortTitle: 'Technology Projects, Systems & Operations',
  email: 'ranlevi1122@gmail.com',
  phone: '052-7813019',
  linkedin: 'https://www.linkedin.com/in/ranlevi123',
  linkedinLabel: 'linkedin.com/in/ranlevi123',
  resumeHref: '/Ran-Levi-CV.pdf',
  location: 'Israel',
  languages: [
    { name: 'Hebrew', level: 'Native' },
    { name: 'English', level: 'Full professional proficiency' },
  ],
} as const;

export const positioning = {
  eyebrow: 'Technology × Projects × Information Systems',
  /** Composed as deliberate lines rather than left to wrap. */
  headlineLines: ['I build systems', 'that turn complexity'] as const,
  headlineAccent: 'into execution.',
  subhead:
    'Industrial Engineering & Management, combining project thinking, information systems, automation and data to build practical solutions for real operational problems.',
  valueProposition: 'Turning operational complexity into digital solutions.',
  summary:
    '4th-year Industrial Engineering & Management student with a proven ability to build and implement technology solutions, targeting junior roles in Project Management, PMO and Product.',
} as const;

/* -------------------------------------------------------------------------- */
/*  Hero graph — the five domains Ran works across                            */
/* -------------------------------------------------------------------------- */

export type DomainId = 'projects' | 'systems' | 'data' | 'operations' | 'people';

export interface Domain {
  id: DomainId;
  label: string;
  line: string;
  /** Normalised layout position inside the hero graph viewBox (0–1). */
  x: number;
  y: number;
  /** Projects that evidence this domain. */
  projects: ProjectSlug[];
}

export const domains: Domain[] = [
  {
    id: 'projects',
    label: 'Projects',
    line: 'Structure the work.',
    x: 0.5,
    y: 0.12,
    projects: ['workforce-planning', 'facility-management', 'risk-prediction'],
  },
  {
    id: 'systems',
    label: 'Systems',
    line: 'Turn processes into repeatable workflows.',
    x: 0.9,
    y: 0.38,
    projects: ['workforce-planning', 'facility-management'],
  },
  {
    id: 'data',
    label: 'Data',
    line: 'Turn information into decisions.',
    x: 0.75,
    y: 0.83,
    projects: ['ai-data-analyst', 'risk-prediction'],
  },
  {
    id: 'operations',
    label: 'Operations',
    line: 'Improve how work actually happens.',
    x: 0.25,
    y: 0.83,
    projects: ['workforce-planning', 'ai-data-analyst'],
  },
  {
    id: 'people',
    label: 'People',
    line: 'Build systems people can use.',
    x: 0.1,
    y: 0.38,
    projects: ['facility-management', 'workforce-planning'],
  },
];

/** Edges of the hero graph, expressed as index pairs into `domains`. */
export const domainEdges: [number, number][] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [4, 0],
  [0, 2],
  [0, 3],
  [1, 4],
  [1, 3],
  [2, 4],
];

/* -------------------------------------------------------------------------- */
/*  Section 02 — What I bring                                                 */
/* -------------------------------------------------------------------------- */

export interface Capability {
  id: string;
  index: string;
  title: string;
  body: string;
  keywords: string[];
}

export const capabilities: Capability[] = [
  {
    id: 'structure',
    index: '01',
    title: 'Structure',
    body: 'Turn ambiguous operational problems into requirements, workflows and work that can actually be managed.',
    keywords: ['Requirements Analysis', 'Functional Specifications', 'Process Mapping', 'Project Planning', 'PMO'],
  },
  {
    id: 'build',
    index: '02',
    title: 'Build',
    body: 'Create working technology solutions instead of stopping at a recommendation deck.',
    keywords: ['MVP Development', 'Python', 'JavaScript', 'Streamlit', 'Automation', 'APIs'],
  },
  {
    id: 'analyze',
    index: '03',
    title: 'Analyze',
    body: 'Use data to understand how a process performs and to support the decision that follows.',
    keywords: ['SQL', 'Advanced Excel', 'Tableau', 'Machine Learning', 'Dashboard Development'],
  },
  {
    id: 'execute',
    index: '04',
    title: 'Execute',
    body: 'Coordinate people, resources and changing constraints until the work is delivered and used.',
    keywords: ['Leadership', 'Prioritization', 'Resource Planning', 'Operations', 'Cross-functional Execution'],
  },
];

/* -------------------------------------------------------------------------- */
/*  Section 03 — Selected work                                                */
/* -------------------------------------------------------------------------- */

export type ProjectSlug =
  | 'workforce-planning'
  | 'facility-management'
  | 'ai-data-analyst'
  | 'risk-prediction';

export type ProjectVisual = 'workflow' | 'product' | 'agents' | 'pipeline';

export interface ProjectMetric {
  value: string;
  label: string;
}

export interface Project {
  slug: ProjectSlug;
  index: string;
  title: string;
  /** Short kicker used in navigation and dense views. */
  shortTitle: string;
  category: string;
  tech: string[];
  /** One-line recruiter-facing positioning. */
  positioning: string;
  visual: ProjectVisual;
  metrics: ProjectMetric[];
  context: string;
  problem: string[];
  approach: string[];
  solution: string[];
  outcome: string[];
  skills: string[];
  domains: DomainId[];
}

export const projects: Project[] = [
  {
    slug: 'workforce-planning',
    index: '01',
    title: 'Digital Workforce Planning System',
    shortTitle: 'Workforce Planning',
    category: 'Operational planning · Decision support',
    tech: ['Python', 'JavaScript', 'HTML5', 'Netlify', 'GitHub'],
    positioning:
      'From roughly half a day of manual workforce planning to about 30 minutes.',
    visual: 'workflow',
    metrics: [
      { value: '3', label: 'Companies using the system' },
      { value: '~30 min', label: 'Assignment process, down from ~half a day' },
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
      'Operational Planning',
      'Resource Allocation',
      'Workflow Automation',
      'Decision Support',
      'Scheduling',
      'Process Improvement',
      'Recommendation Logic',
      'Reporting Automation',
      'Technology Project Development',
      'User-Centered Systems',
    ],
    domains: ['projects', 'systems', 'operations', 'people'],
  },
  {
    slug: 'facility-management',
    index: '02',
    title: 'Shared Facility Management Platform',
    shortTitle: 'Facility Management',
    category: 'Product thinking · Resource management',
    tech: ['Python', 'Streamlit'],
    positioning:
      'Replacing fragmented WhatsApp coordination with one centralized resource-management platform.',
    visual: 'product',
    metrics: [
      { value: '49', label: 'Active users on the platform' },
      { value: 'Role-based', label: 'Access, reservations and conflict prevention in one system' },
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
      'A centralized reservation and resource-management application built with Python and Streamlit.',
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
      'Product Thinking',
      'MVP Development',
      'User Management',
      'Role-Based Access',
      'Workflow Design',
      'Conflict Prevention',
      'Process Digitization',
      'Operational Transparency',
      'Resource Management',
    ],
    domains: ['projects', 'systems', 'people'],
  },
  {
    slug: 'ai-data-analyst',
    index: '03',
    title: 'Multi-Agent AI Data Analyst',
    shortTitle: 'AI Data Analyst',
    category: 'Agentic workflows · Analysis automation',
    tech: ['AutoGen Studio', 'Python', 'LLMs', 'Streamlit'],
    positioning:
      'An autonomous AI workflow that takes raw data through analysis, visualization and business insight.',
    visual: 'agents',
    metrics: [
      { value: '4', label: 'Automated stages, from raw data to insight report' },
      { value: 'Multi-agent', label: 'Architecture orchestrating specialised roles' },
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
      'Agentic Workflows',
      'Process Automation',
      'Multi-Agent Systems',
      'Data Analysis',
      'Business Insights',
      'LLM Orchestration',
      'AI-enabled Automation',
    ],
    domains: ['data', 'operations', 'systems'],
  },
  {
    slug: 'risk-prediction',
    index: '04',
    title: 'Workplace Risk Prediction',
    shortTitle: 'Risk Prediction',
    category: 'Capstone · Predictive analytics',
    tech: ['Python', 'Random Forest', 'XGBoost'],
    positioning:
      'An end-to-end predictive analytics MVP built to support workplace risk assessment.',
    visual: 'pipeline',
    metrics: [
      { value: '2', label: 'Model families compared: Random Forest and XGBoost' },
      { value: 'MVP', label: 'Dashboard for risk prediction and visualization' },
    ],
    context:
      'Final-year capstone project applying a complete data science process to workplace accident risk, from raw data through to a decision-support interface.',
    problem: [
      'Workplace risk assessment is often retrospective, reacting to incidents that have already occurred.',
      'Raw incident data is not directly usable by the people who make prevention decisions.',
    ],
    approach: [
      'Ran a full end-to-end data science process rather than an isolated modelling exercise.',
      'Prepared and engineered the dataset before modelling.',
      'Compared tree-based approaches, Random Forest and XGBoost, on accident risk prediction.',
      'Delivered results as a dashboard, because a model that no one can interrogate does not change a decision.',
    ],
    solution: [
      'Data preparation and feature engineering pipeline.',
      'Predictive models for workplace accident risk using Random Forest and XGBoost.',
      'Visualization of predicted risk in an MVP dashboard.',
      'A decision-support framing aimed at prevention rather than reporting.',
    ],
    outcome: [
      'A working MVP dashboard covering the full path from data to risk prediction to visualization.',
      'An end-to-end demonstration of the data science process applied to an operational safety problem.',
      'Scoped deliberately as an MVP: a decision-support prototype, not a production safety system.',
    ],
    skills: [
      'Predictive Analytics',
      'Machine Learning',
      'Random Forest',
      'XGBoost',
      'Risk Analysis',
      'Data Visualization',
      'MVP',
      'Decision Support',
      'End-to-End Data Process',
    ],
    domains: ['data', 'projects'],
  },
];

export const projectBySlug = (slug: string): Project | undefined =>
  projects.find((p) => p.slug === slug);

/* -------------------------------------------------------------------------- */
/*  Impact — verified metrics only                                            */
/* -------------------------------------------------------------------------- */

export interface ImpactStat {
  value: string;
  /** Numeric portion for the count-up animation, when one exists. */
  countTo?: number;
  prefix?: string;
  suffix?: string;
  label: string;
  context?: string;
  href?: string;
}

export const impactStats: ImpactStat[] = [
  {
    value: '3',
    countTo: 3,
    label: 'Military companies using the workforce planning system',
    href: '/projects/workforce-planning',
  },
  {
    value: '~30 min',
    countTo: 30,
    prefix: '~',
    suffix: ' min',
    label: 'Personnel assignment process after digitization',
    context: 'Previously approximately half a day.',
    href: '/projects/workforce-planning',
  },
  {
    value: '49',
    countTo: 49,
    label: 'Active users on the facility management platform',
    href: '/projects/facility-management',
  },
  {
    value: '4',
    countTo: 4,
    label: 'Selected technology projects, shipped end to end',
  },
];

/* -------------------------------------------------------------------------- */
/*  Experience & leadership                                                   */
/* -------------------------------------------------------------------------- */

export interface ExperienceEntry {
  id: string;
  org: string;
  role: string;
  period: string;
  /** How this experience reads for a technology / project employer. */
  positioning: string;
  points: string[];
  capabilities: string[];
}

export const experience: ExperienceEntry[] = [
  {
    id: 'afeka',
    org: 'Afeka Academic College',
    role: 'Teaching Assistant — Arduino I',
    period: '2026 — Present',
    positioning:
      'Evaluating technical work, understanding system logic and communicating improvements clearly.',
    points: [
      'Evaluate Python, HTML5 and Arduino projects submitted by students.',
      'Assess code quality and hardware–software integration.',
      'Provide structured feedback that students can act on.',
    ],
    capabilities: [
      'Technical Review',
      'Code Quality',
      'Systems Thinking',
      'Structured Feedback',
      'Stakeholder Communication',
    ],
  },
  {
    id: 'reserve',
    org: 'Active Reserve Service',
    role: 'Combat and Rescue Platoon Commander',
    period: 'Active',
    positioning:
      'Leading people, logistics and execution when conditions change quickly.',
    points: [
      'Lead field teams in dynamic environments.',
      'Own mission planning and operational logistics.',
      'Organize workforce and priorities under time pressure.',
    ],
    capabilities: [
      'Team Leadership',
      'Operational Planning',
      'Logistics',
      'Prioritization',
      'Decision-Making Under Pressure',
      'Workforce Organization',
    ],
  },
  {
    id: 'buzzr',
    org: 'Buzzr',
    role: 'Distribution Route Planner',
    period: '2021 — 2023',
    positioning:
      'Applying analytical thinking to real operational planning decisions.',
    points: [
      'Optimized distribution routes by analyzing operational constraints.',
      'Improved efficiency and resource utilization across the plan.',
      'Balanced operational cost against customer service levels.',
    ],
    capabilities: [
      'Route Optimization',
      'Constraint Analysis',
      'Resource Utilization',
      'Operational Efficiency',
      'Service Levels',
    ],
  },
];

/* -------------------------------------------------------------------------- */
/*  Technology ecosystem                                                      */
/* -------------------------------------------------------------------------- */

export interface Skill {
  name: string;
  /** Projects on this site that demonstrably used the skill (CV-supported). */
  usedIn?: ProjectSlug[];
  /** Shown when there is no direct project evidence to point at. */
  note?: string;
}

export interface SkillGroup {
  id: string;
  title: string;
  caption: string;
  skills: Skill[];
}

export const skillGroups: SkillGroup[] = [
  {
    id: 'projects-systems',
    title: 'Projects & Systems',
    caption: 'Structuring work and turning requirements into systems.',
    skills: [
      { name: 'PMO', note: 'Project governance and delivery practice.' },
      { name: 'MS Project', note: 'Project scheduling and planning.' },
      {
        name: 'Requirements Analysis',
        usedIn: ['workforce-planning', 'facility-management'],
      },
      {
        name: 'Functional Specifications',
        usedIn: ['workforce-planning', 'facility-management'],
      },
      {
        name: 'Process Mapping',
        usedIn: ['workforce-planning', 'facility-management'],
      },
      {
        name: 'MVP Development',
        usedIn: ['facility-management', 'risk-prediction', 'ai-data-analyst'],
      },
      { name: 'SAP ERP', note: 'Enterprise systems and information flows.' },
    ],
  },
  {
    id: 'data-bi',
    title: 'Data & BI',
    caption: 'Making performance measurable and decisions defensible.',
    skills: [
      { name: 'SQL', note: 'Data-oriented systems and analysis.' },
      { name: 'Advanced Excel', note: 'Operational analysis and modelling.' },
      { name: 'Tableau', note: 'Business intelligence and reporting.' },
      {
        name: 'Dashboard Development',
        usedIn: ['risk-prediction', 'ai-data-analyst'],
      },
      { name: 'Random Forest', usedIn: ['risk-prediction'] },
      { name: 'XGBoost', usedIn: ['risk-prediction'] },
    ],
  },
  {
    id: 'development',
    title: 'Development & Automation',
    caption: 'Building the thing, not just specifying it.',
    skills: [
      {
        name: 'Python',
        usedIn: ['workforce-planning', 'facility-management', 'ai-data-analyst', 'risk-prediction'],
      },
      { name: 'JavaScript', usedIn: ['workforce-planning'] },
      { name: 'HTML5', usedIn: ['workforce-planning'] },
      { name: 'Streamlit', usedIn: ['facility-management', 'ai-data-analyst'] },
      { name: 'Google Sheets API', note: 'Automation across spreadsheet-based workflows.' },
      { name: 'GitHub', usedIn: ['workforce-planning'] },
      { name: 'Netlify', usedIn: ['workforce-planning'] },
    ],
  },
  {
    id: 'ai',
    title: 'AI',
    caption: 'Using generative AI as a build tool and as an architecture.',
    skills: [
      { name: 'AutoGen Studio', usedIn: ['ai-data-analyst'] },
      { name: 'Agentic Workflows', usedIn: ['ai-data-analyst'] },
      { name: 'LLMs', usedIn: ['ai-data-analyst'] },
      { name: 'Claude Code', note: 'AI-assisted development.' },
      { name: 'ChatGPT', note: 'AI-assisted analysis and development.' },
    ],
  },
  {
    id: 'engineering',
    title: 'Engineering',
    caption: 'Industrial engineering foundations and hardware literacy.',
    skills: [
      { name: 'Arduino', note: 'Taught and assessed as Teaching Assistant, Arduino I.' },
      { name: 'Microcontrollers', note: 'Hardware–software integration.' },
      { name: 'AutoCAD', note: 'Engineering design.' },
      { name: 'SolidWorks', note: 'Engineering design.' },
    ],
  },
];

/* -------------------------------------------------------------------------- */
/*  Education                                                                 */
/* -------------------------------------------------------------------------- */

export interface EducationEntry {
  degree: string;
  institution: string;
  period: string;
  themes: string[];
}

export const education: EducationEntry[] = [
  {
    degree: 'B.Sc. Industrial Engineering & Management',
    institution: 'Afeka Academic College of Engineering',
    period: '2022 — Present',
    themes: [
      'Information Systems',
      'Project Management',
      'Operations',
      'Data Analysis',
      'Optimization',
      'Business Intelligence',
    ],
  },
  {
    degree: 'Practical Engineer Diploma — Industrial Engineering & Management',
    institution: 'Tel Aviv College of Practical Engineering',
    period: '2019 — 2020',
    themes: ['Industrial Engineering', 'Operations', 'Process Analysis'],
  },
];

/* -------------------------------------------------------------------------- */
/*  Operating principles                                                      */
/* -------------------------------------------------------------------------- */

export const principles: string[] = [
  'Understand the process before optimizing it.',
  'If a workflow repeats, ask why it is still manual.',
  'Build around the user, not around the technology.',
  'Data is useful when it improves a decision.',
  'A system is successful only when people actually use it.',
];

/* -------------------------------------------------------------------------- */
/*  Recruiter mode — the 60-second view                                       */
/* -------------------------------------------------------------------------- */

export const recruiterView = {
  who: 'Industrial Engineering & Management professional focused on technology, systems and project execution.',
  what: 'Builds practical digital solutions that combine process analysis, technology, data and automation.',
  proof: [
    'Workforce planning system used by three military companies.',
    'Planning time reduced from approximately half a day to approximately 30 minutes.',
    'Resource management platform supporting 49 active users.',
    'Multi-agent AI analytics workflow, from raw data to insight report.',
    'Predictive risk analytics capstone using Random Forest and XGBoost.',
    'Technical project assessment as Teaching Assistant, Arduino I.',
    'Operational leadership and logistics as a Combat and Rescue Platoon Commander.',
    'Distribution route planning at Buzzr, 2021–2023.',
  ],
  target: [
    'Project Management',
    'PMO',
    'Product',
    'Information Systems',
    'Business / Systems Analysis',
    'Technology Operations',
  ],
} as const;

/* -------------------------------------------------------------------------- */
/*  Ask about Ran — answers assembled from the data above                     */
/* -------------------------------------------------------------------------- */

export interface AskEntry {
  id: string;
  question: string;
  answer: string;
  points: string[];
  cta?: { label: string; href: string };
}

export const askEntries: AskEntry[] = [
  {
    id: 'built',
    question: 'What has Ran built?',
    answer:
      'Four technology projects, each taken from an operational problem through to something people can use.',
    points: [
      'Digital Workforce Planning System — scheduling, recommendation logic and automated reporting.',
      'Shared Facility Management Platform — centralized reservations with role-based access.',
      'Multi-Agent AI Data Analyst — an agentic workflow from raw data to insight report.',
      'Workplace Risk Prediction — an end-to-end predictive analytics MVP.',
    ],
    cta: { label: 'See selected work', href: '#work' },
  },
  {
    id: 'users',
    question: 'Does Ran have real users?',
    answer: 'Yes. Two of the systems were adopted in live operational settings.',
    points: [
      'The workforce planning system is used by three military companies.',
      'The facility management platform serves 49 active users.',
      'Both replaced manual coordination that was already happening.',
    ],
    cta: { label: 'See the impact', href: '#impact' },
  },
  {
    id: 'pm',
    question: 'What project management experience does he have?',
    answer:
      'Project management demonstrated through delivery rather than through job title alone.',
    points: [
      'Requirements analysis, functional specifications and process mapping across two systems.',
      'Planning and resource allocation as a Combat and Rescue Platoon Commander.',
      'Distribution route planning against real operational constraints at Buzzr.',
      'PMO and MS Project as part of an Industrial Engineering & Management education.',
    ],
    cta: { label: 'See experience', href: '#experience' },
  },
  {
    id: 'tech',
    question: 'What technologies does he work with?',
    answer:
      'A stack that spans project and BI tooling, development, data science and AI.',
    points: [
      'Projects & systems: PMO, MS Project, requirements analysis, process mapping, SAP ERP.',
      'Data & BI: SQL, Advanced Excel, Tableau, Random Forest, XGBoost.',
      'Development: Python, JavaScript, HTML5, Streamlit, Google Sheets API, GitHub, Netlify.',
      'AI: AutoGen Studio, agentic workflows, LLMs, Claude Code, ChatGPT.',
    ],
    cta: { label: 'Explore the ecosystem', href: '#ecosystem' },
  },
  {
    id: 'leadership',
    question: 'What demonstrates leadership?',
    answer:
      'Responsibility for people and for outcomes, in settings where conditions change quickly.',
    points: [
      'Combat and Rescue Platoon Commander: field teams, mission planning, operational logistics.',
      'Teaching Assistant, Arduino I: assessing technical work and giving structured feedback.',
      'Driving adoption of two systems that replaced established manual routines.',
    ],
    cta: { label: 'See experience', href: '#experience' },
  },
  {
    id: 'roles',
    question: 'What roles is he targeting?',
    answer:
      'Junior roles where projects, information systems, data and operations intersect.',
    points: [
      'Project Management, Project Coordination and PMO.',
      'Product Management and Product Operations.',
      'Information Systems, Systems Analysis and Business Analysis.',
      'Technology Operations and data-driven operations roles.',
    ],
    cta: { label: 'Get in touch', href: '#contact' },
  },
];

/* -------------------------------------------------------------------------- */
/*  Navigation                                                                */
/* -------------------------------------------------------------------------- */

export const navSections = [
  { id: 'work', label: 'Work' },
  { id: 'capabilities', label: 'Capabilities' },
  { id: 'experience', label: 'Experience' },
  { id: 'about', label: 'About' },
  { id: 'contact', label: 'Contact' },
] as const;

/* -------------------------------------------------------------------------- */
/*  SEO                                                                       */
/* -------------------------------------------------------------------------- */

export const seo = {
  siteName: 'Ran Levi',
  title: 'Ran Levi | Technology Projects, Systems & Operations',
  description:
    'Industrial Engineering & Management professional combining project management, information systems, data, automation and operational execution to build practical technology solutions.',
  url: 'https://ranlevi.dev',
  keywords: [
    'Ran Levi',
    'Project Management',
    'PMO',
    'Project Coordination',
    'Information Systems',
    'Systems Analysis',
    'Business Analysis',
    'Requirements Analysis',
    'Functional Specifications',
    'Process Mapping',
    'Digital Transformation',
    'Workflow Automation',
    'Process Improvement',
    'Resource Planning',
    'Product Management',
    'Product Operations',
    'MVP Development',
    'Business Intelligence',
    'Dashboard Development',
    'Industrial Engineering and Management',
    'SQL',
    'Python',
    'Tableau',
    'SAP ERP',
    'Machine Learning',
    'Decision Support',
  ],
} as const;
