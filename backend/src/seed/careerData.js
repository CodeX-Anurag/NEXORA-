const SKILLS_SEED = [
  { name: "JavaScript", category: "Language", description: "Core programming language for modern web development", defaultRequiredLevel: 85 },
  { name: "React", category: "Frontend", description: "Declarative component-based UI library", defaultRequiredLevel: 80 },
  { name: "Node.js", category: "Backend", description: "JavaScript runtime for building scalable server APIs", defaultRequiredLevel: 80 },
  { name: "Express", category: "Backend", description: "Fast, unopinionated web framework for Node.js", defaultRequiredLevel: 75 },
  { name: "MongoDB", category: "Database", description: "NoSQL document-oriented database system", defaultRequiredLevel: 75 },
  { name: "SQL", category: "Database", description: "Relational database query language and schema design", defaultRequiredLevel: 80 },
  { name: "Git", category: "DevOps", description: "Distributed version control system", defaultRequiredLevel: 80 },
  { name: "Python", category: "Language", description: "Versatile programming language for web, data science, and AI", defaultRequiredLevel: 90 },
  { name: "C++", category: "Language", description: "High-performance compiled language for system architecture", defaultRequiredLevel: 70 },
  { name: "HTML", category: "Frontend", description: "Standard markup language for web document structure", defaultRequiredLevel: 90 },
  { name: "CSS", category: "Frontend", description: "Stylesheet language for web styling and responsive design", defaultRequiredLevel: 85 },
  { name: "REST APIs", category: "Backend", description: "Architectural style for HTTP web services", defaultRequiredLevel: 85 },
  { name: "Deployment", category: "DevOps", description: "Hosting, CI/CD pipelines, and cloud platform configuration", defaultRequiredLevel: 70 },
  { name: "Data Structures", category: "Computer Science", description: "Arrays, linked lists, trees, graphs, and memory layout", defaultRequiredLevel: 85 },
  { name: "Algorithms", category: "Computer Science", description: "Sorting, searching, recursion, and algorithmic complexity", defaultRequiredLevel: 85 }
];

const CAREERS_SEED = [
  {
    title: "Full Stack Developer",
    description: "Builds complete end-to-end web applications across client UIs and server APIs.",
    requiredSkills: [
      { skillName: "JavaScript", requiredLevel: 85 },
      { skillName: "React", requiredLevel: 80 },
      { skillName: "Node.js", requiredLevel: 80 },
      { skillName: "Express", requiredLevel: 75 },
      { skillName: "MongoDB", requiredLevel: 75 },
      { skillName: "REST APIs", requiredLevel: 85 },
      { skillName: "Git", requiredLevel: 80 },
      { skillName: "HTML", requiredLevel: 85 },
      { skillName: "CSS", requiredLevel: 80 }
    ]
  },
  {
    title: "Frontend Developer",
    description: "Specializes in building responsive, accessible, and user-friendly web interfaces.",
    requiredSkills: [
      { skillName: "React", requiredLevel: 90 },
      { skillName: "JavaScript", requiredLevel: 90 },
      { skillName: "HTML", requiredLevel: 90 },
      { skillName: "CSS", requiredLevel: 90 },
      { skillName: "Git", requiredLevel: 80 },
      { skillName: "REST APIs", requiredLevel: 80 }
    ]
  },
  {
    title: "Backend Developer",
    description: "Focuses on server-side architecture, REST APIs, database models, and security.",
    requiredSkills: [
      { skillName: "Node.js", requiredLevel: 90 },
      { skillName: "Express", requiredLevel: 85 },
      { skillName: "MongoDB", requiredLevel: 80 },
      { skillName: "SQL", requiredLevel: 80 },
      { skillName: "REST APIs", requiredLevel: 90 },
      { skillName: "Git", requiredLevel: 80 }
    ]
  },
  {
    title: "Data Scientist",
    description: "Analyzes complex datasets, builds statistical models, and extracts data insights.",
    requiredSkills: [
      { skillName: "Python", requiredLevel: 90 },
      { skillName: "SQL", requiredLevel: 85 },
      { skillName: "Algorithms", requiredLevel: 80 },
      { skillName: "Git", requiredLevel: 75 }
    ]
  },
  {
    title: "AI/ML Engineer",
    description: "Designs and deploys artificial intelligence systems and machine learning models.",
    requiredSkills: [
      { skillName: "Python", requiredLevel: 90 },
      { skillName: "Data Structures", requiredLevel: 85 },
      { skillName: "Algorithms", requiredLevel: 85 },
      { skillName: "C++", requiredLevel: 70 },
      { skillName: "Git", requiredLevel: 80 }
    ]
  }
];

module.exports = {
  SKILLS_SEED,
  CAREERS_SEED
};
