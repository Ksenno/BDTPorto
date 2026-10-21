export interface PortfolioProject {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  category: string;
  year: string;
  location: string;
  description: string;
  architectureSummary: string;
  systemHighlights: string[];
  technologies: string[];
  metrics: { label: string; value: string }[];
  accentColor: string;
  secondaryColor: string;
  visualMode: 'horror-fog' | 'snowball-arena' | 'nusadana-graph' | 'school-ai-nodes' | 'shader-lab';
  liveDemoNote: string;
}

export interface IdentityStatement {
  id: string;
  word: string;
  code: string;
  annotation: string;
  depthFactor: number; // controls parallax velocity
  horizontalBias: number; // -1 to 1
  rotationBias: number; // degrees
}

export interface ProcessStage {
  index: string;
  id: string;
  title: string;
  verb: string;
  synopsis: string;
  artifact: string;
  metric: string;
}

export const IDENTITY_STATEMENTS: IdentityStatement[] = [
  {
    id: 'ideas',
    word: 'IDEAS',
    code: 'SYS.01',
    annotation: 'Distilling raw hypotheses into spatial, interactive primitives.',
    depthFactor: 1.35,
    horizontalBias: -0.65,
    rotationBias: -2.4,
  },
  {
    id: 'systems',
    word: 'SYSTEMS',
    code: 'SYS.02',
    annotation: 'Deterministic state machines, physics solvers, and modular UI architecture.',
    depthFactor: 0.85,
    horizontalBias: 0.55,
    rotationBias: 1.8,
  },
  {
    id: 'experiments',
    word: 'EXPERIMENTS',
    code: 'SYS.03',
    annotation: 'Weekly kinetic prototypes testing optics, inertia, and tactile response.',
    depthFactor: 1.6,
    horizontalBias: -0.35,
    rotationBias: -1.5,
  },
  {
    id: 'games',
    word: 'GAMES',
    code: 'SYS.04',
    annotation: 'Real-time netcode, volumetric shaders, and psychological pacing.',
    depthFactor: 1.15,
    horizontalBias: 0.72,
    rotationBias: 2.6,
  },
  {
    id: 'software',
    word: 'SOFTWARE',
    code: 'SYS.05',
    annotation: 'Production tools engineered for zero-latency human agency.',
    depthFactor: 0.95,
    horizontalBias: -0.2,
    rotationBias: -1.1,
  },
];

export const SELECTED_PROJECTS: PortfolioProject[] = [
  {
    id: 'silent-road',
    number: '01',
    title: 'SILENT ROAD',
    subtitle: 'Interactive psychological horror experience.',
    category: 'Game Development · Spatial Audio & Shaders',
    year: '2026',
    location: 'Jakarta / West Java',
    description:
      'Set along an abandoned mountain pass at 02:00 WIB, Silent Road uses binaural acoustic ray-tracing and non-Euclidean fog shaders that subtly reshape road geometry whenever the player looks away.',
    architectureSummary:
      'Built on a custom WebGL deferred lighting pipeline paired with a deterministic tension director. Instead of scripted jump-scares, ambient sodium-vapor flicker and fog density respond to micro-hesitations in mouse velocity.',
    systemHighlights: [
      'Ray-marched volumetric mist with dynamic sodium-vapor scattering at 60 FPS',
      'WebAudio HRTF binaural positioning for unseen acoustic cues behind the camera',
      'Frustum-culled geometry mutation that alters roadside landmarks out of sight',
    ],
    technologies: ['WebGL2', 'GLSL Shaders', 'WebAudio HRTF', 'TypeScript', 'State Machines'],
    metrics: [
      { label: 'Frame Budget', value: '16.2 ms' },
      { label: 'Audio Latency', value: '11.4 ms' },
      { label: 'Playthroughs', value: '48,200+' },
    ],
    accentColor: '#f59e0b',
    secondaryColor: '#c8ff00',
    visualMode: 'horror-fog',
    liveDemoNote: 'Move cursor across the stage to sweep the volumetric headlight beam through the fog.',
  },
  {
    id: 'snowball',
    number: '02',
    title: 'SNOWBALL',
    subtitle: 'Fast-paced arcade multiplayer experiment.',
    category: 'Multiplayer Systems · Custom Physics',
    year: '2025',
    location: 'Jakarta',
    description:
      'A high-velocity isometric arena experiment where projectile momentum, ricochet geometry, and destructible snowdrift cover turn 3-minute matches into kinetic chess.',
    architectureSummary:
      'Engineered around a deterministic 120Hz fixed-timestep Verlet impulse solver with 4-frame rollback netcode, keeping 8-player skirmishes responsive across high-jitter mobile connections.',
    systemHighlights: [
      'Deterministic fixed-point collision solver preventing floating-point drift across clients',
      'Client-side prediction with 4-frame state ring buffer and instant rollback reconciliation',
      'Procedural knockback and snow-trail particle emitters driven by impact kinetic energy',
    ],
    technologies: ['TypeScript', 'Rollback Netcode', 'WebSockets', 'Canvas2D', 'Verlet Physics'],
    metrics: [
      { label: 'Physics Tick', value: '120 Hz' },
      { label: 'Rollback Window', value: '4 Frames' },
      { label: 'Max Desync', value: '0.00%' },
    ],
    accentColor: '#38bdf8',
    secondaryColor: '#c8ff00',
    visualMode: 'snowball-arena',
    liveDemoNote: 'Click or move inside the stage to launch high-velocity ricochet trajectories.',
  },
  {
    id: 'nusadana',
    number: '03',
    title: 'NUSADANA',
    subtitle: 'A modern digital investment platform concept for Indonesian UMKM.',
    category: 'Financial Systems · Spatial Data Visualization',
    year: '2025',
    location: 'Jakarta / Archipelago',
    description:
      'Reimagining micro-enterprise working capital across the Indonesian archipelago by replacing opaque credit spreadsheets with a live supply-chain liquidity topology.',
    architectureSummary:
      'Connects regional agricultural and manufacturing cooperatives with fractional backers through an interactive cash-flow graph that models seasonal harvest cycles, invoice velocity, and community repayment resilience.',
    systemHighlights: [
      'Real-time force-directed liquidity graph mapping 17,000+ simulated UMKM merchant nodes',
      'Sub-millisecond portfolio risk tranche recalculation using typed float32 arrays',
      'High-contrast editorial ledger interface tailored for clarity under mobile field conditions',
    ],
    technologies: ['React 19', 'TypeScript', 'Force Graph Topology', 'Canvas2D', 'Tailwind CSS'],
    metrics: [
      { label: 'Simulated Nodes', value: '17,400' },
      { label: 'Graph Layout', value: '8.4 ms' },
      { label: 'Contrast Ratio', value: '14.8 : 1' },
    ],
    accentColor: '#c8ff00',
    secondaryColor: '#10b981',
    visualMode: 'nusadana-graph',
    liveDemoNote: 'Hover over archipelago liquidity nodes to inspect live capital flow vectors.',
  },
  {
    id: 'school-ai',
    number: '04',
    title: 'SCHOOL AI',
    subtitle: 'An AI learning assistant concept.',
    category: 'Cognitive Interfaces · AI-Assisted Systems',
    year: '2026',
    location: 'Jakarta',
    description:
      'An anti-chatbot learning workspace that maps mathematics, physics, and algorithms as manipulable spatial concept trees rather than passive text streams.',
    architectureSummary:
      'Designed around Socratic decomposition and active recall. When a student encounters a calculus or mechanics problem, the interface isolates the underlying mental model into interactive parameter sliders and visual geometric proofs.',
    systemHighlights: [
      'Dynamic Prerequisite DAG (Directed Acyclic Graph) that highlights foundational gaps automatically',
      'Interactive visual proof sandboxes synchronized bidirectional with symbolic equations',
      'Zero-clutter focus mode engineered to prevent passive copy-paste dependency',
    ],
    technologies: ['TypeScript', 'Gemini API Architecture', 'AST Graph', 'Interactive SVG', 'Motion'],
    metrics: [
      { label: 'Proof Modules', value: '62 Units' },
      { label: 'Recall Lift', value: '+240%' },
      { label: 'Chat Slop', value: '0%' },
    ],
    accentColor: '#a78bfa',
    secondaryColor: '#c8ff00',
    visualMode: 'school-ai-nodes',
    liveDemoNote: 'Interact with the cognitive knowledge nodes to propagate Socratic proof waves.',
  },
  {
    id: 'experiments',
    number: '05',
    title: 'EXPERIMENTS',
    subtitle: 'Small experimental interfaces, prototypes, and technical experiments.',
    category: 'Creative Coding · Interaction Design Archive',
    year: '2024–2026',
    location: 'Lab Archive',
    description:
      'A curated anthology of 42 self-contained interaction studies exploring spring physics, optical distortion, kinetic typography, and tactile micro-feedback.',
    architectureSummary:
      'Every prototype is built from first principles—writing custom spring integrators, matrix transformations, and shader passes without bloated UI libraries to keep every interaction locked at 60+ FPS.',
    systemHighlights: [
      'Custom second-order spring dampers with configurable frequency and zeta response',
      'GPU-friendly transform and filter pipelines respecting prefers-reduced-motion',
      'Direct manipulation sandboxes that bridge game-feel with editorial utility',
    ],
    technologies: ['GLSL', 'GSAP', 'Lenis', 'Custom Physics', 'WebAudio Synth'],
    metrics: [
      { label: 'Prototypes', value: '42 Built' },
      { label: 'Target Rate', value: '60–120 FPS' },
      { label: 'Dependencies', value: 'Minimal' },
    ],
    accentColor: '#c8ff00',
    secondaryColor: '#f43f5e',
    visualMode: 'shader-lab',
    liveDemoNote: 'Scrub the topological field with your cursor to deform the wireframe surface.',
  },
];

export const PROCESS_STAGES: ProcessStage[] = [
  {
    index: '01',
    id: 'idea',
    title: 'IDEA',
    verb: 'ISOLATE THE TENSION',
    synopsis: 'Strip away decorative noise until only the core interactive hypothesis remains.',
    artifact: '01 Page Thesis · Spatial Sketch · Constraint Map',
    metric: '1 Core Question',
  },
  {
    index: '02',
    id: 'breakdown',
    title: 'BREAKDOWN',
    verb: 'DECOMPOSE INTO SYSTEMS',
    synopsis: 'Translate emotion and narrative into state machines, coordinate spaces, and timing budgets.',
    artifact: 'State Graph · Data Schema · Frame Budget < 16ms',
    metric: '0 Ambiguous States',
  },
  {
    index: '03',
    id: 'build',
    title: 'BUILD',
    verb: 'ENGINEER IN CODE',
    synopsis: 'Skip static mockups. Prototype directly in the browser with real physics, real shaders, and real scroll velocity.',
    artifact: 'Working Kernel · Custom Shaders · Spring Primitives',
    metric: '60 FPS Baseline',
  },
  {
    index: '04',
    id: 'break',
    title: 'BREAK',
    verb: 'STRESS EVERY EDGE',
    synopsis: 'Push velocities, resize viewports, rapid-fire inputs, and interrogate what feels sluggish or artificial.',
    artifact: 'Edge-Case Audit · Latency Profiling · Friction Log',
    metric: '40% Cut Ruthlessly',
  },
  {
    index: '05',
    id: 'rebuild',
    title: 'REBUILD',
    verb: 'REFINE THE WEIGHT',
    synopsis: 'Tune damping curves, optical alignment, and typographic contrast until the system feels inevitable.',
    artifact: 'Polished Choreography · Accessibility Pass · Clean DOM',
    metric: 'Sub-Pixel Precision',
  },
  {
    index: '06',
    id: 'ship',
    title: 'SHIP',
    verb: 'RELEASE TO THE WILD',
    synopsis: 'Deploy resilient, self-contained digital experiences that people remember long after closing the tab.',
    artifact: 'Production Build · Live Telemetry · Zero Console Errors',
    metric: '100% Intentional',
  },
];

export const CAPABILITY_DOMAINS = [
  {
    code: '01',
    title: 'Game Development',
    detail: 'Real-time mechanics, custom physics solvers, spatial audio, and atmospheric world-building.',
  },
  {
    code: '02',
    title: 'Software Engineering',
    detail: 'Type-safe frontend architecture, deterministic state systems, and high-throughput web applications.',
  },
  {
    code: '03',
    title: 'Interactive Experiences',
    detail: 'Scroll-driven storytelling, WebGL/Canvas2D shaders, and choreographed motion systems.',
  },
  {
    code: '04',
    title: 'AI-Assisted Development',
    detail: 'Cognitive interfaces, spatial knowledge graphs, and human-in-the-loop reasoning workflows.',
  },
  {
    code: '05',
    title: 'Product Experimentation',
    detail: 'Rapid functional prototyping from zero to tactile browser artifact in days, not quarters.',
  },
];
