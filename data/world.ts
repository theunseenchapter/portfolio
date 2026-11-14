export type Style = 'campus' | 'tower' | 'office' | 'data' | 'lab' | 'studio' | 'clipbridge' | 'tangerine' | 'contextword' | 'excel' | 'lighthouse';
export type Dest = {
  id: string; title: string; region: string; kind: 'education' | 'career' | 'project' | 'contact'; style: Style;
  pos: [number, number]; r: number; h: number; color: string; eyebrow: string; summary: string; problem: string;
  arch: { n: string; note: string }[]; stack: string[]; wins: string[]; status?: string;
};

export const spawn: [number, number] = [0, -14];

export const dests: Dest[] = [
  { id: 'origin', title: 'University of Mumbai', region: 'Region 01 · The Origin', kind: 'education', style: 'campus', pos: [-58, -34], r: 9, h: 15, color: '#7fd1a0',
    eyebrow: 'Education · Graduated June 2026', summary: 'A green campus where the engineering practice began: B.E. Computer Engineering at Lokmanya Tilak College of Engineering, Navi Mumbai.',
    problem: 'Turning theory into systems people can actually use — and leading a student community while doing it.',
    arch: [{ n: 'Learn', note: 'B.E. Computer Engineering, CGPA 8.13 / 10.' }, { n: 'Lead', note: 'Vice President, Computer Engineering Student Association.' }, { n: 'Graduate', note: 'Completed June 2026, straight into production engineering.' }],
    stack: ['B.E. Computer Engineering', 'CGPA 8.13/10', 'Leadership'], wins: ['CGPA 8.13 / 10', 'Vice President, Computer Engineering Student Association'] },
  { id: 'synoriq', title: 'Synoriq', region: 'Region 02 · Industrial District', kind: 'career', style: 'tower', pos: [-14, -58], r: 11, h: 22, color: '#6a82ff',
    eyebrow: 'Associate Software Engineer I · May 2026 — Present', summary: 'A modern technology campus for production-grade systems. Vivek works on a loan management system for an NBFC client.',
    problem: 'Keeping production lending systems fast, correct and migratable while the data underneath keeps growing.',
    arch: [{ n: 'Data', note: 'SQL query writing and optimisation, data migration.' }, { n: 'Services', note: 'Backend services in Java, Spring Boot and Python.' }, { n: 'Interface', note: 'React and TypeScript frontends for operations teams.' }, { n: 'Release', note: 'ETL, reconciliation, production debugging and CI/CD.' }],
    stack: ['Java', 'Spring Boot', 'Python', 'SQL', 'React', 'TypeScript', 'ETL'],
    wins: ['Report execution cut from 2 minutes to 20 seconds', 'Production NBFC systems with INR 3,000+ crore and INR 500+ crore client AUM', 'ETL, reconciliation and production debugging'] },
  { id: 'ifuture', title: 'iFuture Technologies', region: 'Region 02 · Industrial District', kind: 'career', style: 'office', pos: [10, -52], r: 7, h: 11, color: '#8aa0ff',
    eyebrow: 'Cloud Computing Intern · May — June 2024', summary: 'The first professional destination: learning to ship and test software against real constraints.',
    problem: 'Making cloud applications dependable before users find the bugs.',
    arch: [{ n: 'Test', note: 'Tested cloud-based applications.' }, { n: 'Reproduce', note: 'Reproduced and documented API issues.' }, { n: 'Automate', note: 'Worked with automation scripts.' }, { n: 'Agile', note: 'Participated in Agile development.' }],
    stack: ['Cloud', 'API testing', 'Automation', 'Agile'], wins: ['Reproduced API issues and wrote automation scripts'] },
  { id: 'datascope', title: 'DataScope', region: 'Region 03 · Data Valley', kind: 'project', style: 'data', pos: [38, -26], r: 9, h: 20, color: '#38bdf8',
    eyebrow: 'Database intelligence', summary: 'A schema intelligence facility in a valley of flowing data: deterministic PostgreSQL exploration with SQL validation and safety checks.',
    problem: 'Large relational databases are hard to understand, and unsafe queries are easy to write. DataScope makes the schema legible before anyone builds on it.',
    arch: [{ n: 'Ingest', note: 'Reads PostgreSQL catalogs: 680+ tables, 13K+ columns.' }, { n: 'Map', note: 'Builds relationships between tables and columns.' }, { n: 'Validate', note: 'Checks SQL against the real schema.' }, { n: 'Guard', note: 'SQL safety checks block risky statements.' }, { n: 'Workspace', note: 'React UI over a FastAPI backend.' }],
    stack: ['Python', 'FastAPI', 'PostgreSQL', 'React'], wins: ['680+ tables explored', '13K+ columns mapped', 'Query validation and SQL safety checks'] },
  { id: 'medisource', title: 'MediSource', region: 'Region 04 · Intelligence Labs', kind: 'project', style: 'lab', pos: [54, 14], r: 8, h: 18, color: '#ff5d7a', status: 'Under development',
    eyebrow: 'Artificial intelligence · In development', summary: 'A mountain research facility for a multi-agent medicine-ordering platform.',
    problem: 'Turning a prescription into the right order automatically, with agents that analyse, retrieve and recommend.',
    arch: [{ n: 'Intake', note: 'Prescription analysis with NLP.' }, { n: 'Retrieve', note: 'RAG over medicine knowledge.' }, { n: 'Agents', note: 'Multiple cooperating agents.' }, { n: 'Recommend', note: 'Automated recommendations.' }, { n: 'Order', note: 'Order-management APIs.' }],
    stack: ['Agentic AI', 'RAG', 'NLP', 'APIs'], wins: ['Multi-agent medicine-ordering platform', 'Prescription analysis and automated recommendations'] },
  { id: 'home-alchemy', title: 'Home Alchemy', region: 'Region 05 · Creative Heights', kind: 'project', style: 'studio', pos: [10, 50], r: 9, h: 16, color: '#ffb07a',
    eyebrow: 'Generative design', summary: 'An architectural studio above the clouds, turning room briefs into visual direction.',
    problem: 'Helping people see an interior before they commit to it, quickly enough to iterate.',
    arch: [{ n: 'Brief', note: 'Next.js product experience captures the room brief.' }, { n: 'Generate', note: 'Fine-tuned Stable Diffusion models on PyTorch.' }, { n: 'Optimise', note: 'Inference time reduced by 60%.' }, { n: 'Direction', note: 'Visual design direction returned to the user.' }],
    stack: ['Next.js', 'Python', 'PyTorch', 'Stable Diffusion'], wins: ['60% reduction in inference time', 'AI interior design application'] },
  { id: 'clipbridge', title: 'ClipBridge', region: 'Region 06 · Innovation Island', kind: 'project', style: 'clipbridge', pos: [-48, 36], r: 7, h: 11, color: '#ff6a3d',
    eyebrow: 'Independent product', summary: 'A cross-device clipboard utility for moving ideas between machines.', problem: 'Moving text and snippets between devices should not need email or chat.',
    arch: [{ n: 'Copy', note: 'Capture on device A.' }, { n: 'Bridge', note: 'Dependable transfer between devices.' }, { n: 'Paste', note: 'Available instantly on device B.' }], stack: ['Cross-device', 'Desktop', 'Utility'], wins: ['Frictionless cross-device transfer'] },
  { id: 'tangerine', title: 'Tangerine', region: 'Region 06 · Innovation Island', kind: 'project', style: 'tangerine', pos: [-52, 58], r: 7, h: 11, color: '#ff9a3d',
    eyebrow: 'Windows desktop', summary: 'A native Windows utility built close to the operating system.', problem: 'File conversion should happen where the file already is, in context.',
    arch: [{ n: 'Context', note: 'Contextual conversion workflows.' }, { n: 'UI', note: 'Qt and PySide6 interface.' }, { n: 'OS', note: 'Win32 / OLE integration.' }], stack: ['Qt', 'PySide6', 'Win32', 'OLE'], wins: ['Deep Windows desktop integration'] },
  { id: 'contextword', title: 'ContextWord', region: 'Region 06 · Innovation Island', kind: 'project', style: 'contextword', pos: [-72, 44], r: 6, h: 14, color: '#a78bfa',
    eyebrow: 'Browser tooling', summary: 'A privacy-first dictionary that understands the sentence around a word.', problem: 'Looking up a word should not leak what you are reading.',
    arch: [{ n: 'Select', note: 'Pick a word on any page.' }, { n: 'Context', note: 'Reads the surrounding sentence.' }, { n: 'Lookup', note: 'Offline, on-device dictionary.' }, { n: 'Speak', note: 'Pronunciation.' }], stack: ['TypeScript', 'Chromium APIs', 'Offline-first'], wins: ['Offline lookup with pronunciation', 'No text sent to remote services'] },
  { id: 'excel', title: 'Excel Validation Dashboard', region: 'Region 06 · Innovation Island', kind: 'project', style: 'excel', pos: [-68, 22], r: 7, h: 11, color: '#4ade80',
    eyebrow: 'Product engineering', summary: 'A clear validation surface for spreadsheet-heavy workflows.', problem: 'Bad workbooks should be caught with clear feedback before they reach the backend.',
    arch: [{ n: 'Upload', note: 'Drop a workbook.' }, { n: 'Template', note: 'Fetch the backend template (React Query).' }, { n: 'Validate', note: 'Typed validation against the template.' }, { n: 'Report', note: 'Data-quality issues surfaced instantly.' }], stack: ['React', 'TypeScript', 'Material UI', 'React Query'], wins: ['Responsive dashboard with strongly typed data fetching'] },
  { id: 'contact', title: 'Contact Beacon', region: 'Coast · Open Channel', kind: 'contact', style: 'lighthouse', pos: [68, -44], r: 5, h: 22, color: '#fcd34d',
    eyebrow: 'Open channel', summary: 'A lighthouse on the north-east coast. Light it up — let’s build something meaningful.', problem: 'You have something interesting in mind. Say hello.',
    arch: [{ n: 'Email', note: 'vivek.yadav03@gmail.com' }, { n: 'GitHub', note: 'github.com/theunseenchapter' }, { n: 'LinkedIn', note: 'linkedin.com/in/vivekyadav03' }], stack: ['Open to conversations'], wins: [] },
];

export const tour = [
  { id: 'origin' }, { id: 'synoriq' }, { id: 'datascope' }, { id: 'home-alchemy' }, { id: 'medisource' },
  { id: 'island', title: 'Innovation Island', pos: [-58, 38] as [number, number], text: 'Four independent products: ClipBridge, Tangerine, ContextWord and the Excel Validation Dashboard.' },
  { id: 'contact' },
];
