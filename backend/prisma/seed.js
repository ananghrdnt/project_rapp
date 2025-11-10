import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

// Helper untuk hash password
const hashPassword = async (plain) => await bcrypt.hash(plain, 10);

  // ==========================
  // 1️⃣ SEED ROLES
  // ==========================
  await prisma.role.createMany({
    data: [
      { role: 'ADMIN' },
      { role: 'ITBP' },
      { role: 'ITGA' },
      { role: 'SAP' },
      { role: 'DATA_SCIENCE' },
    ],
    skipDuplicates: true,
  });

  // ==========================
  // 2️⃣ SEED POSITIONS
  // ==========================
  await prisma.position.createMany({
    data: [
      { position: 'Project Manager', role_id: 2 }, // ITBP
      { position: 'Business Analyst', role_id: 2 },
      { position: 'IT Support', role_id: 3 },      // ITGA
      { position: 'SAP Consultant', role_id: 4 },  // SAP
      { position: 'Data Engineer', role_id: 5 },   // DATA_SCIENCE
      { position: 'Data Analyst', role_id: 5 },
    ],
    skipDuplicates: true,
  });

  // ==========================
  // 3️⃣ SEED USERS (hashed password)
  // ==========================
const users = [
  { SAP: 1001, name: 'Admin User', username: 'admin', password: 'admin123', role_id: 1 },
  { SAP: 2001, name: 'ITBP User 1', username: 'itbp1', password: 'itbp123', role_id: 2, position_id: 1 },
  { SAP: 2002, name: 'ITBP User 2', username: 'itbp2', password: 'itbp123', role_id: 2, position_id: 2 },
  { SAP: 3001, name: 'ITGA User', username: 'itga1', password: 'itga123', role_id: 3, position_id: 3 },
  { SAP: 4001, name: 'SAP User', username: 'sap1', password: 'sap123', role_id: 4, position_id: 4 },
  { SAP: 5001, name: 'Data Science 1', username: 'ds1', password: 'ds123', role_id: 5, position_id: 5 },
  { SAP: 5002, name: 'Data Science 2', username: 'ds2', password: 'ds123', role_id: 5, position_id: 6 },
];

for (const u of users) {
  await prisma.user.create({
    data: {
      SAP: u.SAP,
      name: u.name,
      username: u.username,
      password: await hashPassword(u.password),
      role_id: u.role_id,
      position_id: u.position_id || null,
    },
  });
}


  // ==========================
  // 4️⃣ SEED PROJECT TYPES
  // ==========================
  await prisma.projectType.createMany({
    data: [
      { project_type: 'NEW_PROJECT' },
      { project_type: 'ENHANCEMENT' },
    ],
    skipDuplicates: true,
  });

  // ==========================
  // 5️⃣ SEED TASK GROUPS
  // ==========================
  await prisma.taskGroup.createMany({
    data: [
      { task_group: 'Planning' },
      { task_group: 'Development' },
      { task_group: 'FAT' },
      { task_group: 'SIT' },
      { task_group: 'UAT' },
      { task_group: 'SCAN' },
      { task_group: 'DEPLOY' },
    ],
    skipDuplicates: true,
  });

  // ==========================
  // 6️⃣ SEED PLATFORMS
  // ==========================
  await prisma.platform.createMany({
    data: [
      { platform: 'Mobile' },
      { platform: 'Web' },
      { platform: 'Desktop' },
      { platform: 'API' },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
