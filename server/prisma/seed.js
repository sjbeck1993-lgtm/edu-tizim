const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database with mock data...');

    // 1. Create Default Admin
    const adminPassword = await bcrypt.hash('admin123', 10);
    const adminUser = await prisma.user.upsert({
        where: { phone: '+998901234567' },
        update: {},
        create: {
            name: 'Super Admin',
            phone: '+998901234567',
            password: adminPassword,
            role: 'ADMIN',
        },
    });
    console.log('✅ Admin user created');

    // 2. Create Default Teacher
    const teacherPassword = await bcrypt.hash('teacher123', 10);
    const teacherUser = await prisma.user.upsert({
        where: { phone: '+998991112233' },
        update: {},
        create: {
            name: 'Oqiljon Oqilov',
            phone: '+998991112233',
            password: teacherPassword,
            role: 'TEACHER',
            teacherProfile: {
                create: {
                    subject: 'Matematika',
                    baseSalary: 4500000,
                    rating: 4.8,
                }
            }
        },
    });
    console.log('✅ Teacher user created');

    // 3. Create Courses
    const courseMath = await prisma.course.create({
        data: {
            name: 'Matematika',
            monthlyPrice: 350000,
            description: 'Matematika kursi noldan o\'rgatiladi',
        }
    });
    console.log('✅ Courses created');

    // 4. Create Group
    const groupMath = await prisma.group.create({
        data: {
            name: 'Matematika - 28 gurux',
            courseId: courseMath.id,
            teacherId: teacherUser.id,
            schedule: 'Du, Chor, Juma 14:00',
        }
    });

    // 5. Create Students
    const studentPassword = await bcrypt.hash('student123', 10);
    const student1 = await prisma.user.create({
        data: {
            name: 'Azizbek Rahimov',
            phone: '+998900010001',
            password: studentPassword,
            role: 'STUDENT',
            studentProfile: {
                create: {
                    level: 2,
                    coins: 150,
                    groupId: groupMath.id
                }
            }
        }
    });
    console.log('✅ Student user created');

    // 6. Create Fake Leads
    await prisma.lead.createMany({
        data: [
            { name: 'Xolmat Xolmatov', phone: '+998933334455', course: 'Kiberxavfsizlik', source: 'Instagram' },
            { name: 'Nasiba Karimovna', phone: '+998991112244', course: 'Matematika', source: 'Telegram', status: 'THINKING' },
            { name: 'Jasur Jasurov', phone: '+998944555666', course: 'Frontend', source: 'Tanish', status: 'REJECTED', reason: 'Narxi qimmatlik qildi' },
        ]
    });
    console.log('✅ Mock Leads created');

    console.log('🎉 Seeding successfully completed!');
}

main()
    .catch((e) => {
        console.error('Seeding error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
