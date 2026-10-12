import { Bot, InlineKeyboard, Keyboard } from "grammy";
import { bookingsStore, BARBERS, SERVICES, barberBindingCodes, Booking } from "./store";

const token = process.env.TELEGRAM_BOT_TOKEN;

export const bot = token ? new Bot(token) : null;

if (bot) {
  // Main Reply Keyboard
  const mainKeyboard = new Keyboard()
    .text("📅 Мои записи").text("💈 Услуги").row()
    .text("📲 Записаться").text("ℹ️ Помощь")
    .resized();

  // /start command handling (including deep links)
  bot.command("start", async (ctx) => {
    const payload = ctx.match; // captures argument after /start

    // 1. Deep link: Booking confirmation / linking (e.g. /start b_blk_demo123)
    if (payload && payload.startsWith("b_")) {
      const manageToken = payload.replace("b_", "").trim();
      const booking = bookingsStore.find((b) => b.token === manageToken);

      if (booking) {
        booking.telegramChatId = ctx.chat.id;
        const inlineKb = new InlineKeyboard()
          .text("❌ Отменить запись", `cancel_${booking.token}`)
          .text("📅 Перенести запись", `reschedule_${booking.token}`);

        await ctx.reply(
          `💈 *Запись успешно привязана к Telegram!*\n\n` +
          `✂️ *Услуга:* ${booking.serviceName}\n` +
          `👤 *Барбер:* ${booking.barberName}\n` +
          `📅 *Дата:* ${booking.date}\n` +
          `⏰ *Время:* ${booking.startTime} - ${booking.endTime}\n` +
          `💵 *Стоимость:* $${booking.totalPrice}\n` +
          `📌 *Статус:* ${booking.status === "CONFIRMED" ? "✅ Подтверждена" : booking.status}\n\n` +
          `Вы будете получать уведомления о вашей записи в этом чате.`,
          { parse_mode: "Markdown", reply_markup: inlineKb }
        );
        return;
      } else {
        await ctx.reply(`⚠️ Запись с кодом \`${manageToken}\` не найдена.`, { parse_mode: "Markdown" });
        return;
      }
    }

    // 2. Deep link: Barber account binding (e.g. /start barber_vance123)
    if (payload && payload.startsWith("barber_")) {
      const code = payload.replace("barber_", "").trim();
      const barberId = barberBindingCodes[code];
      const barber = BARBERS.find((b) => b.id === barberId);

      if (barber) {
        barber.telegramChatId = ctx.chat.id;
        await ctx.reply(
          `💈 *Здравствуйте, ${barber.name}!*\n\n` +
          `Ваш Telegram аккаунт успешно привязан как рабочий чат барбера.\n` +
          `Теперь вы будете получать мгновенные уведомления о новых записях, переносах и отменах.`,
          { parse_mode: "Markdown", reply_markup: mainKeyboard }
        );
        return;
      } else {
        await ctx.reply(`⚠️ Неверный одноразовый код привязки барбера.`, { parse_mode: "Markdown" });
        return;
      }
    }

    // 3. Regular /start command
    await ctx.reply(
      `👋 *Добро пожаловать в BLACKLINE BARBERS!*\n\n` +
      `Мы создаем идеальный стиль и заботимся о вашем комфорте.\n` +
      `Используйте меню ниже для управления своими записями и знакомства с услугами.`,
      { parse_mode: "Markdown", reply_markup: mainKeyboard }
    );
  });

  // Handle "Мои записи" & /mybookings
  const handleMyBookings = async (ctx: any) => {
    const userBookings = bookingsStore.filter(
      (b) => b.telegramChatId === ctx.chat.id && b.status !== "CANCELLED"
    );

    if (userBookings.length === 0) {
      const webUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      const inlineKb = new InlineKeyboard().url("📲 Записаться онлайн", webUrl);
      await ctx.reply(
        `📅 *У вас пока нет активных записей.*\n\nХотите выбрать удобное время?`,
        { parse_mode: "Markdown", reply_markup: inlineKb }
      );
      return;
    }

    await ctx.reply(`📋 *Ваши активные записи (${userBookings.length}):*`, { parse_mode: "Markdown" });

    for (const booking of userBookings) {
      const inlineKb = new InlineKeyboard()
        .text("❌ Отменить", `cancel_${booking.token}`)
        .text("📅 Перенести", `reschedule_${booking.token}`);

      await ctx.reply(
        `✂️ *${booking.serviceName}*\n` +
        `👤 Барбер: ${booking.barberName}\n` +
        `📅 Дата: ${booking.date}\n` +
        `⏰ Время: ${booking.startTime} (${booking.totalDurationMin} мин)\n` +
        `💵 Цена: $${booking.totalPrice}\n` +
        `🔑 Токен: \`${booking.token}\``,
        { parse_mode: "Markdown", reply_markup: inlineKb }
      );
    }
  };

  bot.hears("📅 Мои записи", handleMyBookings);
  bot.command("mybookings", handleMyBookings);

  // Handle "Услуги" & /services
  const handleServices = async (ctx: any) => {
    let msg = `💈 *Услуги и прайс-лист BLACKLINE BARBERS:*\n\n`;
    SERVICES.forEach((s, idx) => {
      msg += `${idx + 1}. *${s.name}* — $${s.price} (${s.durationMin} мин)\n_${s.description}_\n\n`;
    });

    const webUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    const inlineKb = new InlineKeyboard().url("💈 Записаться на услугу", webUrl);

    await ctx.reply(msg, { parse_mode: "Markdown", reply_markup: inlineKb });
  };

  bot.hears("💈 Услуги", handleServices);
  bot.command("services", handleServices);

  // Handle "Записаться"
  bot.hears("📲 Записаться", async (ctx) => {
    const webUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    const inlineKb = new InlineKeyboard().url("✂️ Выбрать время и барбера", webUrl);
    await ctx.reply(
      `📲 *Запись онлайн*\n\nНажмите кнопку ниже, чтобы выбрать барбера, услугу и удобное время:`,
      { parse_mode: "Markdown", reply_markup: inlineKb }
    );
  });

  // Handle "Помощь" & /help
  const handleHelp = async (ctx: any) => {
    await ctx.reply(
      `ℹ️ *BLACKLINE BARBERS*\n\n` +
      `📍 *Адрес:* ул. Центральная 10, Москва\n` +
      `📞 *Телефон:* +7 (495) 000-00-00\n` +
      `🕒 *Режим работы:* Пн-Сб 10:00 - 21:00, Вс — Выходной\n\n` +
      `По всем вопросам обращайтесь к нашему администратору.`,
      { parse_mode: "Markdown" }
    );
  };

  bot.hears("ℹ️ Помощь", handleHelp);
  bot.command("help", handleHelp);

  // Handle Inline Callback Queries
  bot.on("callback_query:data", async (ctx) => {
    const data = ctx.callbackQuery.data;

    if (data.startsWith("cancel_")) {
      const token = data.replace("cancel_", "");
      const booking = bookingsStore.find((b) => b.token === token);

      if (!booking) {
        await ctx.answerCallbackQuery({ text: "Запись не найдена" });
        return;
      }

      booking.status = "CANCELLED";
      await ctx.answerCallbackQuery({ text: "Запись отменена" });
      await ctx.editMessageText(
        `❌ *Запись отменена*\n\n` +
        `✂️ Услуга: ${booking.serviceName}\n` +
        `📅 Дата: ${booking.date} (${booking.startTime})\n` +
        `Статус: Отменена`,
        { parse_mode: "Markdown" }
      );

      // Notify barber if linked
      notifyBarberBookingCancelled(booking);
    } else if (data.startsWith("reschedule_")) {
      const token = data.replace("reschedule_", "");
      const booking = bookingsStore.find((b) => b.token === token);
      await ctx.answerCallbackQuery();

      if (booking) {
        const webUrl = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/booking/manage?token=${token}`;
        const inlineKb = new InlineKeyboard().url("📅 Выбрать новое время", webUrl);
        await ctx.reply(
          `📅 Для переноса записи *${booking.serviceName}* перейдите по ссылке ниже:`,
          { parse_mode: "Markdown", reply_markup: inlineKb }
        );
      }
    }
  });

  // Global Error Handler
  bot.catch((err) => {
    console.error("Telegram Bot Error:", err);
  });
}

// Notification Functions
export async function notifyBookingCreated(booking: Booking) {
  if (!bot) return;

  // 1. Notify Client if telegramChatId exists
  if (booking.telegramChatId) {
    try {
      const inlineKb = new InlineKeyboard()
        .text("❌ Отменить", `cancel_${booking.token}`)
        .text("📅 Перенести", `reschedule_${booking.token}`);

      await bot.api.sendMessage(
        booking.telegramChatId,
        `🎉 *Вы успешно записались в BLACKLINE BARBERS!*\n\n` +
        `✂️ *Услуга:* ${booking.serviceName}\n` +
        `👤 *Барбер:* ${booking.barberName}\n` +
        `📅 *Дата:* ${booking.date}\n` +
        `⏰ *Время:* ${booking.startTime} - ${booking.endTime}\n` +
        `💵 *Стоимость:* $${booking.totalPrice}\n\n` +
        `Ждем вас в назначенное время!`,
        { parse_mode: "Markdown", reply_markup: inlineKb }
      );
    } catch (err) {
      console.error("Failed to send client booking creation notification:", err);
    }
  }

  // 2. Notify Barber if telegramChatId exists
  const barber = BARBERS.find((b) => b.id === booking.barberId);
  if (barber && barber.telegramChatId) {
    try {
      await bot.api.sendMessage(
        barber.telegramChatId,
        `🔔 *Новая запись!*\n\n` +
        `👤 *Клиент:* ${booking.clientName} (${booking.clientPhone})\n` +
        `✂️ *Услуга:* ${booking.serviceName}\n` +
        `📅 *Дата:* ${booking.date}\n` +
        `⏰ *Время:* ${booking.startTime} - ${booking.endTime}\n` +
        `💵 *Сумма:* $${booking.totalPrice}`,
        { parse_mode: "Markdown" }
      );
    } catch (err) {
      console.error("Failed to send barber notification:", err);
    }
  }
}

export async function notifyBookingCancelled(booking: Booking) {
  if (!bot) return;

  if (booking.telegramChatId) {
    try {
      await bot.api.sendMessage(
        booking.telegramChatId,
        `❌ *Ваша запись отменена*\n\n` +
        `✂️ Услуга: ${booking.serviceName}\n` +
        `📅 Дата: ${booking.date} (${booking.startTime})`,
        { parse_mode: "Markdown" }
      );
    } catch (err) {
      console.error("Failed to notify client about cancellation:", err);
    }
  }

  notifyBarberBookingCancelled(booking);
}

async function notifyBarberBookingCancelled(booking: Booking) {
  if (!bot) return;
  const barber = BARBERS.find((b) => b.id === booking.barberId);
  if (barber && barber.telegramChatId) {
    try {
      await bot.api.sendMessage(
        barber.telegramChatId,
        `🚨 *Отмена записи!*\n\n` +
        `👤 *Клиент:* ${booking.clientName}\n` +
        `✂️ *Услуга:* ${booking.serviceName}\n` +
        `📅 *Дата:* ${booking.date} в ${booking.startTime}`,
        { parse_mode: "Markdown" }
      );
    } catch (err) {
      console.error("Failed to notify barber about cancellation:", err);
    }
  }
}

export async function notifyBookingRescheduled(booking: Booking) {
  if (!bot) return;

  if (booking.telegramChatId) {
    try {
      await bot.api.sendMessage(
        booking.telegramChatId,
        `📅 *Ваша запись перенесена на новое время!*\n\n` +
        `✂️ *Услуга:* ${booking.serviceName}\n` +
        `👤 *Барбер:* ${booking.barberName}\n` +
        `📅 *Новая дата:* ${booking.date}\n` +
        `⏰ *Новое время:* ${booking.startTime} - ${booking.endTime}`,
        { parse_mode: "Markdown" }
      );
    } catch (err) {
      console.error("Failed to notify client about rescheduling:", err);
    }
  }

  const barber = BARBERS.find((b) => b.id === booking.barberId);
  if (barber && barber.telegramChatId) {
    try {
      await bot.api.sendMessage(
        barber.telegramChatId,
        `🔄 *Перенос записи!*\n\n` +
        `👤 *Клиент:* ${booking.clientName}\n` +
        `✂️ *Услуга:* ${booking.serviceName}\n` +
        `📅 *Новое время:* ${booking.date} в ${booking.startTime}`,
        { parse_mode: "Markdown" }
      );
    } catch (err) {
      console.error("Failed to notify barber about rescheduling:", err);
    }
  }
}

// Start polling for development if token exists
export async function startBotInDev() {
  if (bot) {
    try {
      console.log("🤖 Starting Telegram bot long-polling...");
      bot.start({
        onStart: (info) => {
          console.log(`✅ Telegram bot @${info.username} is running!`);
        },
      });
    } catch (err) {
      console.error("Failed to start Telegram bot:", err);
    }
  } else {
    console.warn("⚠️ TELEGRAM_BOT_TOKEN not provided. Bot will not start.");
  }
}
