// Shared API client for Mini App
export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  durationMin: number;
}

export interface Barber {
  id: string;
  name: string;
  roleTitle: string;
  avatarUrl?: string;
}

export interface SlotStatus {
  time: string;
  endTime: string;
  available: boolean;
  reason?: string;
}

export interface Booking {
  id: string;
  token: string;
  barberId: string;
  barberName: string;
  serviceId: string;
  serviceName: string;
  date: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
  totalDurationMin: number;
  clientName: string;
  clientPhone: string;
  status: "CONFIRMED" | "CANCELLED" | "COMPLETED";
  createdAt: string;
}

export async function fetchServices(): Promise<Service[]> {
  const res = await fetch(`${API_BASE}/api/v1/services`);
  const json = await res.json();
  return json.data;
}

export async function fetchBarbers(): Promise<Barber[]> {
  const res = await fetch(`${API_BASE}/api/v1/barbers`);
  const json = await res.json();
  return json.data;
}

export async function fetchSlots(
  date: string,
  barberId: string,
  serviceId: string
): Promise<SlotStatus[]> {
  const params = new URLSearchParams({ date, barberId, serviceId });
  const res = await fetch(`${API_BASE}/api/v1/availability?${params}`);
  const json = await res.json();
  return json.data.slots;
}

export async function createBooking(payload: {
  serviceId: string;
  barberId: string;
  date: string;
  startTime: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  notes?: string;
}): Promise<{ data: Booking } | { error: string; code?: string }> {
  const res = await fetch(`${API_BASE}/api/v1/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function cancelBooking(token: string): Promise<void> {
  await fetch(`${API_BASE}/api/v1/bookings/${token}/cancel`, { method: "POST" });
}
