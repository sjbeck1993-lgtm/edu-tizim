const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function test() {
    try {
        const user = await prisma.user.findFirst({where: {role: 'TEACHER'}});
        if (!user) return console.log("No teacher found");
        console.log('Teacher ID:', user.id);
        
        await prisma.user.update({
            where: { id: user.id },
            data: { name: user.name, phone: user.phone }
        });
        
        await prisma.teacherProfile.update({
            where: { userId: user.id },
            data: { paymentPercentage: 60 }
        });
        
        console.log('Success');
    } catch(e) {
        console.error('ERROR:', e);
    } finally {
        await prisma.$disconnect();
    }
}
test();
