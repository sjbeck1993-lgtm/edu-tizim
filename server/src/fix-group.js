const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Checking attendances...");
    const attendances = await prisma.attendance.findMany();
    console.log(attendances.length, "attendances found.");

    const studentGroups = {};

    attendances.forEach(a => {
        if (!studentGroups[a.studentId]) {
            studentGroups[a.studentId] = new Set();
        }
        studentGroups[a.studentId].add(a.groupId);
    });

    console.log("Recovered mappings from attendances:");
    for (const [studentId, groups] of Object.entries(studentGroups)) {
        console.log(`Student ${studentId} -> Groups: ${[...groups]}`);
        
        // Find profile
        const profile = await prisma.studentProfile.findUnique({
            where: { userId: parseInt(studentId) }
        });

        if (profile) {
            await prisma.studentProfile.update({
                where: { userId: parseInt(studentId) },
                data: {
                    groups: {
                        connect: [...groups].map(id => ({ id }))
                    }
                }
            });
            console.log(`Updated student ${studentId} with groups ${[...groups]}`);
        }
    }

    console.log("Checking debts...");
    // Debts might have the groupId if I didn't delete them. But wait, I just created the Debt model today! So there are no old debts with groupId.

    console.log("Checking tasks/submissions...");
    const submissions = await prisma.submission.findMany({ include: { task: true } });
    const studentTasks = {};
    submissions.forEach(s => {
        if (!studentTasks[s.studentId]) {
            studentTasks[s.studentId] = new Set();
        }
        studentTasks[s.studentId].add(s.task.groupId);
    });

    for (const [studentId, groups] of Object.entries(studentTasks)) {
        // Find profile
        const profile = await prisma.studentProfile.findUnique({
            where: { userId: parseInt(studentId) }
        });

        if (profile) {
            await prisma.studentProfile.update({
                where: { userId: parseInt(studentId) },
                data: {
                    groups: {
                        connect: [...groups].map(id => ({ id }))
                    }
                }
            });
            console.log(`Updated student ${studentId} from tasks with groups ${[...groups]}`);
        }
    }

    console.log("Done");
}

main().catch(console.error).finally(() => prisma.$disconnect());
