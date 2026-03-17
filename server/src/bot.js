const TelegramBot = require('node-telegram-bot-api');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
    console.log("Telegram Token topilmadi. Bot simulyatsiya rejimida ishlaydi yoki o'chadi.");
}

// Polling orqali botni ishga tushirish (xatolar bo'lsa darxol yopilib qolmasligi u-n polling errorni ushlaymiz)
const bot = token ? new TelegramBot(token, { polling: true }) : null;

if (bot) {
    console.log("🤖 Telegram Bot muvaffaqiyatli ishga tushdi va xabarlarni kutyapti...");

    bot.onText(/\/start/, (msg) => {
        const chatId = msg.chat.id;

        bot.sendMessage(chatId, "Assalomu alaykum! O'quv markazimizning rasmiy botiga xush kelibsiz.\n\nSizni tizimda aniqlashimiz uchun iltimos telefon raqamingizni yuboring:", {
            reply_markup: {
                keyboard: [
                    [{ text: "📱 Telefon raqamni yuborish", request_contact: true }]
                ],
                resize_keyboard: true,
                one_time_keyboard: true
            }
        });
    });

    // Kontaktni qabul qilib olish
    bot.on('contact', async (msg) => {
        const chatId = msg.chat.id;
        let phoneNumber = msg.contact.phone_number;

        // +998... formatiga moslash
        if (!phoneNumber.startsWith('+')) {
            phoneNumber = '+' + phoneNumber;
        }

        try {
            // Tizimdan qidirib ko'ramiz
            const user = await prisma.user.findUnique({
                where: { phone: phoneNumber }
            });

            if (user) {
                // Agar topsa, telegramId sini yozib qoyamiz
                await prisma.user.update({
                    where: { id: user.id },
                    data: { telegramId: chatId.toString() }
                });

                bot.sendMessage(chatId, `✅ Tabriklaymiz, ${user.name}!\n\nSizning hisobingiz muvaffaqiyatli botga ulandi. Endi barcha to'lovlar, o'zgarishlar va dars jadvali yangiliklarini shu yerdan qabul qilib olasiz.`, {
                    reply_markup: { remove_keyboard: true } // Contact keyboard ni ob tashlash
                });
            } else {
                bot.sendMessage(chatId, `❌ Uzr, "${phoneNumber}" raqami orqali o'quv markazimiz bazasidan sizning ma'lumotlaringiz topilmadi.\n\nAgar endigina markazga kelgan bo'lsangiz, Iltimos, ma'muriyat bilan bog'lanib ro'yxatdan o'ting!`, {
                    reply_markup: { remove_keyboard: true }
                });
            }
        } catch (error) {
            console.error("Bot DB error:", error);
            bot.sendMessage(chatId, "Kechirasiz, tizimda vaqtinchalik xatolik yuz berdi. Birozdan so'ng yana urinib ko'ring.");
        }
    });

    bot.on('polling_error', (error) => {
        console.log("Bot xatosi: ", error.message);  // avoid crash on timeout
    });
}
