import type { SkillCategory } from '../types/resume';

export interface SkillDefinition {
  name: string;
  category: SkillCategory;
  aliases?: string[];
  related?: string[];
}

export const SKILL_CATEGORIES: SkillCategory[] = [
  'Programming Languages',
  'Frontend Development',
  'Backend Development',
  'Frameworks',
  'Databases',
  'Cloud Platforms',
  'DevOps',
  'Testing',
  'Developer Tools',
  'Data Science',
  'Cybersecurity',
  'Design',
  'Communication',
  'Leadership',
  'Problem-Solving',
];

export const DEFAULT_SKILLS_DICTIONARY: SkillDefinition[] = [
  // Programming Languages
  { name: 'TypeScript', category: 'Programming Languages', aliases: ['ts'], related: ['JavaScript', 'React', 'Node.js'] },
  { name: 'JavaScript', category: 'Programming Languages', aliases: ['js', 'es6', 'ecmascript'], related: ['TypeScript', 'React', 'Node.js'] },
  { name: 'Python', category: 'Programming Languages', aliases: ['py', 'python3'], related: ['FastAPI', 'Django', 'Pandas'] },
  { name: 'Java', category: 'Programming Languages', related: ['Spring Boot', 'Maven', 'JUnit'] },
  { name: 'C++', category: 'Programming Languages', aliases: ['cpp'] },
  { name: 'C#', category: 'Programming Languages', aliases: ['csharp'], related: ['.NET'] },
  { name: 'Go', category: 'Programming Languages', aliases: ['golang'] },
  { name: 'Rust', category: 'Programming Languages' },
  { name: 'Ruby', category: 'Programming Languages', related: ['Ruby on Rails'] },
  { name: 'PHP', category: 'Programming Languages', related: ['Laravel'] },
  { name: 'Swift', category: 'Programming Languages', related: ['iOS'] },
  { name: 'Kotlin', category: 'Programming Languages', related: ['Android'] },
  { name: 'SQL', category: 'Programming Languages', related: ['PostgreSQL', 'MySQL'] },
  { name: 'R', category: 'Programming Languages' },
  { name: 'Scala', category: 'Programming Languages' },
  { name: 'Bash', category: 'Programming Languages', aliases: ['shell scripting', 'zsh'] },

  // Frontend Development
  { name: 'React', category: 'Frontend Development', aliases: ['reactjs', 'react.js'], related: ['TypeScript', 'Redux', 'Next.js'] },
  { name: 'HTML5', category: 'Frontend Development', aliases: ['html'] },
  { name: 'CSS3', category: 'Frontend Development', aliases: ['css', 'scss', 'sass'] },
  { name: 'Tailwind CSS', category: 'Frontend Development', aliases: ['tailwindcss', 'tailwind'] },
  { name: 'Redux', category: 'Frontend Development', aliases: ['redux toolkit', 'rtk'] },
  { name: 'Zustand', category: 'Frontend Development' },
  { name: 'Webpack', category: 'Frontend Development' },
  { name: 'Vite', category: 'Frontend Development' },
  { name: 'Web Accessibility', category: 'Frontend Development', aliases: ['a11y', 'wcag', 'aria'] },
  { name: 'Responsive Design', category: 'Frontend Development', aliases: ['mobile-first'] },
  { name: 'WebGL', category: 'Frontend Development', aliases: ['three.js', 'threejs'] },
  { name: 'WebAssembly', category: 'Frontend Development', aliases: ['wasm'] },

  // Backend Development
  { name: 'Node.js', category: 'Backend Development', aliases: ['nodejs', 'node'] },
  { name: 'REST APIs', category: 'Backend Development', aliases: ['rest', 'restful api', 'rest api'] },
  { name: 'GraphQL', category: 'Backend Development', aliases: ['apollo graphql'] },
  { name: 'gRPC', category: 'Backend Development' },
  { name: 'Microservices', category: 'Backend Development', aliases: ['microservice architecture'] },
  { name: 'WebSockets', category: 'Backend Development', aliases: ['socket.io'] },
  { name: 'Authentication', category: 'Backend Development', aliases: ['oauth', 'jwt', 'oidc'] },
  { name: 'Message Queues', category: 'Backend Development', aliases: ['kafka', 'rabbitmq', 'sqs'] },

  // Frameworks
  { name: 'Next.js', category: 'Frameworks', aliases: ['nextjs'] },
  { name: 'Angular', category: 'Frameworks', aliases: ['angularjs'] },
  { name: 'Vue.js', category: 'Frameworks', aliases: ['vue', 'vuejs', 'nuxt'] },
  { name: 'Svelte', category: 'Frameworks', aliases: ['sveltekit'] },
  { name: 'Express.js', category: 'Frameworks', aliases: ['express', 'expressjs'] },
  { name: 'NestJS', category: 'Frameworks', aliases: ['nest.js'] },
  { name: 'Django', category: 'Frameworks' },
  { name: 'FastAPI', category: 'Frameworks' },
  { name: 'Flask', category: 'Frameworks' },
  { name: 'Spring Boot', category: 'Frameworks', aliases: ['spring'] },
  { name: '.NET', category: 'Frameworks', aliases: ['asp.net', 'dotnet'] },
  { name: 'Ruby on Rails', category: 'Frameworks', aliases: ['rails'] },
  { name: 'Laravel', category: 'Frameworks' },
  { name: 'React Native', category: 'Frameworks' },
  { name: 'Flutter', category: 'Frameworks' },

  // Databases
  { name: 'PostgreSQL', category: 'Databases', aliases: ['postgres', 'psql'] },
  { name: 'MySQL', category: 'Databases', aliases: ['mariadb'] },
  { name: 'MongoDB', category: 'Databases', aliases: ['mongo'] },
  { name: 'Redis', category: 'Databases' },
  { name: 'SQLite', category: 'Databases' },
  { name: 'Elasticsearch', category: 'Databases', aliases: ['opensearch'] },
  { name: 'DynamoDB', category: 'Databases' },
  { name: 'IndexedDB', category: 'Databases' },
  { name: 'Prisma', category: 'Databases' },
  { name: 'Drizzle ORM', category: 'Databases', aliases: ['drizzle'] },

  // Cloud Platforms
  { name: 'AWS', category: 'Cloud Platforms', aliases: ['amazon web services', 'ec2', 's3', 'lambda', 'ecs'] },
  { name: 'Google Cloud Platform', category: 'Cloud Platforms', aliases: ['gcp', 'google cloud', 'cloud run'] },
  { name: 'Microsoft Azure', category: 'Cloud Platforms', aliases: ['azure'] },
  { name: 'Cloudflare', category: 'Cloud Platforms', aliases: ['cloudflare workers'] },
  { name: 'Vercel', category: 'Cloud Platforms' },
  { name: 'Netlify', category: 'Cloud Platforms' },
  { name: 'Serverless', category: 'Cloud Platforms' },

  // DevOps
  { name: 'Docker', category: 'DevOps', aliases: ['containers', 'dockerfile'] },
  { name: 'Kubernetes', category: 'DevOps', aliases: ['k8s', 'helm'] },
  { name: 'CI/CD', category: 'DevOps', aliases: ['github actions', 'gitlab ci', 'jenkins', 'circleci'] },
  { name: 'Terraform', category: 'DevOps', aliases: ['iac', 'infrastructure as code'] },
  { name: 'Linux', category: 'DevOps', aliases: ['ubuntu', 'debian', 'centos'] },
  { name: 'Nginx', category: 'DevOps' },
  { name: 'Prometheus', category: 'DevOps', aliases: ['grafana', 'observability'] },
  { name: 'Ansible', category: 'DevOps' },

  // Testing
  { name: 'Jest', category: 'Testing' },
  { name: 'Vitest', category: 'Testing' },
  { name: 'Playwright', category: 'Testing' },
  { name: 'Cypress', category: 'Testing' },
  { name: 'Selenium', category: 'Testing' },
  { name: 'Pytest', category: 'Testing' },
  { name: 'JUnit', category: 'Testing' },
  { name: 'Unit Testing', category: 'Testing', aliases: ['tdd', 'test-driven development'] },
  { name: 'Integration Testing', category: 'Testing', aliases: ['e2e testing', 'end-to-end testing'] },

  // Developer Tools
  { name: 'Git', category: 'Developer Tools', aliases: ['github', 'gitlab', 'bitbucket'] },
  { name: 'VS Code', category: 'Developer Tools', aliases: ['visual studio code'] },
  { name: 'Jira', category: 'Developer Tools', aliases: ['linear', 'asana'] },
  { name: 'Postman', category: 'Developer Tools', aliases: ['insomnia', 'swagger', 'openapi'] },
  { name: 'npm', category: 'Developer Tools', aliases: ['pnpm', 'yarn'] },
  { name: 'ESLint', category: 'Developer Tools', aliases: ['prettier'] },

  // Data Science
  { name: 'Machine Learning', category: 'Data Science', aliases: ['ml', 'supervised learning'] },
  { name: 'Deep Learning', category: 'Data Science', aliases: ['neural networks'] },
  { name: 'Natural Language Processing', category: 'Data Science', aliases: ['nlp', 'text mining'] },
  { name: 'Pandas', category: 'Data Science' },
  { name: 'NumPy', category: 'Data Science' },
  { name: 'Scikit-learn', category: 'Data Science', aliases: ['sklearn'] },
  { name: 'PyTorch', category: 'Data Science' },
  { name: 'TensorFlow', category: 'Data Science', aliases: ['keras'] },
  { name: 'Data Visualization', category: 'Data Science', aliases: ['tableau', 'power bi', 'matplotlib', 'recharts'] },
  { name: 'ETL Pipelines', category: 'Data Science', aliases: ['etl', 'airflow', 'spark', 'apache spark'] },
  { name: 'Statistical Analysis', category: 'Data Science', aliases: ['statistics', 'a/b testing'] },

  // Cybersecurity
  { name: 'Application Security', category: 'Cybersecurity', aliases: ['appsec', 'owasp'] },
  { name: 'Penetration Testing', category: 'Cybersecurity', aliases: ['pentesting', 'vulnerability assessment'] },
  { name: 'Network Security', category: 'Cybersecurity', aliases: ['firewalls', 'ids', 'ips'] },
  { name: 'IAM', category: 'Cybersecurity', aliases: ['identity and access management', 'rbac', 'sso'] },
  { name: 'Cryptography', category: 'Cybersecurity', aliases: ['encryption', 'tls', 'ssl'] },
  { name: 'SOC 2', category: 'Cybersecurity', aliases: ['iso 27001', 'gdpr', 'hipaa'] },
  { name: 'SIEM', category: 'Cybersecurity', aliases: ['splunk'] },

  // Design
  { name: 'Figma', category: 'Design' },
  { name: 'UI/UX Design', category: 'Design', aliases: ['ui design', 'ux design', 'user experience', 'user interface'] },
  { name: 'Design Systems', category: 'Design', aliases: ['component library'] },
  { name: 'Wireframing', category: 'Design', aliases: ['prototyping'] },
  { name: 'User Research', category: 'Design', aliases: ['usability testing'] },
  { name: 'Adobe Creative Suite', category: 'Design', aliases: ['photoshop', 'illustrator'] },

  // Communication
  { name: 'Technical Writing', category: 'Communication', aliases: ['documentation', 'rfc'] },
  { name: 'Stakeholder Management', category: 'Communication', aliases: ['stakeholder communication'] },
  { name: 'Cross-functional Collaboration', category: 'Communication', aliases: ['cross functional', 'cross-functional'] },
  { name: 'Public Speaking', category: 'Communication', aliases: ['presentations'] },
  { name: 'Client Communication', category: 'Communication', aliases: ['client facing', 'client-facing'] },

  // Leadership
  { name: 'Team Leadership', category: 'Leadership', aliases: ['mentoring', 'mentorship', 'people management'] },
  { name: 'Agile / Scrum', category: 'Leadership', aliases: ['agile', 'scrum', 'kanban'] },
  { name: 'Project Management', category: 'Leadership', aliases: ['program management', 'roadmap planning'] },
  { name: 'Code Review', category: 'Leadership', aliases: ['architecture review'] },
  { name: 'Strategic Planning', category: 'Leadership', aliases: ['product strategy'] },

  // Problem-Solving
  { name: 'System Design', category: 'Problem-Solving', aliases: ['distributed systems', 'architecture'] },
  { name: 'Performance Optimization', category: 'Problem-Solving', aliases: ['latency optimization', 'profiling'] },
  { name: 'Debugging', category: 'Problem-Solving', aliases: ['troubleshooting', 'root cause analysis'] },
  { name: 'Algorithms & Data Structures', category: 'Problem-Solving', aliases: ['algorithms', 'data structures'] },
  { name: 'Process Improvement', category: 'Problem-Solving', aliases: ['automation', 'workflow optimization'] },
];
