import {
  PrismaClient,
  Role,
  Level,
  DayOfWeek,
  ClassType,
  ComplaintStatus,
} from '../src/generated/prisma';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

// Configuration for data volume
const CONFIG = {
  STUDENTS_PER_LEVEL: 10, // Generates 50 students total (10 * 5 levels)
  COURSES_PER_LEVEL_PER_DEPT: 3,
};

// Data Helpers
const DEPARTMENTS = [
  { code: 'CSC', name: 'Computer Science' },
  { code: 'MTH', name: 'Mathematics' },
  { code: 'PHY', name: 'Physics' },
  { code: 'CHM', name: 'Chemistry' },
  { code: 'BIO', name: 'Biology' },
  { code: 'ENG', name: 'English' },
  { code: 'ECO', name: 'Economics' },
];

const VENUES = [
  'Lecture Hall 1',
  'Lecture Hall 2',
  'Auditorium A',
  'Lab 1 (Computer)',
  'Lab 2 (Science)',
  'Seminar Room B',
  'Room 101',
  'Room 205',
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

// Helper to get year prefix based on current 2025 logic
const getYearPrefixForLevel = (level: Level): string => {
  switch (level) {
    case Level.LEVEL_100:
      return '25'; // Admitted 2025
    case Level.LEVEL_200:
      return '24'; // Admitted 2024
    case Level.LEVEL_300:
      return '23'; // Admitted 2023
    case Level.LEVEL_400:
      return '22'; // Admitted 2022
    case Level.LEVEL_500:
      return '21'; // Admitted 2021
    default:
      return '25';
  }
};

const getRandomItem = <T>(arr: T[]): T =>
  arr[Math.floor(Math.random() * arr.length)];

const getRandomTime = () => {
  const hour = Math.floor(Math.random() * (16 - 8) + 8); // 08:00 to 16:00
  const start = `${hour.toString().padStart(2, '0')}:00`;
  const end = `${(hour + 1).toString().padStart(2, '0')}:00`; // 1 hour duration
  return { start, end };
};

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Password Hashing (Reuse for performance)
  const password = await argon2.hash('password123');
  const adminPassword = await argon2.hash('admin123');

  // 2. Create Admin
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

  // 3. Create Verification Codes
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

  // 4. Create Departments
  console.log('🏗️  Seeding Departments...');
  for (const dept of DEPARTMENTS) {
    await prisma.department.upsert({
      where: { code: dept.code },
      update: {},
      create: {
        code: dept.code,
        name: dept.name,
      },
    });
  }

  // 5. Create Lecturers
  console.log('👨‍🏫 Seeding Lecturers...');
  const lecturerIds: string[] = [];

  for (let i = 0; i < LECTURER_NAMES.length; i++) {
    const name = LECTURER_NAMES[i];
    const dept = DEPARTMENTS[i % DEPARTMENTS.length]; // Distribute across depts

    // Check if lecturer exists to avoid recreating unique constraint violations on re-seed
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
  }

  // 6. Create Courses & Schedules
  console.log('📚 Seeding Courses and Schedules...');
  for (const dept of DEPARTMENTS) {
    for (const level of Object.values(Level)) {
      const levelNum = level.split('_')[1]; // "100" from "LEVEL_100"

      for (let i = 1; i <= CONFIG.COURSES_PER_LEVEL_PER_DEPT; i++) {
        const courseCode = `${dept.code}${levelNum.charAt(0)}${i.toString().padStart(2, '0')}`; // e.g., CSC101

        // Find a random lecturer from this department (or any if strict filtering not applied here)
        // Ideally filter lecturerIds by department, but for seed simplicity we pick random or from pre-assigned logic
        // Let's just pick a random lecturer ID from created ones
        const lecturerId = getRandomItem(lecturerIds);

        const course = await prisma.course.upsert({
          where: { code: courseCode },
          update: {},
          create: {
            code: courseCode,
            name: `Introduction to ${dept.name} ${levelNum} - Part ${i}`,
            level: level,
            credits: Math.floor(Math.random() * 4) + 1, // 1-4 credits
            departmentCode: dept.code,
            lecturerId: lecturerId,
          },
        });

        // Create 1 or 2 schedules for this course
        const numSchedules = Math.floor(Math.random() * 2) + 1;
        for (let s = 0; s < numSchedules; s++) {
          const { start, end } = getRandomTime();

          // Using create instead of upsert for schedules as they don't have natural unique keys other than ID
          // We check existence first to be safe or just create (cleaning DB before seeding is recommended)
          const existingSchedule = await prisma.schedule.findFirst({
            where: {
              courseCode: course.code,
              dayOfWeek: Object.values(DayOfWeek)[s],
            },
          });

          if (!existingSchedule) {
            await prisma.schedule.create({
              data: {
                courseCode: course.code,
                dayOfWeek:
                  Object.values(DayOfWeek)[Math.floor(Math.random() * 7)],
                startTime: start,
                endTime: end,
                venue: getRandomItem(VENUES),
                type: getRandomItem(Object.values(ClassType)),
              },
            });
          }
        }
      }
    }
  }

  // 7. Create Students (Users)
  console.log('🎓 Seeding Students...');
  const studentIds: string[] = [];

  for (const level of Object.values(Level)) {
    const yearPrefix = getYearPrefixForLevel(level);

    for (let i = 1; i <= CONFIG.STUDENTS_PER_LEVEL; i++) {
      // Logic: YY + 010301 + sequence (padded)
      // e.g., 23010301005
      const sequence = i.toString().padStart(3, '0');
      // Added a fixed middle part "010301" to simulate faculty/dept codes
      const matricNO = `${yearPrefix}010301${sequence}`;
      const email = `student${matricNO}@courseflow.edu`;

      const student = await prisma.user.upsert({
        where: { matricNO },
        update: {},
        create: {
          matricNO,
          email,
          password: password,
          name: `Student ${matricNO}`,
          role: Role.STUDENT,
        },
      });
      studentIds.push(student.id);
    }
  }

  // 8. Create Complaints
  console.log('📝 Seeding Complaints...');
  for (let i = 0; i < 20; i++) {
    const studentId = getRandomItem(studentIds);
    const student = await prisma.user.findUnique({ where: { id: studentId } });

    if (student) {
      await prisma.complaint.create({
        data: {
          userId: studentId,
          name: student.name || 'Anonymous',
          email: student.email,
          department: getRandomItem(DEPARTMENTS).name,
          subject: `Issue regarding ${getRandomItem(['Course Registration', 'Result', 'Timetable', 'Venue'])}`,
          message:
            'I am experiencing difficulties with my dashboard. Please assist.',
          status: getRandomItem(Object.values(ComplaintStatus)),
          createdAt: new Date(
            Date.now() - Math.floor(Math.random() * 1000000000),
          ), // Random time in past
        },
      });
    }
  }

  console.log('🎉 Database seeding completed successfully!');
  console.log('\n📋 Test Data Summary:');
  console.log(`   - Admin: admin@courseflow.edu / admin123`);
  console.log(
    `   - Students Created: ~${Object.keys(Level).length * CONFIG.STUDENTS_PER_LEVEL}`,
  );
  console.log(`   - Password for all students: password123`);
  console.log(`   - Sample Matric (300L): 23010301001`);
  console.log(`   - Sample Matric (100L): 25010301001`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
