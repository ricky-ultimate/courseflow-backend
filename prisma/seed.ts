import { PrismaClient, Role } from '../src/generated/prisma';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create an admin user first
  const adminPassword = await argon2.hash('admin123');

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

  console.log('✅ Created admin user:', adminUser.email);

  // Create verification codes
  const verificationCodes = [
    {
      code: 'ADMIN-2025-MASTER',
      role: Role.ADMIN,
      description: 'Master admin verification code for 2025',
      maxUsage: null, // Unlimited
      expiresAt: null, // No expiration
      createdBy: adminUser.id,
    },
    {
      code: 'LECTURER-CS-2025',
      role: Role.LECTURER,
      description: 'Computer Science lecturer verification code',
      maxUsage: 10,
      expiresAt: new Date('2025-12-31T23:59:59.000Z'),
      createdBy: adminUser.id,
    },
    {
      code: 'LECTURER-MATH-2025',
      role: Role.LECTURER,
      description: 'Mathematics lecturer verification code',
      maxUsage: 5,
      expiresAt: new Date('2025-12-31T23:59:59.000Z'),
      createdBy: adminUser.id,
    },
  ];

  for (const codeData of verificationCodes) {
    const verificationCode = await prisma.verificationCode.upsert({
      where: { code: codeData.code },
      update: {},
      create: codeData,
    });
    console.log('✅ Created verification code:', verificationCode.code);
  }

  console.log('🎉 Database seeding completed!');
  console.log('\n📋 Test Credentials:');
  console.log('Admin User:');
  console.log('  Email: admin@courseflow.edu');
  console.log('  Password: admin123');
  console.log('\nVerification Codes:');
  console.log('  Admin: ADMIN-2025-MASTER');
  console.log('  Lecturer (CS): LECTURER-CS-2025');
  console.log('  Lecturer (Math): LECTURER-MATH-2025');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
