// One-time (but idempotent) fix for users whose password was stored in
// plaintext by the old createTeacher/updateTeacher bug (see auth history).
// A real bcrypt hash always starts with $2; anything else is plaintext.
// Re-hashing in place preserves the person's existing password — they
// don't need to be told to reset anything.
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({ select: { id: true, name: true, password: true } });
    const plaintext = users.filter((u) => !u.password.startsWith('$2'));

    if (plaintext.length === 0) {
        console.log('fix-plaintext-passwords: hech qanday shifrlanmagan parol topilmadi.');
        return;
    }

    for (const user of plaintext) {
        const hashed = await bcrypt.hash(user.password, 10);
        await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });
    }

    console.log(`fix-plaintext-passwords: ${plaintext.length} ta foydalanuvchining paroli shifrlandi.`);
}

main()
    .catch((err) => {
        console.error('fix-plaintext-passwords xatosi:', err);
        process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
