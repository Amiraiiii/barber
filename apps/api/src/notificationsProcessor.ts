import { bookingsStore, Booking } from "./store";
import { bot } from "./bot";
import { InlineKeyboard } from "grammy";

export interface ProcessingResult {
  reminderDayCount: number;
  reminder30mCount: number;
  autoCompletedCount: number;
  reviewRequestedCount: number;
  timestamp: string;
}

/**
 * Idempotent task processor for automatic notifications, autocompletion & review requests.
 */
export async function processAutomaticNotifications(): Promise<ProcessingResult> {
  const now = new Date();
  let reminderDayCount = 0;
  let reminder30mCount = 0;
  let autoCompletedCount = 0;
  let reviewRequestedCount = 0;

  for (const booking of bookingsStore) {
    if (booking.status === "CANCELLED") continue;

    // Parse booking datetime
    const [year, month, day] = booking.date.split("-").map(Number);
    const [startHour, startMin] = booking.startTime.split(":").map(Number);
    const [endHour, endMin] = booking.endTime.split(":").map(Number);

    const bookingStart = new Date(year, month - 1, day, startHour, startMin);
    const bookingEnd = new Date(year, month - 1, day, endHour, endMin);

    const diffMs = bookingStart.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffMinutes = diffMs / (1000 * 60);

    // 1. 24-Hour Reminder (Window: between 23h and 25h from now)
    if (
      booking.status === "CONFIRMED" &&
      !booking.reminderDaySentAt &&
      diffHours > 0 &&
      diffHours <= 25
    ) {
      if (booking.telegramChatId && bot) {
        try {
          const inlineKb = new InlineKeyboard()
            .text("❌ Отменить", `cancel_${booking.token}`)
            .text("📅 Перенести", `reschedule_${booking.token}`);

          await bot.api.sendMessage(
            booking.telegramChatId,
            `⏰ *Напоминание о записи за день!*\n\n` +
            `Завтра в *${booking.startTime}* ждем вас в BLACKLINE BARBERS.\n\n` +
            `✂️ *Услуга:* ${booking.serviceName}\n` +
            `👤 *Мастер:* ${booking.barberName}`,
            { parse_mode: "Markdown", reply_markup: inlineKb }
          );
        } catch (err) {
          console.error(`Failed to send 24h reminder for booking ${booking.id}:`, err);
        }
      }
      booking.reminderDaySentAt = now.toISOString();
      reminderDayCount++;
    }

    // 2. 30-Minute Reminder (Window: between 0m and 35m from now)
    if (
      booking.status === "CONFIRMED" &&
      !booking.reminder30mSentAt &&
      diffMinutes > 0 &&
      diffMinutes <= 35
    ) {
      if (booking.telegramChatId && bot) {
        try {
          await bot.api.sendMessage(
            booking.telegramChatId,
            `⌛ *Запись уже скоро (через ~30 минут)!*\n\n` +
            `Вас ждет мастер *${booking.barberName}* в *${booking.startTime}*.\n` +
            `📍 Адрес: ул. Центральная 10, Москва`,
            { parse_mode: "Markdown" }
          );
        } catch (err) {
          console.error(`Failed to send 30m reminder for booking ${booking.id}:`, err);
        }
      }
      booking.reminder30mSentAt = now.toISOString();
      reminder30mCount++;
    }

    // 3. Autocompletion (if bookingEnd has passed)
    if (booking.status === "CONFIRMED" && now.getTime() > bookingEnd.getTime()) {
      booking.status = "COMPLETED";
      booking.autoCompletedAt = now.toISOString();
      autoCompletedCount++;
    }

    // 4. Request Review (if completed and finished at least 15 min ago)
    const minutesSinceEnd = (now.getTime() - bookingEnd.getTime()) / (1000 * 60);
    if (
      booking.status === "COMPLETED" &&
      !booking.reviewRequestedAt &&
      minutesSinceEnd >= 15
    ) {
      if (booking.telegramChatId && bot) {
        try {
          const inlineKb = new InlineKeyboard()
            .text("⭐️ 5", `review_5_${booking.id}`)
            .text("⭐️ 4", `review_4_${booking.id}`)
            .text("⭐️ 3", `review_3_${booking.id}`)
            .row()
            .text("💬 Оставить отзыв", `review_comment_${booking.id}`);

          await bot.api.sendMessage(
            booking.telegramChatId,
            `💈 *Спасибо за визит в BLACKLINE BARBERS!*\n\n` +
            `Как вам результат работы мастера *${booking.barberName}*?\n` +
            `Пожалуйста, оцените визит:`,
            { parse_mode: "Markdown", reply_markup: inlineKb }
          );
        } catch (err) {
          console.error(`Failed to request review for booking ${booking.id}:`, err);
        }
      }
      booking.reviewRequestedAt = now.toISOString();
      reviewRequestedCount++;
    }
  }

  return {
    reminderDayCount,
    reminder30mCount,
    autoCompletedCount,
    reviewRequestedCount,
    timestamp: now.toISOString(),
  };
}
