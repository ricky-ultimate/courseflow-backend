import {
  PrismaClient,
  Role,
  Level,
  Semester,
  DayOfWeek,
  ClassType,
  ComplaintStatus,
  College,
} from '../src/generated/prisma';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

const CONFIG = {
  STUDENTS_PER_LEVEL: 10,
  COURSES_PER_LEVEL_PER_DEPT: 3,
};

const DEPARTMENTS = [
  // CBAS (Sciences)
  {
    code: 'CSC',
    name: 'Computer Science',
    college: College.CBAS,
    description: 'Study of computation and systems',
  },
  {
    code: 'MTH',
    name: 'Mathematics',
    college: College.CBAS,
    description: 'Study of numbers and patterns',
  },
  {
    code: 'PHY',
    name: 'Physics',
    college: College.CBAS,
    description: 'Study of matter and energy',
  },
  {
    code: 'CHM',
    name: 'Chemistry',
    college: College.CBAS,
    description: 'Study of substances',
  },
  {
    code: 'BIO',
    name: 'Biology',
    college: College.CBAS,
    description: 'Study of life',
  },
  // CHMS (Humanities/Social)
  {
    code: 'ENG',
    name: 'English',
    college: College.CHMS,
    description: 'Study of language and literature',
  },
  {
    code: 'ECO',
    name: 'Economics',
    college: College.CHMS,
    description: 'Study of production and consumption',
  },
];

const VENUE_DATA = [
  { name: 'University ICT Center', capacity: 500, isIct: true }, // For CBT
  { name: 'Lecture Hall 1', capacity: 150, isIct: false },
  { name: 'Lecture Hall 2', capacity: 150, isIct: false },
  { name: 'Auditorium A', capacity: 300, isIct: false },
  { name: 'Lab 1 (Computer)', capacity: 50, isIct: true }, // Mini CBT
  { name: 'Seminar Room B', capacity: 40, isIct: false },
  { name: 'Room 101', capacity: 30, isIct: false },
  { name: 'Room 205', capacity: 30, isIct: false },
];

const LECTURER_NAMES = [
  'Dr. Alan Turing',
  'Prof. Ada Lovelace',
  'Dr. Grace Hopper',
  'Mr. Charles Babbage',
  'Dr. John von Neumann',
  'Prof. Isaac Newton',
  'Dr. Marie Curie',
  'Mr. Nikola Tesla',
  'Dr. Albert Einstein',
  'Prof. Richard Feynman',
  'Dr. Katherine Johnson',
  'Mr. Tim Berners-Lee',
];

const getYearPrefixForLevel = (level: Level): string => {
  switch (level) {
    case Level.LEVEL_100:
      return '25';
    case Level.LEVEL_200:
      return '24';
    case Level.LEVEL_300:
      return '23';
    case Level.LEVEL_400:
      return '22';
    case Level.LEVEL_500:
      return '21';
    default:
      return '25';
  }
};

const getRandomItem = <T>(arr: T[]): T =>
  arr[Math.floor(Math.random() * arr.length)];

const getRandomTime = () => {
  const hour = Math.floor(Math.random() * (16 - 8) + 8);
  const start = `${hour.toString().padStart(2, '0')}:00`;
  const end = `${(hour + 1).toString().padStart(2, '0')}:00`;
  return { start, end };
};

async function main() {
  console.log('🌱 Starting database seeding...');

  const password = await argon2.hash('password123');
  const adminPassword = await argon2.hash('admin123');

  // Create Admin
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@courseflow.edu' },
    update: {},
    create: {
      matricNO: 'ADMIN001',
      email: 'admin@courseflow.edu',
      password: adminPassword,
      name: 'System Administrator',
      role: Role.ADMIN,
    },
  });
  console.log('✅ Admin user ready');

  // Create Verification Codes
  const verificationCodes = [
    {
      code: 'ADMIN-2025-MASTER',
      role: Role.ADMIN,
      description: 'Master admin verification code',
      maxUsage: null,
      createdBy: adminUser.id,
    },
    {
      code: 'LECTURER-2025',
      role: Role.LECTURER,
      description: 'General lecturer verification code',
      maxUsage: 50,
      createdBy: adminUser.id,
    },
  ];

  for (const codeData of verificationCodes) {
    await prisma.verificationCode.upsert({
      where: { code: codeData.code },
      update: {},
      create: codeData,
    });
  }
  console.log('✅ Verification codes ready');

  // Create Academic Session
  console.log('📅 Creating Academic Session...');
  const currentSession = await prisma.academicSession.upsert({
    where: { name: '2024/2025' },
    update: {},
    create: {
      name: '2024/2025',
      startDate: new Date('2024-09-01'),
      endDate: new Date('2025-07-31'),
      isActive: true,
    },
  });
  console.log('✅ Academic session created');

  // Create Venues
  console.log('buildings Seeding Venues...');
  const venueIds: string[] = [];
  for (const v of VENUE_DATA) {
    const venue = await prisma.venue.upsert({
      where: { name: v.name },
      update: {},
      create: v,
    });
    venueIds.push(venue.id);
  }

  // Create Departments with HODs
  console.log('🏗️  Seeding Departments...');
  const departmentIds: string[] = [];
  for (const dept of DEPARTMENTS) {
    const department = await prisma.department.upsert({
      where: { code: dept.code },
      update: {},
      create: {
        code: dept.code,
        name: dept.name,
        description: dept.description,
        college: dept.college,
      },
    });
    departmentIds.push(department.id);
  }

  // Create Lecturers & Lecturer Users
  console.log('👨‍🏫 Seeding Lecturers...');
  const lecturerIds: string[] = []; // IDs from Lecturer table (for courses)
  const lecturerUserIds: string[] = []; // IDs from User table (for HODs)

  for (let i = 0; i < LECTURER_NAMES.length; i++) {
    const name = LECTURER_NAMES[i];
    const dept = DEPARTMENTS[i % DEPARTMENTS.length];
    const email = `${name.split(' ')[1].toLowerCase()}@courseflow.edu`;

    const lecturer = await prisma.lecturer.upsert({
      where: { email },
      update: {},
      create: {
        name: name,
        email: email,
        phone: `+23480${Math.floor(Math.random() * 100000000)}`,
        departmentCode: dept.code,
      },
    });
    lecturerIds.push(lecturer.id);

    const staffId = `STAFF${(i + 1).toString().padStart(3, '0')}`;
    const lecturerUser = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        matricNO: staffId,
        email: email,
        password: password,
        name: name,
        role: Role.LECTURER,
      },
    });
    lecturerUserIds.push(lecturerUser.id);
  }

  // Assign HODs to departments
  console.log('👔 Assigning HODs to departments...');
  for (let i = 0; i < DEPARTMENTS.length && i < lecturerUserIds.length; i++) {
    await prisma.department.update({
      where: { code: DEPARTMENTS[i].code },
      data: { hodId: lecturerUserIds[i] },
    });
  }

  // Create General Studies Courses (University-wide)
  console.log('📖 Creating General Studies Courses...');
  const generalCourses = [
    {
      code: 'GST101',
      name: 'Use of English I',
      level: Level.LEVEL_100,
      semester: Semester.FIRST,
    },
    {
      code: 'GST102',
      name: 'Use of English II',
      level: Level.LEVEL_100,
      semester: Semester.SECOND,
    },
    {
      code: 'PIF101',
      name: 'Philosophy and Logic',
      level: Level.LEVEL_100,
      semester: Semester.FIRST,
    },
  ];

  for (const gst of generalCourses) {
    await prisma.course.upsert({
      where: { code: gst.code },
      update: {},
      create: {
        code: gst.code,
        name: gst.name,
        overview: 'General Studies course required for all students',
        level: gst.level,
        semester: gst.semester,
        credits: 2,
        departmentCode: 'ENG',
        lecturerId: lecturerIds[5],
        isGeneral: true,
        isLocked: true,
      },
    });
  }

  // Create Courses
  console.log('📚 Seeding Courses...');
  for (const dept of DEPARTMENTS) {
    for (const level of Object.values(Level)) {
      const levelNum = level.split('_')[1];

      for (let i = 1; i <= CONFIG.COURSES_PER_LEVEL_PER_DEPT; i++) {
        const courseCode = `${dept.code}${levelNum.charAt(0)}${i.toString().padStart(2, '0')}`;
        const lecturerId = getRandomItem(lecturerIds);
        const semester = i % 2 === 0 ? Semester.SECOND : Semester.FIRST;

        await prisma.course.upsert({
          where: { code: courseCode },
          update: {},
          create: {
            code: courseCode,
            name: `Introduction to ${dept.name} ${levelNum} - Part ${i}`,
            overview: `Comprehensive study of ${dept.name.toLowerCase()} concepts`,
            level: level,
            semester: semester,
            credits: Math.floor(Math.random() * 4) + 1,
            departmentCode: dept.code,
            lecturerId: lecturerId,
            isGeneral: false,
            isLocked: false,
          },
        });
      }
    }
  }

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
