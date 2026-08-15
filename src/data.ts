// ─────────────────────────────────────────
// LUNOSSA — Real project & profile data
// Sourced from GitHub (WafaQueen1) on 2026-08-15
// ─────────────────────────────────────────

export const PROFILE = {
  name: 'Wafa Felahi',
  tagline: 'Software & DevOps Engineer',
  roles: ['Full-Stack Developer', 'Cloud & DevOps Engineer', 'ML/DL Practitioner', 'UI Designer'],
  location: 'Constantine, Algeria',
  email: 'wafa.felahi@univ-constantine2.dz',
  phone: '+213 779 40 68 42',
  linkedin: 'https://linkedin.com/in/wafa-felahi',
  github: 'https://github.com/WafaQueen1',
  bio: `Builder of systems that breathe. From fog nodes to cloud clusters, from raw sensor data to trained models —
I craft the full arc of an idea into working software. Currently based in Constantine, Algeria.`,
} as const;

export const CERTIFICATIONS = [
  {
    title: 'AWS Certified Cloud Practitioner',
    issuer: 'Amazon Web Services',
    year: '2023',
    badge: '☁️',
  },
  {
    title: 'AWS Certified Generative AI Specialist',
    issuer: 'Amazon Web Services',
    year: '2023',
    badge: '🤖',
  },
] as const;

export type SkillGroup = {
  id: string;
  label: string;
  icon: string;
  description: string;
  skills: string[];
};

export const SKILL_GROUPS: SkillGroup[] = [
  {
    id: 'fullstack',
    label: 'Full-Stack',
    icon: '⚡',
    description: 'Web and mobile, end-to-end.',
    skills: ['React.js', 'Next.js', 'Flutter', 'Node.js / Express', 'FastAPI', 'PHP', 'TypeScript', 'HTML5 / CSS3'],
  },
  {
    id: 'cloud',
    label: 'Cloud & DevOps',
    icon: '☁️',
    description: 'Infrastructure that scales without fear.',
    skills: ['AWS (Certified)', 'Kubernetes (EKS)', 'Terraform', 'Docker', 'Jenkins / CI-CD', 'Prometheus', 'Grafana'],
  },
  {
    id: 'ml',
    label: 'ML / Deep Learning',
    icon: '🧠',
    description: 'Training models, not just calling APIs.',
    skills: ['Machine Learning', 'Deep Learning', 'AWS SageMaker', 'Python / NumPy', 'Agentic AI (exploratory)', 'LLM Integration (exploratory)'],
  },
  {
    id: 'design',
    label: 'Design & Architecture',
    icon: '✦',
    description: 'Systems that are beautiful to look at and to read.',
    skills: ['UI/UX Design', 'System Design', 'Arcadia Modeling', 'RESTful APIs', 'Microservices Architecture', 'Cloud Architecture'],
  },
];

export type ProjectPriority = 'flagship' | 'major' | 'hackathon';

export type Project = {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  stack: string[];
  github: string;
  priority: ProjectPriority;
  type: string;
  highlights?: string[];
};

export const PROJECTS: Project[] = [
  {
    id: 'keepbeat',
    name: 'KeepBeat',
    subtitle: 'TwinPacemaker — Digital Twin Clinical Platform',
    description:
      'A high-fidelity medical IoT ecosystem that synchronises real-time cardiac and metabolic data across a hybrid fog-to-cloud architecture. Features a "Digital Twin" simulation of patient vitals (CGM + Pacemaker) integrated with a clinician-facing governance dashboard.',
    stack: ['FastAPI (Python)', 'Flutter (mobile + web)', 'Mosquitto MQTT', 'TimescaleDB', 'Docker Compose', 'Vite'],
    github: 'https://github.com/WafaQueen1/KeepBeat',
    priority: 'flagship',
    type: 'Full-Stack · IoT · Cloud',
    highlights: [
      '4-layer fog-to-cloud architecture',
      'Real-time MQTT data streaming',
      'Flutter mobile fog node + Vite doctor dashboard',
      'Docker-orchestrated infrastructure',
    ],
  },
  {
    id: 'aws-microservices',
    name: 'AWS Microservices',
    subtitle: 'E-Commerce on EKS — Production-Grade Infrastructure',
    description:
      'A production-grade, highly available microservices application on AWS EKS. Features a complete CI/CD pipeline (Jenkins + Kaniko), Terraform-provisioned VPC/RDS, and a full Prometheus + Grafana monitoring stack with CloudWatch integration.',
    stack: ['Terraform', 'AWS EKS', 'Kubernetes', 'Jenkins', 'Kaniko', 'Prometheus', 'Grafana', 'MySQL RDS', 'Docker'],
    github: 'https://github.com/WafaQueen1/my-microservices-aws-devops',
    priority: 'major',
    type: 'DevOps · Cloud Infrastructure',
    highlights: [
      'Custom VPC with public/private/isolated subnets',
      'Jenkins Kaniko multi-pod build isolation',
      'Grafana dashboard-as-code via ConfigMaps',
      'Solved 7 critical production challenges (CSRF, RBAC, private RDS seeding)',
    ],
  },
  {
    id: 'aithon-studify',
    name: 'AITHON-STUDIFY',
    subtitle: 'EdTech · Hackathon',
    description:
      'Built during a high-intensity hackathon to conceptualise, develop, and pitch an EdTech platform. Integrates smart automation and agentic AI patterns to enhance digital student experiences.',
    stack: ['HTML / CSS / JS', 'Agentic AI', 'Machine Learning'],
    github: 'https://github.com/WafaQueen1/AITHON-STUDIFY',
    priority: 'hackathon',
    type: 'Full-Stack · AI · Hackathon',
  },
  {
    id: 'medlink',
    name: 'MEDLINK-AITHON',
    subtitle: 'Healthcare Backend · Hackathon',
    description:
      'A digital healthcare prototype focused on secure data workflows and fast API routing, designed and built during a hackathon sprint. Backend schemas in FastAPI / Node.js for clinical tool integrations.',
    stack: ['FastAPI', 'Node.js', 'JavaScript'],
    github: 'https://github.com/WafaQueen1/MEDLINK-AITHON',
    priority: 'hackathon',
    type: 'Backend · Cloud · Hackathon',
  },
  {
    id: 'amd-hackathon',
    name: 'AMD Developer Hackathon ACT II',
    subtitle: 'Multi-Agent Research System',
    description:
      'An AI-powered multi-agent system built with CrewAI and advanced LLMs to coordinate specialised agents for research and target identification tasks. Exploratory agentic AI work.',
    stack: ['CrewAI', 'Python', 'Jupyter Notebook', 'LLMs'],
    github: 'https://github.com/WafaQueen1/AMD_Developer_Hackathon_ACTII',
    priority: 'hackathon',
    type: 'Agentic AI · Hackathon',
  },
];

export const TIMELINE = [
  {
    year: '2020',
    title: 'Baccalaureate',
    body: 'The first threshold. A door opening into the world of systems, logic, and infinite possibility.',
    icon: '◈',
  },
  {
    year: '2020–2023',
    title: 'Licence in Information Technology',
    body: 'University of Constantine 2 — Abdelhamid Mehri. Foundation in software engineering, algorithms, networking, and the first encounters with real code.',
    icon: '◈',
  },
  {
    year: '2023',
    title: 'AWS Certified Cloud Practitioner + Generative AI Specialist',
    body: 'Earned two AWS certifications in the same year. The cloud became a canvas, not just a concept.',
    icon: '☁️',
  },
  {
    year: '2023–Now',
    title: 'Engineering in Motion',
    body: 'Building KeepBeat (a real medical IoT platform), deploying microservices on EKS, training models on SageMaker, competing in hackathons, and always learning.',
    icon: '✦',
  },
] as const;
