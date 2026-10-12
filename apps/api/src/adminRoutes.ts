import { FastifyInstance } from "fastify";
import argon2 from "argon2";
import { z } from "zod";
import {
  SERVICES,
  BARBERS,
  bookingsStore,
  reviewsStore,
  settingsStore,
  activeSessions,
  Service,
  Barber,
  Booking,
  addMinutesToTime,
} from "./store";

// Rate limiting for admin login (IP -> array of failure timestamps)
const loginAttempts: Record<string, number[]> = {};

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 mins
  const attempts = (loginAttempts[ip] || []).filter((ts) => now - ts < windowMs);
  loginAttempts[ip] = attempts;
  return attempts.length >= 5; // Max 5 failures in 15 mins
}

function recordFailedAttempt(ip: string) {
  if (!loginAttempts[ip]) loginAttempts[ip] = [];
  loginAttempts[ip].push(Date.now());
}

let ADMIN_PASSWORD_HASH = "";

// Initialize hashed password for default admin
async function initAdminUser() {
  // Default password: admin123
  ADMIN_PASSWORD_HASH = await argon2.hash("admin123");
}

initAdminUser().catch(console.error);

export async function registerAdminRoutes(server: FastifyInstance) {
  // Middleware helper to check admin authentication
  const requireAdminAuth = async (request: any, reply: any) => {
    const sessionCookie = request.cookies?.admin_session || request.headers.authorization?.replace("Bearer ", "");
    if (!sessionCookie || !activeSessions[sessionCookie]) {
      reply.status(401).send({ error: "UNAUTHORIZED", message: "Admin authentication required" });
      return false;
    }
    if (Date.now() > activeSessions[sessionCookie].expiresAt) {
      delete activeSessions[sessionCookie];
      reply.status(401).send({ error: "SESSION_EXPIRED", message: "Session expired. Please log in again." });
      return false;
    }
    return true;
  };

  // 1. Admin Login
  const LoginSchema = z.object({
    username: z.string(),
    password: z.string(),
  });

  server.post("/api/v1/admin/login", async (request, reply) => {
    const ip = request.ip;
    if (isRateLimited(ip)) {
      return reply.status(429).send({
        error: "TOO_MANY_ATTEMPTS",
        message: "Too many failed login attempts. Please try again after 15 minutes.",
      });
    }

    const parseResult = LoginSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: "Invalid credentials input" });
    }

    const { username, password } = parseResult.data;

    // Verify default admin user
    if (username !== "admin") {
      recordFailedAttempt(ip);
      return reply.status(401).send({ error: "INVALID_CREDENTIALS", message: "Invalid username or password" });
    }

    const isMatch = await argon2.verify(ADMIN_PASSWORD_HASH, password);
    if (!isMatch) {
      recordFailedAttempt(ip);
      return reply.status(401).send({ error: "INVALID_CREDENTIALS", message: "Invalid username or password" });
    }

    // Clear failed login attempts on success
    delete loginAttempts[ip];

    // Create session token
    const token = "adm_session_" + Math.random().toString(36).substring(2, 15) + Date.now();
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    activeSessions[token] = { username: "admin", expiresAt };

    reply.setCookie("admin_session", token, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 86400,
    });

    return {
      success: true,
      token,
      user: { username: "admin", role: "SUPER_ADMIN" },
    };
  });

  // 2. Admin Logout
  server.post("/api/v1/admin/logout", async (request, reply) => {
    const sessionCookie = request.cookies?.admin_session;
    if (sessionCookie && activeSessions[sessionCookie]) {
      delete activeSessions[sessionCookie];
    }
    reply.clearCookie("admin_session", { path: "/" });
    return { success: true };
  });

  // 3. Admin Me Check
  server.get("/api/v1/admin/me", async (request, reply) => {
    const sessionCookie = request.cookies?.admin_session || request.headers.authorization?.replace("Bearer ", "");
    if (!sessionCookie || !activeSessions[sessionCookie]) {
      return reply.status(401).send({ authenticated: false });
    }
    return { authenticated: true, user: { username: "admin", role: "SUPER_ADMIN" } };
  });

  // 4. Bookings Management
  server.get("/api/v1/admin/bookings", async (request, reply) => {
    if (!(await requireAdminAuth(request, reply))) return;

    const { status, barberId, search, date } = request.query as any;
    let list = [...bookingsStore];

    if (status) {
      list = list.filter((b) => b.status === status);
    }
    if (barberId) {
      list = list.filter((b) => b.barberId === barberId);
    }
    if (date) {
      list = list.filter((b) => b.date === date);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (b) =>
          b.clientName.toLowerCase().includes(q) ||
          b.clientPhone.includes(q) ||
          b.serviceName.toLowerCase().includes(q) ||
          b.token.includes(q)
      );
    }

    return { data: list };
  });

  // Create Manual Booking
  const CreateManualBookingSchema = z.object({
    serviceId: z.string(),
    barberId: z.string(),
    date: z.string(),
    startTime: z.string(),
    clientName: z.string(),
    clientPhone: z.string(),
    clientEmail: z.string().optional(),
    notes: z.string().optional(),
    status: z.enum(["CONFIRMED", "CANCELLED", "COMPLETED"]).optional(),
  });

  server.post("/api/v1/admin/bookings", async (request, reply) => {
    if (!(await requireAdminAuth(request, reply))) return;

    const parseResult = CreateManualBookingSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: "Invalid booking payload", details: parseResult.error.format() });
    }

    const data = parseResult.data;
    const service = SERVICES.find((s) => s.id === data.serviceId) || SERVICES[0];
    const barber = BARBERS.find((b) => b.id === data.barberId) || BARBERS[0];

    const token = "blk_" + Math.random().toString(36).substring(2, 10);
    const newBooking: Booking = {
      id: "b_" + Date.now(),
      token,
      barberId: barber.id,
      barberName: barber.name,
      serviceId: service.id,
      serviceName: service.name,
      date: data.date,
      startTime: data.startTime,
      endTime: addMinutesToTime(data.startTime, service.durationMin),
      totalPrice: service.price,
      totalDurationMin: service.durationMin,
      clientName: data.clientName,
      clientPhone: data.clientPhone,
      clientEmail: data.clientEmail,
      notes: data.notes,
      status: data.status || "CONFIRMED",
      createdAt: new Date().toISOString(),
    };

    bookingsStore.push(newBooking);
    return reply.status(201).send({ data: newBooking });
  });

  // Update Booking Status / Details
  server.patch("/api/v1/admin/bookings/:id", async (request, reply) => {
    if (!(await requireAdminAuth(request, reply))) return;

    const { id } = request.params as { id: string };
    const booking = bookingsStore.find((b) => b.id === id);
    if (!booking) {
      return reply.status(404).send({ error: "Booking not found" });
    }

    const body = request.body as Partial<Booking>;
    if (body.status) booking.status = body.status;
    if (body.date) booking.date = body.date;
    if (body.startTime) {
      booking.startTime = body.startTime;
      booking.endTime = addMinutesToTime(body.startTime, booking.totalDurationMin);
    }
    if (body.notes !== undefined) booking.notes = body.notes;

    return { data: booking };
  });

  // Delete Booking
  server.delete("/api/v1/admin/bookings/:id", async (request, reply) => {
    if (!(await requireAdminAuth(request, reply))) return;

    const { id } = request.params as { id: string };
    const idx = bookingsStore.findIndex((b) => b.id === id);
    if (idx === -1) {
      return reply.status(404).send({ error: "Booking not found" });
    }

    bookingsStore.splice(idx, 1);
    return { success: true };
  });

  // 5. Services CRUD
  server.get("/api/v1/admin/services", async (request, reply) => {
    if (!(await requireAdminAuth(request, reply))) return;
    return { data: SERVICES };
  });

  server.post("/api/v1/admin/services", async (request, reply) => {
    if (!(await requireAdminAuth(request, reply))) return;
    const body = request.body as Partial<Service>;
    const newService: Service = {
      id: "srv_" + Date.now(),
      name: body.name || "Новая услуга",
      description: body.description || "",
      price: Number(body.price) || 50,
      durationMin: Number(body.durationMin) || 30,
      isActive: true,
    };
    SERVICES.push(newService);
    return reply.status(201).send({ data: newService });
  });

  server.put("/api/v1/admin/services/:id", async (request, reply) => {
    if (!(await requireAdminAuth(request, reply))) return;
    const { id } = request.params as { id: string };
    const service = SERVICES.find((s) => s.id === id);
    if (!service) return reply.status(404).send({ error: "Service not found" });

    const body = request.body as Partial<Service>;
    if (body.name) service.name = body.name;
    if (body.description !== undefined) service.description = body.description;
    if (body.price !== undefined) service.price = Number(body.price);
    if (body.durationMin !== undefined) service.durationMin = Number(body.durationMin);
    if (body.isActive !== undefined) service.isActive = body.isActive;

    return { data: service };
  });

  server.delete("/api/v1/admin/services/:id", async (request, reply) => {
    if (!(await requireAdminAuth(request, reply))) return;
    const { id } = request.params as { id: string };
    const idx = SERVICES.findIndex((s) => s.id === id);
    if (idx !== -1) SERVICES.splice(idx, 1);
    return { success: true };
  });

  // 6. Barbers CRUD
  server.get("/api/v1/admin/barbers", async (request, reply) => {
    if (!(await requireAdminAuth(request, reply))) return;
    return { data: BARBERS };
  });

  server.post("/api/v1/admin/barbers", async (request, reply) => {
    if (!(await requireAdminAuth(request, reply))) return;
    const body = request.body as Partial<Barber>;
    const newBarber: Barber = {
      id: "brb_" + Date.now(),
      name: body.name || "Новый мастер",
      roleTitle: body.roleTitle || "Barber",
      avatarUrl: body.avatarUrl || "/images/default-avatar.jpg",
      phone: body.phone || "",
      email: body.email || "",
      isActive: true,
      workingHours: body.workingHours || Array.from({ length: 7 }, (_, i) => ({
        dayOfWeek: i,
        startTime: "10:00",
        endTime: "20:00",
        isOff: i === 0,
      })),
    };
    BARBERS.push(newBarber);
    return reply.status(201).send({ data: newBarber });
  });

  server.put("/api/v1/admin/barbers/:id", async (request, reply) => {
    if (!(await requireAdminAuth(request, reply))) return;
    const { id } = request.params as { id: string };
    const barber = BARBERS.find((b) => b.id === id);
    if (!barber) return reply.status(404).send({ error: "Barber not found" });

    const body = request.body as Partial<Barber>;
    if (body.name) barber.name = body.name;
    if (body.roleTitle) barber.roleTitle = body.roleTitle;
    if (body.avatarUrl) barber.avatarUrl = body.avatarUrl;
    if (body.phone !== undefined) barber.phone = body.phone;
    if (body.email !== undefined) barber.email = body.email;
    if (body.isActive !== undefined) barber.isActive = body.isActive;
    if (body.workingHours) barber.workingHours = body.workingHours;

    return { data: barber };
  });

  // 7. Reviews List
  server.get("/api/v1/admin/reviews", async (request, reply) => {
    if (!(await requireAdminAuth(request, reply))) return;
    return { data: reviewsStore };
  });

  // 8. Settings Management
  server.get("/api/v1/admin/settings", async (request, reply) => {
    if (!(await requireAdminAuth(request, reply))) return;
    return { data: settingsStore };
  });

  server.put("/api/v1/admin/settings", async (request, reply) => {
    if (!(await requireAdminAuth(request, reply))) return;
    const body = request.body as Record<string, string>;
    Object.assign(settingsStore, body);
    return { data: settingsStore };
  });

  // 9. Analytics Endpoint
  server.get("/api/v1/admin/analytics", async (request, reply) => {
    if (!(await requireAdminAuth(request, reply))) return;

    const { period = "all" } = request.query as { period?: string };
    const now = new Date();

    let filteredBookings = [...bookingsStore];
    if (period === "7d") {
      const past7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      filteredBookings = filteredBookings.filter((b) => b.date >= past7d);
    } else if (period === "30d") {
      const past30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      filteredBookings = filteredBookings.filter((b) => b.date >= past30d);
    }

    // Revenue calculations
    const completedBookings = filteredBookings.filter((b) => b.status === "COMPLETED");
    const confirmedBookings = filteredBookings.filter((b) => b.status === "CONFIRMED");
    const cancelledBookings = filteredBookings.filter((b) => b.status === "CANCELLED");

    const totalRevenue = [...completedBookings, ...confirmedBookings].reduce((sum, b) => sum + (b.totalPrice || 0), 0);
    const completedRevenue = completedBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    const totalCount = filteredBookings.length;
    const cancellationRate = totalCount > 0 ? Math.round((cancelledBookings.length / totalCount) * 100) : 0;

    // Popular Services breakdown
    const serviceStatsMap: Record<string, { serviceName: string; count: number; revenue: number }> = {};
    SERVICES.forEach((s) => {
      serviceStatsMap[s.id] = { serviceName: s.name, count: 0, revenue: 0 };
    });

    filteredBookings.forEach((b) => {
      if (b.status !== "CANCELLED") {
        if (!serviceStatsMap[b.serviceId]) {
          serviceStatsMap[b.serviceId] = { serviceName: b.serviceName, count: 0, revenue: 0 };
        }
        serviceStatsMap[b.serviceId].count += 1;
        serviceStatsMap[b.serviceId].revenue += b.totalPrice || 0;
      }
    });

    const popularServices = Object.values(serviceStatsMap).sort((a, b) => b.count - a.count);

    // Barber Workload breakdown
    const barberStatsMap: Record<string, { barberName: string; count: number; revenue: number }> = {};
    BARBERS.forEach((b) => {
      barberStatsMap[b.id] = { barberName: b.name, count: 0, revenue: 0 };
    });

    filteredBookings.forEach((b) => {
      if (b.status !== "CANCELLED") {
        if (!barberStatsMap[b.barberId]) {
          barberStatsMap[b.barberId] = { barberName: b.barberName, count: 0, revenue: 0 };
        }
        barberStatsMap[b.barberId].count += 1;
        barberStatsMap[b.barberId].revenue += b.totalPrice || 0;
      }
    });

    const barberWorkload = Object.values(barberStatsMap).sort((a, b) => b.count - a.count);

    // Customer Retention
    const clientPhoneCounts: Record<string, number> = {};
    filteredBookings.forEach((b) => {
      if (b.clientPhone) {
        clientPhoneCounts[b.clientPhone] = (clientPhoneCounts[b.clientPhone] || 0) + 1;
      }
    });

    const uniqueClients = Object.keys(clientPhoneCounts).length;
    const repeatClients = Object.values(clientPhoneCounts).filter((cnt) => cnt > 1).length;
    const retentionRate = uniqueClients > 0 ? Math.round((repeatClients / uniqueClients) * 100) : 0;

    // Heatmap calculation (Days: 0..6, Hours: 10..20)
    // heatmap matrix: [dayOfWeek][hourIndex]
    const daysName = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
    const hoursList = ["10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"];

    const heatmapGrid: number[][] = Array.from({ length: 7 }, () => Array(hoursList.length).fill(0));

    filteredBookings.forEach((b) => {
      if (b.status !== "CANCELLED" && b.date) {
        const d = new Date(b.date);
        const dayIdx = d.getDay(); // 0..6
        const hourStr = b.startTime.split(":")[0] + ":00";
        const hourIdx = hoursList.indexOf(hourStr);
        if (dayIdx >= 0 && dayIdx < 7 && hourIdx !== -1) {
          heatmapGrid[dayIdx][hourIdx] += 1;
        }
      }
    });

    return {
      data: {
        period,
        summary: {
          totalRevenue,
          completedRevenue,
          totalBookings: totalCount,
          completedCount: completedBookings.length,
          cancelledCount: cancelledBookings.length,
          cancellationRate,
          uniqueClients,
          repeatClients,
          retentionRate,
        },
        popularServices,
        barberWorkload,
        heatmap: {
          days: daysName,
          hours: hoursList,
          grid: heatmapGrid,
        },
      },
    };
  });
}

