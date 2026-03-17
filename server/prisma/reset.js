const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetCourses() {
    try {
        console.log("Ma'lumotlar tozalanmoqda...");

        // 1. Delete all existing groups and courses
        // Due to foreign keys, we delete groups first (Tasks and Attendances might block, we will delete them too just in case)
        await prisma.attendance.deleteMany({});
        await prisma.submission.deleteMany({});
        await prisma.task.deleteMany({});
        await prisma.group.deleteMany({});
        await prisma.course.deleteMany({});

        console.log("Eski kurs va guruhlar o'chirildi.");

        // 2. Fetch a valid teacher for the groups
        let teacher = await prisma.user.findFirst({
            where: { role: 'TEACHER' }
        });

        // If no teacher exists, create a dummy one just so the database doesn't fail
        if (!teacher) {
            teacher = await prisma.user.create({
                data: {
                    name: "Matematika O'qituvchisi",
                    phone: "+998901234568",
                    password: "password", // hashed manually not needed for this rough script
                    role: 'TEACHER',
                    teacherProfile: {
                        create: {
                            subject: 'Matematika',
                            baseSalary: 2000000
                        }
                    }
                }
            });
            console.log("Yangi ustoz yaratildi:", teacher.name);
        }

        // 3. Create the specific Course
        const course = await prisma.course.create({
            data: {
                name: "Mukammal matematika",
                monthlyPrice: 350000,
                description: "Matematikani chuqurlashtirilgan tarzda o'rganish uchun maxsus kurs"
            }
        });
        console.log(`Kurs yaratildi: ${course.name}`);

        // 4. Create the precise Groups
        await prisma.group.create({
            data: {
                name: "3-sinf",
                courseId: course.id,
                teacherId: teacher.id,
                schedule: "Dush-Chor-Jum 14:00"
            }
        });

        await prisma.group.create({
            data: {
                name: "4-sinf",
                courseId: course.id,
                teacherId: teacher.id,
                schedule: "Sesh-Pay-Shan 15:00"
            }
        });

        console.log("Guruhlar '3-sinf' va '4-sinf' yaratildi.");

    } catch (error) {
        console.error("Xatolik:", error);
    } finally {
        await prisma.$disconnect();
    }
}

resetCourses();
