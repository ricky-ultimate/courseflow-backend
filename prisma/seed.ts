import {
  PrismaClient,
  Role,
  Level,
  Semester,
  DayOfWeek,
  ClassType,
  ComplaintStatus,
} from '../src/generated/prisma';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

const CONFIG = {
  STUDENTS_PER_LEVEL: 10,
  COURSES_PER_LEVEL_PER_DEPT: 3,
};

const DEPARTMENTS = [
  {
    code: 'CSC',
    name: 'Computer Science',
    description:
      'Study of computation, information processing, and design of computer systems',
  },
  {
    code: 'MTH',
    name: 'Mathematics',
    description: 'Study of numbers, quantities, shapes, and patterns',
  },
  {
    code: 'PHY',
    name: 'Physics',
    description:
      'Study of matter, energy, and the fundamental forces of nature',
  },
  {
    code: 'CHM',
    name: 'Chemistry',
    description: 'Study of matter, its properties, and transformations',
  },
  {
    code: 'BIO',
    name: 'Biology',
    description: 'Study of living organisms and life processes',
  },
  {
    code: 'ENG',
    name: 'English',
    description: 'Study of English language, literature, and communication',
  },
  {
    code: 'ECO',
    name: 'Economics',
    description:
      'Study of production, distribution, and consumption of goods and services',
  },
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
      },
    });
    departmentIds.push(department.id);
  }

  // Create Lecturers
  console.log('👨‍🏫 Seeding Lecturers...');
  const lecturerIds: string[] = [];

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
  }

  // Assign HODs to departments
  console.log('👔 Assigning HODs to departments...');
  for (let i = 0; i < DEPARTMENTS.length && i < lecturerIds.length; i++) {
    await prisma.department.update({
      where: { code: DEPARTMENTS[i].code },
      data: { hodId: lecturerIds[i] },
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
      code: 'GST201',
      name: 'Nigerian Peoples and Culture',
      level: Level.LEVEL_200,
      semester: Semester.FIRST,
    },
    {
      code: 'GST202',
      name: 'Philosophy and Logic',
      level: Level.LEVEL_200,
      semester: Semester.SECOND,
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
        departmentCode: 'ENG', // Assign to English department
        lecturerId: lecturerIds[5], // Assign a lecturer
        isGeneral: true,
        isLocked: true, // Prevent deletion
      },
    });
  }

  // Create Courses & Schedules
  console.log('📚 Seeding Courses and Schedules...');
  for (const dept of DEPARTMENTS) {
    for (const level of Object.values(Level)) {
      const levelNum = level.split('_')[1];

      for (let i = 1; i <= CONFIG.COURSES_PER_LEVEL_PER_DEPT; i++) {
        const courseCode = `${dept.code}${levelNum.charAt(0)}${i.toString().padStart(2, '0')}`;
        const lecturerId = getRandomItem(lecturerIds);

        // Alternate between first and second semester
        const semester = i % 2 === 0 ? Semester.SECOND : Semester.FIRST;

        const course = await prisma.course.upsert({
          where: { code: courseCode },
          update: {},
          create: {
            code: courseCode,
            name: `Introduction to ${dept.name} ${levelNum} - Part ${i}`,
            overview: `Comprehensive study of ${dept.name.toLowerCase()} concepts for level ${levelNum}`,
            level: level,
            semester: semester,
            credits: Math.floor(Math.random() * 4) + 1,
            departmentCode: dept.code,
            lecturerId: lecturerId,
            isGeneral: false,
            isLocked: false,
          },
        });

        // Create schedules for the course
        const numSchedules = Math.floor(Math.random() * 2) + 1;
        for (let s = 0; s < numSchedules; s++) {
          const { start, end } = getRandomTime();

          const existingSchedule = await prisma.schedule.findFirst({
            where: {
              courseCode: course.code,
              sessionId: currentSession.id,
              dayOfWeek: Object.values(DayOfWeek)[s],
            },
          });

          if (!existingSchedule) {
            await prisma.schedule.create({
              data: {
                courseCode: course.code,
                semester: semester,
                sessionId: currentSession.id,
                dayOfWeek:
                  Object.values(DayOfWeek)[Math.floor(Math.random() * 5)], // Mon-Fri
                startTime: start,
                endTime: end,
                venue: getRandomItem(VENUES),
                type: getRandomItem(Object.values(ClassType)),
              },
            });
          }
        }

        // Create exam schedule
        const examDate =
          semester === Semester.FIRST
            ? new Date('2024-12-15')
            : new Date('2025-05-15');

        examDate.setDate(examDate.getDate() + Math.floor(Math.random() * 10));

        const existingExam = await prisma.examSchedule.findFirst({
          where: {
            courseCode: course.code,
            sessionId: currentSession.id,
            semester: semester,
          },
        });

        if (!existingExam) {
          await prisma.examSchedule.create({
            data: {
              courseCode: course.code,
              date: examDate,
              startTime: '09:00',
              endTime: '12:00',
              venue: getRandomItem(VENUES),
              invigilators: `${getRandomItem(LECTURER_NAMES)}, ${getRandomItem(LECTURER_NAMES)}`,
              semester: semester,
              sessionId: currentSession.id,
            },
          });
        }
      }
    }
  }

  // Create Students
  console.log('🎓 Seeding Students...');
  const studentIds: string[] = [];

  for (const level of Object.values(Level)) {
    const yearPrefix = getYearPrefixForLevel(level);

    for (let i = 1; i <= CONFIG.STUDENTS_PER_LEVEL; i++) {
      const sequence = i.toString().padStart(3, '0');
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

  // Create Complaints
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
          ),
        },
      });
    }
  }

  console.log('🎉 Database seeding completed successfully!');
  console.log('\n📋 Test Data Summary:');
  console.log(`   - Admin: admin@courseflow.edu / admin123`);
  console.log(`   - Active Session: ${currentSession.name}`);
  console.log(
    `   - Students Created: ~${Object.keys(Level).length * CONFIG.STUDENTS_PER_LEVEL}`,
  );
  console.log(`   - Password for all students: password123`);
  console.log(`   - Sample Matric (300L): 23010301001`);
  console.log(`   - Sample Matric (100L): 25010301001`);
  console.log(
    `   - General Studies Courses: 4 (GST101, GST102, GST201, GST202)`,
  );
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
