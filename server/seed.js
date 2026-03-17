const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
    console.log('Seeding demo users...');

    const adminHash = await bcrypt.hash('admin123', 10);
    const teacherHash = await bcrypt.hash('teacher123', 10);
    const studentHash = await bcrypt.hash('student123', 10);

    await prisma.user.upsert({
        where: { phone: '+998901234567' },
        update: { password: adminHash },
        create: {
            name: 'Admin User',
            phone: '+998901234567',
            password: adminHash,
            role: 'ADMIN'
        }
    });

    await prisma.user.upsert({
        where: { phone: '+998991112233' },
        update: { password: teacherHash },
        create: {
            name: 'Ustoz Demo',
            phone: '+998991112233',
            password: teacherHash,
            role: 'TEACHER'
        }
    });

    await prisma.user.upsert({
        where: { phone: '+998900010001' },
        update: { password: studentHash },
        create: {
            name: 'O\'quvchi Demo',
            phone: '+998900010001',
            password: studentHash,
            role: 'STUDENT'
        }
    });

    console.log('Demo users seeded successfully!');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
