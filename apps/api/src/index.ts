import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { z } from "zod";
import { webhookCallback } from "grammy";
import {
  SERVICES,
  BARBERS,
  bookingsStore,
  addMinutesToTime,
  Booking,
} from "./store";
import {
  bot,
  notifyBookingCreated,
  notifyBookingCancelled,
  notifyBookingRescheduled,
  startBotInDev,
} from "./bot";
import { processAutomaticNotifications } from "./notificationsProcessor";

import fastifyCookie from "@fastify/cookie";
import { registerAdminRoutes } from "./adminRoutes";

export const server = Fastify({
  logger: true,
});

// Enable CORS with support for production domains and local dev
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((s) => s.trim())
  : null;

server.register(cors, {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (!allowedOrigins) return cb(null, true);
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith(".vercel.app") ||
      origin.includes("localhost") ||
      origin.includes("127.0.0.1")
    ) {
      return cb(null, true);
    }
    return cb(new Error("Not allowed by CORS"), false);
  },
  credentials: true,
});

// Register Cookie plugin
server.register(fastifyCookie);

// Register Admin Routes
registerAdminRoutes(server);

// 1. Health check
server.get("/health", async () => {
  return {
    status: "ok",
    service: "BLACKLINE BARBERS API",
    botActive: !!bot,
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  };
});

// 2. Telegram Webhook Endpoints
if (bot) {
  const activeBot = bot;
  server.post("/telegram/webhook", webhookCallback(activeBot, "fastify"));
  server.post("/api/v1/telegram/webhook", webhookCallback(activeBot, "fastify"));

  server.get("/api/v1/telegram/webhook/info", async () => {
    try {
      const info = await activeBot.api.getWebhookInfo();
      return { data: info };
    } catch (err: any) {
      return { error: err.message };
    }
  });

  server.post("/api/v1/telegram/webhook/set", async (request, reply) => {
    try {
      const { url } = (request.body as { url?: string }) || {};
      const webhookUrl = url || `${process.env.API_URL || ""}/api/v1/telegram/webhook`;
      if (!webhookUrl.startsWith("https://")) {
        return reply.status(400).send({ error: "Webhook URL must start with https://" });
      }
      await activeBot.api.setWebhook(webhookUrl);
      return { success: true, webhookUrl };
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });
}

// 3. Cron / Automatic Notifications Processing Endpoint
server.post("/api/v1/cron/notifications", async (request, reply) => {
  const result = await processAutomaticNotifications();
  return { data: result };
});

// 4. Services endpoint
server.get("/api/v1/services", async () => {
  return { data: SERVICES };
});

// 5. Barbers endpoint
server.get("/api/v1/barbers", async () => {
  return { data: BARBERS };
});

// 6. Availability Days endpoint
server.get("/api/v1/availability/days", async () => {
  const today = new Date();
  const availableDays = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date();
    d.setDate(today.getDate() + i);
    availableDays.push({
      date: d.toISOString().split("T")[0],
      dayOfWeek: d.getDay(),
      isAvailable: d.getDay() !== 0, // Sunday off
    });
  }
  return { data: availableDays };
});

// 7. Availability Slots endpoint
const AvailabilityQuerySchema = z.object({
  date: z.string(),
  barberId: z.string().optional(),
  serviceId: z.string().optional(),
});

server.get("/api/v1/availability", async (request, reply) => {
  const query = AvailabilityQuerySchema.safeParse(request.query);
  if (!query.success) {
    return reply.status(400).send({ error: "Invalid query parameters" });
  }

  const { date, barberId = "any", serviceId = "haircut" } = query.data;
  const service = SERVICES.find((s) => s.id === serviceId) || SERVICES[0];

  const standardSlots = ["10:00", "11:00", "12:00", "14:00", "15:00", "16:30", "18:00", "19:30"];

  const slotsWithStatus = standardSlots.map((slot) => {
    const isLunch = slot === "14:00";
    const isOccupied = bookingsStore.some(
      (b) =>
        b.date === date &&
        b.status === "CONFIRMED" &&
        (barberId === "any" || b.barberId === barberId) &&
        b.startTime === slot
    );

    return {
      time: slot,
      endTime: addMinutesToTime(slot, service.durationMin),
      available: !isLunch && !isOccupied,
      reason: isLunch ? "Lunch Break" : isOccupied ? "Occupied" : undefined,
    };
  });

  return { data: { date, barberId, service, slots: slotsWithStatus } };
});

// 8. Create Booking endpoint
const CreateBookingSchema = z.object({
  serviceId: z.string(),
  barberId: z.string(),
  date: z.string(),
  startTime: z.string(),
  clientName: z.string().min(2),
  clientPhone: z.string().min(7),
  clientEmail: z.string().optional(),
  telegramChatId: z.number().optional(),
  notes: z.string().optional(),
});

server.post("/api/v1/bookings", async (request, reply) => {
  const bodyResult = CreateBookingSchema.safeParse(request.body);
  if (!bodyResult.success) {
    return reply.status(400).send({ error: "Invalid booking input payload", details: bodyResult.error.format() });
  }

  const payload = bodyResult.data;
  const service = SERVICES.find((s) => s.id === payload.serviceId);
  if (!service) {
    return reply.status(404).send({ error: "Service not found" });
  }

  let chosenBarber = BARBERS.find((b) => b.id === payload.barberId);
  if (payload.barberId === "any" || !chosenBarber) {
    chosenBarber = BARBERS[0];
  }

  const isTaken = bookingsStore.some(
    (b) =>
      b.date === payload.date &&
      b.barberId === chosenBarber.id &&
      b.startTime === payload.startTime &&
      b.status === "CONFIRMED"
  );

  if (isTaken) {
    return reply.status(409).send({
      error: "SLOT_TAKEN",
      code: "23P01",
      message: "The requested time slot has just been reserved by another client.",
    });
  }

  const token = "blk_" + Math.random().toString(36).substring(2, 10);
  const newBooking: Booking = {
    id: "b_" + Date.now(),
    token,
    barberId: chosenBarber.id,
    barberName: chosenBarber.name,
    serviceId: service.id,
    serviceName: service.name,
    date: payload.date,
    startTime: payload.startTime,
    endTime: addMinutesToTime(payload.startTime, service.durationMin),
    totalPrice: service.price,
    totalDurationMin: service.durationMin,
    clientName: payload.clientName,
    clientPhone: payload.clientPhone,
    clientEmail: payload.clientEmail,
    telegramChatId: payload.telegramChatId,
    notes: payload.notes,
    status: "CONFIRMED",
    createdAt: new Date().toISOString(),
  };

  bookingsStore.push(newBooking);

  // Send notifications to client and barber via Telegram
  await notifyBookingCreated(newBooking);

  return reply.status(201).send({
    data: newBooking,
  });
});

// 9. Get Booking by token
server.get("/api/v1/bookings/:token", async (request, reply) => {
  const { token } = request.params as { token: string };
  const booking = bookingsStore.find((b) => b.token === token);
  if (!booking) {
    return reply.status(404).send({ error: "Booking not found" });
  }
  return { data: booking };
});

// 10. Cancel Booking by token
server.post("/api/v1/bookings/:token/cancel", async (request, reply) => {
  const { token } = request.params as { token: string };
  const booking = bookingsStore.find((b) => b.token === token);
  if (!booking) {
    return reply.status(404).send({ error: "Booking not found" });
  }

  booking.status = "CANCELLED";

  // Send cancellation notifications
  await notifyBookingCancelled(booking);

  return { data: booking };
});

// 11. Reschedule Booking
const RescheduleSchema = z.object({
  date: z.string(),
  startTime: z.string(),
});

server.post("/api/v1/bookings/:token/reschedule", async (request, reply) => {
  const { token } = request.params as { token: string };
  const booking = bookingsStore.find((b) => b.token === token);
  if (!booking) {
    return reply.status(404).send({ error: "Booking not found" });
  }

  const bodyResult = RescheduleSchema.safeParse(request.body);
  if (!bodyResult.success) {
    return reply.status(400).send({ error: "Invalid reschedule parameters" });
  }

  const { date, startTime } = bodyResult.data;
  booking.date = date;
  booking.startTime = startTime;
  booking.endTime = addMinutesToTime(startTime, booking.totalDurationMin);
  booking.status = "CONFIRMED";

  // Send reschedule notifications
  await notifyBookingRescheduled(booking);

  return { data: booking };
});

// Export handler for Vercel Serverless Function
export default async function handler(req: any, res: any) {
  await server.ready();
  server.server.emit("request", req, res);
}

const start = async () => {
  const port = Number(process.env.PORT) || 4000;
  try {
    await server.listen({ port, host: "0.0.0.0" });
    console.log(`🚀 BLACKLINE BARBERS API listening on http://localhost:${port}`);

    // Start bot long polling in development mode (if not using webhook)
    if (process.env.NODE_ENV !== "production" && !process.env.USE_WEBHOOK) {
      await startBotInDev();
    } else {
      console.log("ℹ️ Production / Webhook mode active. Bot long polling skipped.");
    }

    // Start periodic background job for automatic reminders & completion (every 60s)
    setInterval(async () => {
      try {
        await processAutomaticNotifications();
      } catch (err) {
        console.error("Error running automatic notifications job:", err);
      }
    }, 60000);
    console.log("⏱️ Automatic notification & completion worker started (60s interval).");
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

// Only run server.listen if not in Vercel Serverless environment
if (!process.env.VERCEL) {
  start();
}

