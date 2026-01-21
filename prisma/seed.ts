import {
  PrismaClient,
  Role,
  Level,
  Semester,
  DayOfWeek,
  ClassType,
  ComplaintStatus,
  College,
  Venue, // Imported Venue type to fix the TypeScript error
} from '../src/generated/prisma';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

const CONFIG = {
  STUDENTS_TO_SEED: 20,
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

const STUDENT_NAMES = [
  'James Student',
  'Mary Student',
  'John Student',
  'Patricia Student',
  'Robert Student',
  'Jennifer Student',
  'Michael Student',
  'Linda Student',
  'William Student',
  'Elizabeth Student',
];

const COMPLAINT_SUBJECTS = [
  'Course Registration Issue',
  'Grade Missing',
  'Portal Login Error',
  'Venue Conflict',
  'Lecturer Absence',
  'Facility Maintenance',
];

const getRandomItem = <T>(arr: T[]): T =>
  arr[Math.floor(Math.random() * arr.length)];

// Helper to get non-overlapping times roughly
const TIME_SLOTS = [
  { start: '08:00', end: '10:00' },
  { start: '10:00', end: '12:00' },
  { start: '12:00', end: '14:00' },
  { start: '14:00', end: '16:00' },
  { start: '16:00', end: '18:00' },
];

async function main() {
  console.log('🌱 Starting database seeding...');

  const password = await argon2.hash('password123');
  const adminPassword = await argon2.hash('admin123');

  // 1. Create Admin
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@courseflow.edu' },
    update: {
      isActive: true, // Ensure admin is active if previously soft deleted
    },
    create: {
      matricNO: 'ADMIN001',
      email: 'admin@courseflow.edu',
      password: adminPassword,
      name: 'System Administrator',
      role: Role.ADMIN,
    },
  });
  console.log('✅ Admin user ready');

  // 2. Create Verification Codes
  const verificationCodes = [
    {
      code: 'ADMIN-2025-MASTER',
      role: Role.ADMIN,
      description: 'Master admin verification code',
      maxUsage: null,
      createdBy: adminUser.id,
    },
    {
      code: 'HOD-2025',
      role: Role.HOD,
      description: 'HOD verification code',
      maxUsage: 50,
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

  // 3. Create Academic Session
  console.log('📅 Creating Academic Session...');
  const currentSession = await prisma.academicSession.upsert({
    where: { name: '2024/2025' },
    update: { isActive: true },
    create: {
      name: '2024/2025',
      startDate: new Date('2024-09-01'),
      endDate: new Date('2025-07-31'),
      isActive: true,
    },
  });

  // 4. Create Venues
  console.log('buildings Seeding Venues...');
  // FIX: Explicitly type the array as Venue[] to prevent "never" type inference
  const venues: Venue[] = [];

  for (const v of VENUE_DATA) {
    const venue = await prisma.venue.upsert({
      where: { name: v.name },
      update: {
        capacity: v.capacity,
        isIct: v.isIct,
        isActive: true,
      },
      create: v,
    });
    venues.push(venue);
  }

  const ictVenues = venues.filter((v) => v.isIct);
  const regularVenues = venues.filter((v) => !v.isIct);

  // 5. Create Departments with HODs
  console.log('🏗️  Seeding Departments...');
  for (const dept of DEPARTMENTS) {
    // FIX: Populating the 'update' object ensures that if the dept exists
    // but was soft-deleted (isActive: false), it gets reactivated.
    await prisma.department.upsert({
      where: { code: dept.code },
      update: {
        name: dept.name,
        description: dept.description,
        college: dept.college,
        isActive: true,
      },
      create: {
        code: dept.code,
        name: dept.name,
        description: dept.description,
        college: dept.college,
        isActive: true,
      },
    });
  }

  // 6. Create Lecturers & Lecturer Users
  console.log('👨‍🏫 Seeding Lecturers...');
  const lecturerIds: string[] = [];
  const lecturerUserIds: string[] = [];

  for (let i = 0; i < LECTURER_NAMES.length; i++) {
    const name = LECTURER_NAMES[i];
    const dept = DEPARTMENTS[i % DEPARTMENTS.length];
    const email = `${name.split(' ')[1].toLowerCase()}@courseflow.edu`;

    const lecturer = await prisma.lecturer.upsert({
      where: { email },
      update: {
        departmentCode: dept.code,
        isActive: true,
      },
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
      update: {
        role: Role.LECTURER,
        isActive: true,
      },
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

  // Assign HODs
  console.log('👔 Assigning HODs...');
  for (let i = 0; i < DEPARTMENTS.length && i < lecturerUserIds.length; i++) {
    await prisma.department.update({
      where: { code: DEPARTMENTS[i].code },
      data: { hodId: lecturerUserIds[i] },
    });
  }

  // 7. Create Students
  console.log('🎓 Seeding Students...');
  const studentIds: string[] = [];
  for (let i = 0; i < CONFIG.STUDENTS_TO_SEED; i++) {
    const name = getRandomItem(STUDENT_NAMES);
    const dept = getRandomItem(DEPARTMENTS);
    const matricNO = `${dept.code}/2024/${(i + 1).toString().padStart(3, '0')}`;
    const email = `student${i + 1}@student.courseflow.edu`;

    const student = await prisma.user.upsert({
      where: { matricNO },
      update: {
        isActive: true,
      },
      create: {
        matricNO,
        email,
        password: password,
        name: name,
        role: Role.STUDENT,
      },
    });
    studentIds.push(student.id);
  }

  // 8. Create General Studies Courses
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
      update: {
        isActive: true,
      },
      create: {
        code: gst.code,
        name: gst.name,
        overview: 'General Studies course required for all students',
        level: gst.level,
        semester: gst.semester,
        credits: 2,
        departmentCode: 'ENG',
        lecturerId: lecturerIds[5], // Assign random lecturer
        isGeneral: true,
        isLocked: true,
      },
    });
  }

  // 9. Create Departmental Courses
  console.log('📚 Seeding Departmental Courses...');
  for (const dept of DEPARTMENTS) {
    for (const level of Object.values(Level)) {
      const levelNum = level.split('_')[1];

      for (let i = 1; i <= CONFIG.COURSES_PER_LEVEL_PER_DEPT; i++) {
        const courseCode = `${dept.code}${levelNum.charAt(0)}${i.toString().padStart(2, '0')}`;
        const lecturerId = getRandomItem(lecturerIds);
        const semester = i % 2 === 0 ? Semester.SECOND : Semester.FIRST;

        await prisma.course.upsert({
          where: { code: courseCode },
          update: {
            isActive: true,
            departmentCode: dept.code,
          },
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

  // 10. Create Schedules (Time Table)
  console.log('📅 Seeding Schedules...');
  const allCourses = await prisma.course.findMany();
  // We'll clean up old schedules to prevent duplicates if seeding runs multiple times
  await prisma.schedule.deleteMany();

  for (const course of allCourses) {
    // Only schedule active courses
    if (!course.isActive) continue;

    const timeSlot = getRandomItem(TIME_SLOTS);
    const day = getRandomItem(Object.values(DayOfWeek));

    // Safety check: ensure we have venues
    if (venues.length === 0) {
      console.warn('⚠️ No venues available for scheduling');
      break;
    }

    // General/100L courses often use large halls
    const suitableVenues =
      course.isGeneral || course.level === Level.LEVEL_100
        ? venues.filter((v) => v.capacity >= 100)
        : venues;

    // Fallback to any venue if filtering returns empty (e.g. if seed data changed)
    const venue = getRandomItem(
      suitableVenues.length > 0 ? suitableVenues : venues,
    );

    await prisma.schedule.create({
      data: {
        courseCode: course.code,
        semester: course.semester,
        sessionId: currentSession.id,
        dayOfWeek: day,
        startTime: timeSlot.start,
        endTime: timeSlot.end,
        venue: venue.name,
        type: ClassType.LECTURE,
      },
    });

    // Add a Lab/Tutorial for some courses (30% chance)
    if (Math.random() > 0.7) {
      const type = Math.random() > 0.5 ? ClassType.LAB : ClassType.TUTORIAL;
      const otherDays = Object.values(DayOfWeek).filter((d) => d !== day);
      const secondDay = getRandomItem(otherDays);

      await prisma.schedule.create({
        data: {
          courseCode: course.code,
          semester: course.semester,
          sessionId: currentSession.id,
          dayOfWeek: secondDay,
          startTime: '14:00',
          endTime: '16:00',
          venue: getRandomItem(venues).name,
          type: type,
        },
      });
    }
  }

  // 11. Create Exam Schedules
  console.log('📝 Seeding Exam Schedules...');
  await prisma.examSchedule.deleteMany();

  let startDate = new Date(currentSession.endDate);
  startDate.setDate(startDate.getDate() - 21); // Exams start 3 weeks before session end

  for (const course of allCourses) {
    // Determine exam date (random day in exam period)
    const examDate = new Date(startDate);
    examDate.setDate(startDate.getDate() + Math.floor(Math.random() * 14));

    // Determine Venue
    // Business Logic: 100L and General courses are CBT -> Must use ICT center
    const isCbt = course.level === Level.LEVEL_100 || course.isGeneral;
    let venueId: string;

    if (isCbt && ictVenues.length > 0) {
      // Pick an ICT venue
      venueId = getRandomItem(ictVenues).id;
    } else {
      // Pick a regular venue (or fallback to any if no regular venues)
      venueId = (getRandomItem(regularVenues) || venues[0]).id;
    }

    const timeSlot = getRandomItem(TIME_SLOTS);

    await prisma.examSchedule.create({
      data: {
        courseCode: course.code,
        date: examDate,
        startTime: timeSlot.start,
        endTime: timeSlot.end,
        venueId: venueId,
        studentCount: Math.floor(Math.random() * 100) + 20,
        targetCollege: course.isGeneral ? College.CBAS : null, // Assuming batch 1 is CBAS
        semester: course.semester,
        sessionId: currentSession.id,
        invigilators: 'Dr. Proctor, Mr. Watcher',
      },
    });
  }

  // 12. Create Complaints
  console.log('🗣️ Seeding Complaints...');
  await prisma.complaint.deleteMany();

  for (let i = 0; i < 15; i++) {
    const studentId = getRandomItem(studentIds);
    const student = await prisma.user.findUnique({ where: { id: studentId } });
    if (!student) continue;

    const status = getRandomItem(Object.values(ComplaintStatus));
    const isResolved =
      status === ComplaintStatus.RESOLVED || status === ComplaintStatus.CLOSED;

    await prisma.complaint.create({
      data: {
        userId: studentId,
        name: student.name || 'Student',
        email: student.email,
        department: 'General',
        subject: getRandomItem(COMPLAINT_SUBJECTS),
        message: 'I am experiencing issues with my academic records.',
        status: status,
        resolvedBy: isResolved ? adminUser.name : null,
        resolvedAt: isResolved ? new Date() : null,
      },
    });
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
