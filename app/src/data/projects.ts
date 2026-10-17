export type Project = {
  id: number
  phase: string
  title: string
  techStack: string[]
  description: string
  liveUrl: string
  githubUrl: string
  color: string
  brightness: number // 0-1, controls moon glow intensity
}

export const projects: Project[] = [
  {
    id: 1,
    phase: 'new-moon',
    title: 'Microservices on AWS',
    techStack: ['AWS', 'Docker', 'Kubernetes', 'Terraform', 'GitHub Actions'],
    description:
      'Production-grade microservices architecture deployed on AWS. Includes containerised services, infrastructure-as-code with Terraform, and a fully automated CI/CD pipeline using GitHub Actions.',
    liveUrl: 'https://github.com/WafaaFelahi/my-microservices-aws-devops',
    githubUrl: 'https://github.com/WafaaFelahi/my-microservices-aws-devops',
    color: '#1a1a2e',
    brightness: 0.05,
  },
  {
    id: 2,
    phase: 'waxing-crescent',
    title: 'DevOps Project 2',
    techStack: ['Jenkins', 'Docker', 'AWS', 'Ansible', 'Linux'],
    description:
      'End-to-end DevOps project featuring automated server provisioning with Ansible, containerised deployments, and Jenkins-based continuous delivery pipelines on AWS infrastructure.',
    liveUrl: 'https://github.com/WafaaFelahi/DevopsProject2',
    githubUrl: 'https://github.com/WafaaFelahi/DevopsProject2',
    color: '#1e1e3a',
    brightness: 0.22,
  },
  {
    id: 3,
    phase: 'first-quarter',
    title: 'Jenkins Learning App',
    techStack: ['Jenkins', 'Node.js', 'Docker', 'Maven', 'CI/CD'],
    description:
      'Hands-on Jenkins pipeline project demonstrating build automation, test orchestration, and blue-green deployments for a Node.js application — a live DevOps learning lab.',
    liveUrl: 'https://github.com/WafaaFelahi/learn-jenkins-app',
    githubUrl: 'https://github.com/WafaaFelahi/learn-jenkins-app',
    color: '#2a2a4a',
    brightness: 0.42,
  },
  {
    id: 4,
    phase: 'waxing-gibbous',
    title: 'KeepBeat',
    techStack: ['React', 'Node.js', 'MongoDB', 'Express', 'WebSockets'],
    description:
      'Real-time music collaboration platform where musicians can share beats, sync playback, and jam together remotely. Features live audio streaming, user rooms, and beat versioning.',
    liveUrl: 'https://github.com/WafaaFelahi/KeepBeat',
    githubUrl: 'https://github.com/WafaaFelahi/KeepBeat',
    color: '#3a3060',
    brightness: 0.68,
  },
  {
    id: 5,
    phase: 'full-moon',
    title: 'AMD Developer Hackathon — ACT II',
    techStack: ['Python', 'AMD ROCm', 'AI/ML', 'FastAPI', 'React'],
    description:
      'Hackathon project built for AMD\'s ACT II developer challenge. Leverages AMD GPU acceleration for AI-powered inference pipelines. Showcases hardware-optimised ML model serving.',
    liveUrl: 'https://github.com/WafaaFelahi/AMD_Developer_Hackathon_ACTII',
    githubUrl: 'https://github.com/WafaaFelahi/AMD_Developer_Hackathon_ACTII',
    color: '#e8e8ff',
    brightness: 1.0,
  },
  {
    id: 6,
    phase: 'waning-gibbous',
    title: 'GOMCODE — NVIDIA AI Hackathon',
    techStack: ['Python', 'NVIDIA NIM', 'LangChain', 'FastAPI', 'React'],
    description:
      'Agentic AI coding assistant built at the GOMCODE × NVIDIA hackathon. Uses NVIDIA NIM inference to power an autonomous agent that explains, debugs, and refactors code in real time.',
    liveUrl: 'https://github.com/WafaaFelahi/GOMCODE_NVIDIA_AI_Hackathon',
    githubUrl: 'https://github.com/WafaaFelahi/GOMCODE_NVIDIA_AI_Hackathon',
    color: '#c8d4f0',
    brightness: 0.75,
  },
  {
    id: 7,
    phase: 'last-quarter',
    title: 'This Surreal Portfolio',
    techStack: ['React', 'Three.js', 'GSAP', 'Tailwind', 'WebGL'],
    description:
      'The immersive 3D portfolio you are experiencing right now — a surreal journey through moonlit space, a snowy forest, a lotus lake, and an infinity moon gallery.',
    liveUrl: 'https://wafafelahi.dev',
    githubUrl: 'https://github.com/WafaaFelahi',
    color: '#a0b0d8',
    brightness: 0.5,
  },
  {
    id: 8,
    phase: 'waning-crescent',
    title: 'Cloud Monitoring Tool',
    techStack: ['Go', 'Prometheus', 'Grafana', 'AWS', 'Docker'],
    description:
      'Lightweight cloud infrastructure monitoring service. Aggregates metrics from AWS resources, exposes them to Prometheus, and renders live dashboards in Grafana with alert routing.',
    liveUrl: '#',
    githubUrl: 'https://github.com/WafaaFelahi',
    color: '#707090',
    brightness: 0.15,
  },
]
