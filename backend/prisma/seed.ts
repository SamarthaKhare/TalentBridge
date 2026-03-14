import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SKILLS = [
  // Frontend
  { name: 'JavaScript', category: 'Frontend', aliases: ['js', 'ecmascript', 'es6'] },
  { name: 'TypeScript', category: 'Frontend', aliases: ['ts'] },
  { name: 'React', category: 'Frontend', aliases: ['reactjs', 'react.js'] },
  { name: 'Vue.js', category: 'Frontend', aliases: ['vue', 'vuejs'] },
  { name: 'Angular', category: 'Frontend', aliases: ['angularjs', 'angular.js'] },
  { name: 'Next.js', category: 'Frontend', aliases: ['nextjs'] },
  { name: 'HTML', category: 'Frontend', aliases: ['html5'] },
  { name: 'CSS', category: 'Frontend', aliases: ['css3', 'stylesheets'] },
  { name: 'TailwindCSS', category: 'Frontend', aliases: ['tailwind'] },
  { name: 'Bootstrap', category: 'Frontend', aliases: [] },
  { name: 'Sass', category: 'Frontend', aliases: ['scss'] },
  { name: 'Redux', category: 'Frontend', aliases: ['redux-toolkit'] },
  { name: 'Zustand', category: 'Frontend', aliases: [] },
  { name: 'Webpack', category: 'Frontend', aliases: [] },
  { name: 'Vite', category: 'Frontend', aliases: [] },
  // Backend
  { name: 'Node.js', category: 'Backend', aliases: ['nodejs', 'node'] },
  { name: 'Express.js', category: 'Backend', aliases: ['express', 'expressjs'] },
  { name: 'NestJS', category: 'Backend', aliases: ['nest'] },
  { name: 'Python', category: 'Backend', aliases: ['py', 'python3'] },
  { name: 'Django', category: 'Backend', aliases: [] },
  { name: 'Flask', category: 'Backend', aliases: [] },
  { name: 'FastAPI', category: 'Backend', aliases: [] },
  { name: 'Java', category: 'Backend', aliases: [] },
  { name: 'Spring Boot', category: 'Backend', aliases: ['spring', 'springboot'] },
  { name: 'Hibernate', category: 'Backend', aliases: [] },
  { name: 'Maven', category: 'Backend', aliases: [] },
  { name: 'Gradle', category: 'Backend', aliases: [] },
  { name: 'Go', category: 'Backend', aliases: ['golang'] },
  { name: 'Rust', category: 'Backend', aliases: [] },
  { name: 'C#', category: 'Backend', aliases: ['csharp', 'c-sharp'] },
  { name: '.NET', category: 'Backend', aliases: ['dotnet', 'asp.net'] },
  { name: 'Ruby', category: 'Backend', aliases: [] },
  { name: 'Ruby on Rails', category: 'Backend', aliases: ['rails', 'ror'] },
  { name: 'PHP', category: 'Backend', aliases: [] },
  { name: 'Laravel', category: 'Backend', aliases: [] },
  { name: 'GraphQL', category: 'Backend', aliases: ['gql'] },
  { name: 'REST API', category: 'Backend', aliases: ['restful', 'rest'] },
  // Database
  { name: 'PostgreSQL', category: 'Database', aliases: ['postgres', 'psql'] },
  { name: 'MySQL', category: 'Database', aliases: [] },
  { name: 'MongoDB', category: 'Database', aliases: ['mongo'] },
  { name: 'Redis', category: 'Database', aliases: [] },
  { name: 'SQLite', category: 'Database', aliases: [] },
  { name: 'Prisma', category: 'Database', aliases: [] },
  { name: 'Sequelize', category: 'Database', aliases: [] },
  { name: 'TypeORM', category: 'Database', aliases: [] },
  { name: 'Mongoose', category: 'Database', aliases: [] },
  { name: 'Elasticsearch', category: 'Database', aliases: ['elastic'] },
  // DevOps
  { name: 'Docker', category: 'DevOps', aliases: [] },
  { name: 'Kubernetes', category: 'DevOps', aliases: ['k8s'] },
  { name: 'AWS', category: 'DevOps', aliases: ['amazon web services'] },
  { name: 'Azure', category: 'DevOps', aliases: ['microsoft azure'] },
  { name: 'GCP', category: 'DevOps', aliases: ['google cloud', 'google cloud platform'] },
  { name: 'CI/CD', category: 'DevOps', aliases: ['continuous integration', 'continuous deployment'] },
  { name: 'GitHub Actions', category: 'DevOps', aliases: [] },
  { name: 'Jenkins', category: 'DevOps', aliases: [] },
  { name: 'Terraform', category: 'DevOps', aliases: [] },
  { name: 'Ansible', category: 'DevOps', aliases: [] },
  { name: 'Linux', category: 'DevOps', aliases: ['unix'] },
  { name: 'Nginx', category: 'DevOps', aliases: [] },
  // Mobile
  { name: 'React Native', category: 'Mobile', aliases: ['rn'] },
  { name: 'Flutter', category: 'Mobile', aliases: [] },
  { name: 'Swift', category: 'Mobile', aliases: ['ios'] },
  { name: 'Kotlin', category: 'Mobile', aliases: ['android'] },
  // Data & AI
  { name: 'Machine Learning', category: 'Data & AI', aliases: ['ml'] },
  { name: 'Deep Learning', category: 'Data & AI', aliases: ['dl'] },
  { name: 'TensorFlow', category: 'Data & AI', aliases: ['tf'] },
  { name: 'PyTorch', category: 'Data & AI', aliases: [] },
  { name: 'Pandas', category: 'Data & AI', aliases: [] },
  { name: 'NumPy', category: 'Data & AI', aliases: [] },
  { name: 'Scikit-learn', category: 'Data & AI', aliases: ['sklearn'] },
  { name: 'NLP', category: 'Data & AI', aliases: ['natural language processing'] },
  { name: 'Computer Vision', category: 'Data & AI', aliases: ['cv'] },
  { name: 'Data Analysis', category: 'Data & AI', aliases: [] },
  { name: 'SQL', category: 'Data & AI', aliases: [] },
  { name: 'Power BI', category: 'Data & AI', aliases: [] },
  { name: 'Tableau', category: 'Data & AI', aliases: [] },
  // Testing
  { name: 'Jest', category: 'Testing', aliases: [] },
  { name: 'Vitest', category: 'Testing', aliases: [] },
  { name: 'Cypress', category: 'Testing', aliases: [] },
  { name: 'Playwright', category: 'Testing', aliases: [] },
  { name: 'Selenium', category: 'Testing', aliases: [] },
  { name: 'Mocha', category: 'Testing', aliases: [] },
  // Tools
  { name: 'Git', category: 'Tools', aliases: ['github', 'gitlab', 'version control'] },
  { name: 'VS Code', category: 'Tools', aliases: ['vscode'] },
  { name: 'Jira', category: 'Tools', aliases: [] },
  { name: 'Figma', category: 'Tools', aliases: [] },
  { name: 'Postman', category: 'Tools', aliases: [] },
  // Soft Skills
  { name: 'Agile', category: 'Methodology', aliases: ['scrum', 'kanban'] },
  { name: 'System Design', category: 'Architecture', aliases: ['architecture'] },
  { name: 'Microservices', category: 'Architecture', aliases: [] },
  { name: 'Design Patterns', category: 'Architecture', aliases: [] },
  { name: 'Data Structures', category: 'CS Fundamentals', aliases: ['dsa', 'algorithms'] },
];

async function main() {
  console.log('Seeding database...');

  // Create skills
  const createdSkills: Record<string, string> = {};
  for (const skill of SKILLS) {
    const s = await prisma.skill.upsert({
      where: { name: skill.name },
      update: { category: skill.category, aliases: skill.aliases },
      create: { name: skill.name, category: skill.category, aliases: skill.aliases },
    });
    createdSkills[skill.name] = s.id;
  }
  console.log(`Seeded ${Object.keys(createdSkills).length} skills`);

  // Create HR user
  const hrPassword = await bcrypt.hash('HR@Talent2024', 12);
  const hrUser = await prisma.user.upsert({
    where: { email: 'hr@talentbridge.com' },
    update: {},
    create: {
      email: 'hr@talentbridge.com',
      passwordHash: hrPassword,
      name: 'Sarah Johnson',
      role: 'HR',
    },
  });

  await prisma.hrProfile.upsert({
    where: { userId: hrUser.id },
    update: {},
    create: {
      userId: hrUser.id,
      companyName: 'TechCorp Solutions',
      designation: 'Senior HR Manager',
      bio: 'Experienced HR professional with 10+ years in tech recruitment.',
    },
  });

  // Create candidate users
  const candidates = [
    {
      email: 'alice@example.com',
      password: 'Alice@1234',
      name: 'Alice Chen',
      headline: 'Full Stack Developer | React & Node.js',
      bio: 'Passionate full-stack developer with 4 years of experience building scalable web applications.',
      location: 'San Francisco, USA',
      experienceYears: 4,
      noticePeriodDays: 30,
      currentCtc: 95000,
      expectedCtc: 120000,
      skills: [
        { name: 'React', proficiency: 'EXPERT' as const, years: 4 },
        { name: 'Node.js', proficiency: 'EXPERT' as const, years: 4 },
        { name: 'TypeScript', proficiency: 'INTERMEDIATE' as const, years: 3 },
        { name: 'PostgreSQL', proficiency: 'INTERMEDIATE' as const, years: 3 },
        { name: 'Docker', proficiency: 'BEGINNER' as const, years: 1 },
        { name: 'TailwindCSS', proficiency: 'EXPERT' as const, years: 2 },
        { name: 'Git', proficiency: 'EXPERT' as const, years: 4 },
      ],
    },
    {
      email: 'bob@example.com',
      password: 'Bob@1234',
      name: 'Bob Martinez',
      headline: 'Backend Engineer | Java & Spring Boot',
      bio: 'Backend engineer specializing in Java microservices and cloud infrastructure.',
      location: 'Austin, USA',
      experienceYears: 6,
      noticePeriodDays: 60,
      currentCtc: 130000,
      expectedCtc: 150000,
      skills: [
        { name: 'Java', proficiency: 'EXPERT' as const, years: 6 },
        { name: 'Spring Boot', proficiency: 'EXPERT' as const, years: 5 },
        { name: 'PostgreSQL', proficiency: 'EXPERT' as const, years: 5 },
        { name: 'Docker', proficiency: 'INTERMEDIATE' as const, years: 3 },
        { name: 'Kubernetes', proficiency: 'INTERMEDIATE' as const, years: 2 },
        { name: 'AWS', proficiency: 'INTERMEDIATE' as const, years: 3 },
        { name: 'Microservices', proficiency: 'EXPERT' as const, years: 4 },
      ],
    },
    {
      email: 'carol@example.com',
      password: 'Carol@1234',
      name: 'Carol Williams',
      headline: 'Frontend Developer | Vue.js & React',
      bio: 'Creative frontend developer focused on building beautiful, accessible UIs.',
      location: 'London, UK',
      experienceYears: 3,
      noticePeriodDays: 14,
      currentCtc: 70000,
      expectedCtc: 85000,
      skills: [
        { name: 'Vue.js', proficiency: 'EXPERT' as const, years: 3 },
        { name: 'React', proficiency: 'INTERMEDIATE' as const, years: 2 },
        { name: 'JavaScript', proficiency: 'EXPERT' as const, years: 3 },
        { name: 'CSS', proficiency: 'EXPERT' as const, years: 3 },
        { name: 'TailwindCSS', proficiency: 'INTERMEDIATE' as const, years: 1 },
        { name: 'Figma', proficiency: 'INTERMEDIATE' as const, years: 2 },
      ],
    },
    {
      email: 'david@example.com',
      password: 'David@1234',
      name: 'David Kim',
      headline: 'Data Engineer | Python & ML',
      bio: 'Data engineer building pipelines and ML models for production systems.',
      location: 'Seoul, South Korea',
      experienceYears: 5,
      noticePeriodDays: 30,
      currentCtc: 100000,
      expectedCtc: 125000,
      skills: [
        { name: 'Python', proficiency: 'EXPERT' as const, years: 5 },
        { name: 'Machine Learning', proficiency: 'INTERMEDIATE' as const, years: 3 },
        { name: 'SQL', proficiency: 'EXPERT' as const, years: 5 },
        { name: 'Docker', proficiency: 'INTERMEDIATE' as const, years: 2 },
        { name: 'AWS', proficiency: 'INTERMEDIATE' as const, years: 3 },
        { name: 'TensorFlow', proficiency: 'BEGINNER' as const, years: 1 },
        { name: 'Pandas', proficiency: 'EXPERT' as const, years: 4 },
      ],
    },
    {
      email: 'emma@example.com',
      password: 'Emma@1234',
      name: 'Emma Davis',
      headline: 'DevOps Engineer | AWS & Kubernetes',
      bio: 'DevOps engineer automating cloud infrastructure and CI/CD pipelines.',
      location: 'Berlin, Germany',
      experienceYears: 7,
      noticePeriodDays: 45,
      currentCtc: 115000,
      expectedCtc: 140000,
      skills: [
        { name: 'AWS', proficiency: 'EXPERT' as const, years: 6 },
        { name: 'Docker', proficiency: 'EXPERT' as const, years: 5 },
        { name: 'Kubernetes', proficiency: 'EXPERT' as const, years: 4 },
        { name: 'Terraform', proficiency: 'INTERMEDIATE' as const, years: 3 },
        { name: 'Linux', proficiency: 'EXPERT' as const, years: 7 },
        { name: 'CI/CD', proficiency: 'EXPERT' as const, years: 5 },
        { name: 'Python', proficiency: 'INTERMEDIATE' as const, years: 3 },
      ],
    },
  ];

  for (const candidate of candidates) {
    const hash = await bcrypt.hash(candidate.password, 12);
    const user = await prisma.user.upsert({
      where: { email: candidate.email },
      update: {},
      create: {
        email: candidate.email,
        passwordHash: hash,
        name: candidate.name,
        role: 'CANDIDATE',
      },
    });

    const profile = await prisma.candidateProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        headline: candidate.headline,
        bio: candidate.bio,
        location: candidate.location,
        experienceYears: candidate.experienceYears,
        noticePeriodDays: candidate.noticePeriodDays,
        currentCtc: candidate.currentCtc,
        expectedCtc: candidate.expectedCtc,
        profileCompletionScore: 75,
      },
    });

    // Add skills
    for (const skill of candidate.skills) {
      const skillId = createdSkills[skill.name];
      if (skillId) {
        await prisma.candidateSkill.upsert({
          where: { candidateId_skillId: { candidateId: profile.id, skillId } },
          update: {},
          create: {
            candidateId: profile.id,
            skillId,
            proficiency: skill.proficiency,
            years: skill.years,
          },
        });
      }
    }
  }
  console.log('Seeded 5 candidates');

  // Create sample jobs
  const jobs = [
    {
      title: 'Senior Full Stack Developer',
      description: '<p>We are looking for a Senior Full Stack Developer to join our team. You will be responsible for building and maintaining web applications using React and Node.js.</p><h3>Requirements</h3><ul><li>4+ years of experience</li><li>Strong React and Node.js skills</li><li>Experience with PostgreSQL</li><li>Knowledge of Docker is a plus</li></ul>',
      location: 'San Francisco, USA',
      jobType: 'HYBRID' as const,
      experienceMin: 4,
      experienceMax: 8,
      salaryMin: 100000,
      salaryMax: 150000,
      status: 'OPEN' as const,
      deadline: new Date('2026-06-30'),
      skills: [
        { name: 'React', required: true, weight: 9 },
        { name: 'Node.js', required: true, weight: 8 },
        { name: 'TypeScript', required: true, weight: 7 },
        { name: 'PostgreSQL', required: false, weight: 6 },
        { name: 'Docker', required: false, weight: 4 },
        { name: 'TailwindCSS', required: false, weight: 3 },
      ],
      questions: [
        { text: 'Why are you interested in this role?', type: 'TEXT' as const, required: true },
        { text: 'Years of React experience?', type: 'NUMBER' as const, required: true },
        { text: 'Are you comfortable with remote work?', type: 'BOOLEAN' as const, required: false },
      ],
    },
    {
      title: 'Backend Engineer - Java',
      description: '<p>Join our backend team to build scalable microservices. We use Java, Spring Boot, and cloud-native technologies.</p><h3>What you will do</h3><ul><li>Design and implement microservices</li><li>Work with PostgreSQL and Redis</li><li>Deploy to AWS/Kubernetes</li></ul>',
      location: 'Austin, USA',
      jobType: 'REMOTE' as const,
      experienceMin: 3,
      experienceMax: 7,
      salaryMin: 110000,
      salaryMax: 160000,
      status: 'OPEN' as const,
      deadline: new Date('2026-07-15'),
      skills: [
        { name: 'Java', required: true, weight: 10 },
        { name: 'Spring Boot', required: true, weight: 9 },
        { name: 'PostgreSQL', required: true, weight: 7 },
        { name: 'Docker', required: false, weight: 5 },
        { name: 'Kubernetes', required: false, weight: 4 },
        { name: 'AWS', required: false, weight: 5 },
      ],
      questions: [
        { text: 'Describe your experience with microservices architecture.', type: 'TEXT' as const, required: true },
        { text: 'Preferred start date?', type: 'DATE' as const, required: false },
      ],
    },
    {
      title: 'DevOps Engineer',
      description: '<p>We need a DevOps engineer to manage our cloud infrastructure and CI/CD pipelines.</p><h3>Responsibilities</h3><ul><li>Manage AWS infrastructure</li><li>Build and maintain CI/CD pipelines</li><li>Containerization and orchestration</li></ul>',
      location: 'Berlin, Germany',
      jobType: 'ONSITE' as const,
      experienceMin: 5,
      experienceMax: 10,
      salaryMin: 90000,
      salaryMax: 140000,
      status: 'OPEN' as const,
      deadline: new Date('2026-05-31'),
      skills: [
        { name: 'AWS', required: true, weight: 9 },
        { name: 'Docker', required: true, weight: 8 },
        { name: 'Kubernetes', required: true, weight: 8 },
        { name: 'Terraform', required: false, weight: 6 },
        { name: 'Linux', required: true, weight: 7 },
        { name: 'CI/CD', required: true, weight: 7 },
        { name: 'Python', required: false, weight: 4 },
      ],
      questions: [],
    },
  ];

  for (const jobData of jobs) {
    const job = await prisma.job.create({
      data: {
        hrId: hrUser.id,
        title: jobData.title,
        description: jobData.description,
        location: jobData.location,
        jobType: jobData.jobType,
        experienceMin: jobData.experienceMin,
        experienceMax: jobData.experienceMax,
        salaryMin: jobData.salaryMin,
        salaryMax: jobData.salaryMax,
        status: jobData.status,
        deadline: jobData.deadline,
      },
    });

    // Add job skills
    for (const skill of jobData.skills) {
      const skillId = createdSkills[skill.name];
      if (skillId) {
        await prisma.jobSkill.create({
          data: {
            jobId: job.id,
            skillId,
            required: skill.required,
            weight: skill.weight,
          },
        });
      }
    }

    // Add questionnaire
    if (jobData.questions.length > 0) {
      const q = await prisma.jobQuestionnaire.create({
        data: { jobId: job.id },
      });
      for (let i = 0; i < jobData.questions.length; i++) {
        await prisma.questionnaireQuestion.create({
          data: {
            questionnaireId: q.id,
            questionText: jobData.questions[i].text,
            questionType: jobData.questions[i].type,
            isRequired: jobData.questions[i].required,
            order: i,
          },
        });
      }
    }

    console.log(`Created job: ${jobData.title}`);
  }

  // Create sample applications
  const aliceUser = await prisma.user.findUnique({ where: { email: 'alice@example.com' } });
  const bobUser = await prisma.user.findUnique({ where: { email: 'bob@example.com' } });
  const allJobs = await prisma.job.findMany({ include: { jobSkills: true } });

  if (aliceUser && allJobs[0]) {
    await prisma.application.create({
      data: {
        jobId: allJobs[0].id,
        candidateId: aliceUser.id,
        status: 'SHORTLISTED',
        matchScore: 82,
      },
    });
  }

  if (bobUser && allJobs[1]) {
    await prisma.application.create({
      data: {
        jobId: allJobs[1].id,
        candidateId: bobUser.id,
        status: 'INTERVIEW',
        matchScore: 91,
      },
    });
  }

  console.log('Seeded sample applications');
  console.log('Database seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
