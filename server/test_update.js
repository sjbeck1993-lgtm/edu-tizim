const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function test() {
    try {
        const user = await prisma.user.findFirst({where: {role: 'TEACHER'}});
        if (!user) return console.log("No teacher found");
        console.log('Teacher ID:', user.id);
        
        const id = user.id;
        const name = user.name;
        const phone = user.phone;
        const password = '';
        const subject = 'Test Subject';
        const paymentPercentage = 45;

        const updateData = { name, phone };
        if (password && password.trim() !== '') {
            updateData.password = password; 
        }

        const updatedTeacher = await prisma.user.update({
            where: { id: parseInt(id) },
            data: updateData
        });

        await prisma.teacherProfile.upsert({
            where: { userId: parseInt(id) },
            update: {
                subject: subject || 'Noma\'lum',
                paymentPercentage: parseFloat(paymentPercentage) || 0
            },
            create: {
                userId: parseInt(id),
                subject: subject || 'Noma\'lum',
                baseSalary: 0,
                paymentPercentage: parseFloat(paymentPercentage) || 0,
                rating: 0,
                bonus: 0
            }
        });

        console.log('Success');
    } catch(e) {
        console.error('ERROR:', e);
    } finally {
        await prisma.$disconnect();
    }
}
test();
