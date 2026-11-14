export const me = {
  name: "Vivek Yadav",
  email: "vivek.yadav03@gmail.com",
  github: "https://github.com/theunseenchapter",
  linkedin: "https://www.linkedin.com/in/vivekyadav03",
};

export const stats = [
  ["2m → 20s", "report execution time"],
  ["680+", "tables mapped by DataScope"],
  ["60%", "faster model inference"],
  ["₹3,000+ cr", "client AUM supported"],
];

export const projects = [
  { t: "DataScope", k: "Database intelligence", d: "A guided workspace for exploring complex schemas, validating SQL and catching unsafe queries before they reach production.", s: ["Python", "FastAPI", "PostgreSQL", "React"], m: "680+", ml: "tables · 13K+ columns", wide: true },
  { t: "MediSource", k: "Agentic AI", d: "A multi-agent medicine-ordering platform that analyses prescriptions and recommends orders through APIs.", s: ["Agentic AI", "RAG", "NLP", "APIs"], st: "In development" },
  { t: "Home Alchemy", k: "Generative design", d: "AI interior design that turns a room brief into visual direction using fine-tuned diffusion models.", s: ["Next.js", "PyTorch", "Stable Diffusion"], m: "60%", ml: "faster inference" },
  { t: "Excel Validation Dashboard", k: "Data quality", d: "Upload workbooks, validate them against backend templates and surface data-quality issues instantly.", s: ["React", "TypeScript", "Material UI", "React Query"], wide: true },
  { t: "ClipBridge", k: "Utility", d: "Dependable, frictionless clipboard transfer between devices.", s: ["Cross-device", "Desktop"] },
  { t: "Tangerine", k: "Windows desktop", d: "Contextual file conversion with deep Windows integration.", s: ["Qt", "PySide6", "Win32/OLE"] },
  { t: "ContextWord", k: "Browser extension", d: "A privacy-first offline dictionary that understands the sentence around a word.", s: ["TypeScript", "Chromium APIs"] },
];

export const jobs = [
  {
    when: "May 2026 — Present",
    org: "Synoriq",
    role: "Associate Software Engineer I",
    pts: [
      "Build and optimise a loan management system for an NBFC client — SQL, data migration, Java/Spring Boot and Python services, React/TypeScript frontends.",
      "Cut report execution time from 2 minutes to 20 seconds.",
      "Ship ETL, migration and reconciliation workflows for clients managing ₹3,000+ crore and ₹500+ crore AUM.",
      "Investigate production issues and contribute to CI/CD releases.",
    ],
  },
  {
    when: "May — Jun 2024",
    org: "iFuture Technologies",
    role: "Cloud Computing Intern",
    pts: ["Tested cloud applications, reproduced API issues, wrote automation scripts and worked in Agile sprints."],
  },
];

export const skills: Record<string, string[]> = {
  Backend: ["Java", "Spring Boot", "Python", "FastAPI", "REST APIs"],
  Data: ["SQL", "PostgreSQL", "Query optimisation", "ETL", "Data migration"],
  Frontend: ["React", "Next.js", "TypeScript", "Tailwind", "Material UI"],
  AI: ["Agentic AI", "RAG", "NLP", "PyTorch", "Stable Diffusion"],
};

export const edu = {
  deg: "B.E. Computer Engineering",
  school: "Lokmanya Tilak College of Engineering, Navi Mumbai",
  meta: "CGPA 8.13 / 10 · Graduated June 2026",
  extra: "Vice President, Computer Engineering Student Association",
};
