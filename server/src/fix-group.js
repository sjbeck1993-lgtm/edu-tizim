const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
    try {
        console.log('Ingliz tili (English) guruhini qidiryapman...');
        
        // Ingliz tili guruhini topamiz (English nomli)
        const groups = await prisma.group.findMany();
        console.log('Topilgan barcha guruhlar:', groups.map(g => g.name));

        const englishGroup = groups.find(g => g.name.toLowerCase().includes('english') || g.name.toLowerCase().includes('ingliz'));
        
        if (englishGroup) {
            console.log(`Guruh topildi: ${englishGroup.name} (ID: ${englishGroup.id})`);
            const updated = await prisma.group.update({
                where: { id: englishGroup.id },
                data: { telegramChatId: '-4958534561' }
            });
            console.log('MUVAFFAQIYAT! Yangi Chat ID saqlandi:', updated.telegramChatId);
        } else {
            console.log('XATO: Ingliz tili guruhi topilmadi.');
        }
    } catch (e) {
        console.error('XATO YUZ BERDI:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

fix();
