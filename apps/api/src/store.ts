export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  durationMin: number;
  isActive?: boolean;
}

export interface WorkingHoursConfig {
  dayOfWeek: number; // 0..6
  startTime: string; // "10:00"
  endTime: string;   // "20:00"
  isOff: boolean;
  breakStart?: string; // "14:00"
  breakEnd?: string;   // "15:00"
}

export interface Barber {
  id: string;
  name: string;
  roleTitle: string;
  avatarUrl: string;
  phone?: string;
  email?: string;
  bio?: string;
  telegramChatId?: number;
  isActive?: boolean;
  workingHours?: WorkingHoursConfig[];
  portfolioUrls?: string[];
}

export interface Booking {
  id: string;
  token: string;
  barberId: string;
  barberName: string;
  serviceId: string;
  serviceName: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  totalPrice: number;
  totalDurationMin: number;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  telegramChatId?: number;
  notes?: string;
  reminderDaySentAt?: string;
  reminder30mSentAt?: string;
  reviewRequestedAt?: string;
  autoCompletedAt?: string;
  status: "CONFIRMED" | "CANCELLED" | "COMPLETED";
  createdAt: string;
}

export interface Review {
  id: string;
  bookingId: string;
  barberId: string;
  barberName: string;
  clientName: string;
  rating: number; // 1..5
  comment: string;
  createdAt: string;
}

export interface SettingItem {
  key: string;
  value: string;
}

export interface AdminUser {
  id: string;
  username: string;
  passwordHash: string;
  role: "SUPER_ADMIN" | "MANAGER";
}

export const SERVICES: Service[] = [
  {
    id: "haircut",
    name: "Signature Haircut",
    description: "Precision cut, razor line-up, wash, scalp massage & hot towel finish.",
    price: 65,
    durationMin: 45,
    isActive: true,
  },
  {
    id: "beard",
    name: "Beard Sculpting",
    description: "Razor edge line-up, precise trim, hot oil treatment & beard balm finish.",
    price: 45,
    durationMin: 30,
    isActive: true,
  },
  {
    id: "executive",
    name: "The Executive Package",
    description: "Signature haircut + Beard sculpt + luxury scalp & shoulder relaxation.",
    price: 100,
    durationMin: 75,
    isActive: true,
  },
  {
    id: "shave",
    name: "Royal Hot Towel Shave",
    description: "Traditional straight-razor shave with warm pre-shave oil & cold compress.",
    price: 55,
    durationMin: 45,
    isActive: true,
  },
  {
    id: "buzz",
    name: "Buzz Cut & Line-Up",
    description: "Clipper fade/buzz cut with razor neck cleanup & cold towel refresh.",
    price: 40,
    durationMin: 30,
    isActive: true,
  },
];

export const BARBERS: Barber[] = [
  {
    id: "vance",
    name: "Alexander Vance",
    roleTitle: "Senior Master Barber",
    avatarUrl: "/images/barber-vance.jpg",
    phone: "+7 999 111 22 33",
    email: "vance@blackline.com",
    isActive: true,
    portfolioUrls: ["/images/portfolio1.jpg", "/images/portfolio2.jpg"],
    workingHours: Array.from({ length: 7 }, (_, i) => ({
      dayOfWeek: i,
      startTime: "10:00",
      endTime: "20:00",
      isOff: i === 0, // Sunday off
      breakStart: "14:00",
      breakEnd: "15:00",
    })),
  },
  {
    id: "cole",
    name: "Dmitri Cole",
    roleTitle: "Master Craftsman",
    avatarUrl: "/images/barber-cole.jpg",
    phone: "+7 999 222 33 44",
    email: "cole@blackline.com",
    isActive: true,
    portfolioUrls: ["/images/portfolio3.jpg"],
    workingHours: Array.from({ length: 7 }, (_, i) => ({
      dayOfWeek: i,
      startTime: "11:00",
      endTime: "21:00",
      isOff: i === 0,
      breakStart: "15:00",
      breakEnd: "16:00",
    })),
  },
  {
    id: "mercer",
    name: "Julian Mercer",
    roleTitle: "Senior Stylist",
    avatarUrl: "/images/barber-mercer.jpg",
    phone: "+7 999 333 44 55",
    email: "mercer@blackline.com",
    isActive: true,
    portfolioUrls: ["/images/portfolio4.jpg"],
    workingHours: Array.from({ length: 7 }, (_, i) => ({
      dayOfWeek: i,
      startTime: "10:00",
      endTime: "19:00",
      isOff: i === 6 || i === 0, // Sat, Sun off
    })),
  },
];

// One-time binding codes for barbers: code -> barberId
export const barberBindingCodes: Record<string, string> = {
  "vance123": "vance",
  "cole123": "cole",
  "mercer123": "mercer",
};

// In-memory stores
export const bookingsStore: Booking[] = [
  {
    id: "b1",
    token: "blk_demo123",
    barberId: "cole",
    barberName: "Dmitri Cole",
    serviceId: "executive",
    serviceName: "The Executive Package",
    date: new Date().toISOString().split("T")[0],
    startTime: "12:00",
    endTime: "13:15",
    totalPrice: 100,
    totalDurationMin: 75,
    clientName: "Demo Client",
    clientPhone: "+1 555 019 2831",
    status: "CONFIRMED",
    createdAt: new Date().toISOString(),
  },
];

export const reviewsStore: Review[] = [
  {
    id: "r1",
    bookingId: "b1",
    barberId: "cole",
    barberName: "Dmitri Cole",
    clientName: "Александр В.",
    rating: 5,
    comment: "Отличная стрижка! Мастер отнесся с вниманием к деталям. Горячее полотенце просто супер.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "r2",
    bookingId: "b2",
    barberId: "vance",
    barberName: "Alexander Vance",
    clientName: "Михаил К.",
    rating: 5,
    comment: "Превосходная форма бороды. Атмосфера в барбершопе стильная и солидная.",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

export const settingsStore: Record<string, string> = {
  salonName: "BLACKLINE BARBERS",
  address: "ул. Центральная 10, Москва",
  phone: "+7 (495) 000-00-00",
  workingHours: "Пн-Сб 10:00 - 21:00, Вс — Выходной",
  cancelGracePeriodHours: "2",
};

export const activeSessions: Record<string, { username: string; expiresAt: number }> = {};

export function addMinutesToTime(timeStr: string, mins: number): string {
  const [h, m] = timeStr.split(":").map(Number);
  const total = h * 60 + m + mins;
  const newH = Math.floor(total / 60);
  const newM = total % 60;
  return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
}
