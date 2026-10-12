"use client";

import React, { useState, useEffect } from "react";
import {
  CalendarCheck,
  Plus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  Edit2,
  X,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const getHeaders = (): Record<string, string> => {
  const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
};

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [barbers, setBarbers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [newBooking, setNewBooking] = useState({
    serviceId: "haircut",
    barberId: "vance",
    date: new Date().toISOString().split("T")[0],
    startTime: "12:00",
    clientName: "",
    clientPhone: "",
    notes: "",
  });

  useEffect(() => {
    fetchBookings();
    fetchServicesAndBarbers();
  }, [statusFilter, search]);

  const fetchServicesAndBarbers = async () => {
    try {
      const [resSrv, resBrb] = await Promise.all([
        fetch(`${API_BASE}/api/v1/services`),
        fetch(`${API_BASE}/api/v1/barbers`),
      ]);
      const dataSrv = await resSrv.json();
      const dataBrb = await resBrb.json();
      if (dataSrv.data) setServices(dataSrv.data);
      if (dataBrb.data) setBarbers(dataBrb.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchBookings = async () => {
    try {
      setLoading(true);
      let url = `${API_BASE}/api/v1/admin/bookings?`;
      if (statusFilter !== "ALL") url += `status=${statusFilter}&`;
      if (search) url += `search=${encodeURIComponent(search)}&`;

      const res = await fetch(url, { credentials: "include", headers: getHeaders() });
      const json = await res.json();
      if (json.data) setBookings(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await fetch(`${API_BASE}/api/v1/admin/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getHeaders() },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });
      fetchBookings();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteBooking = async (id: string) => {
    if (!confirm("Вы уверены, что хотите удалить эту запись?")) return;
    try {
      await fetch(`${API_BASE}/api/v1/admin/bookings/${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: getHeaders(),
      });
      fetchBookings();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getHeaders() },
        credentials: "include",
        body: JSON.stringify(newBooking),
      });
      if (res.ok) {
        setIsCreateModalOpen(false);
        setNewBooking({
          serviceId: "haircut",
          barberId: "vance",
          date: new Date().toISOString().split("T")[0],
          startTime: "12:00",
          clientName: "",
          clientPhone: "",
          notes: "",
        });
        fetchBookings();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-serif">Управление записями</h1>
          <p className="text-sm text-zinc-400 mt-1">Просмотр, создание ручных бронирований и смена статусов</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-xl text-sm transition shadow-lg shadow-amber-500/10 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Создать запись вручную</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-[#121215] border border-[#27272a] rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по клиенту, телефону, токену..."
            className="w-full bg-[#18181b] border border-[#3f3f46] rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 transition"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto">
          {["ALL", "CONFIRMED", "COMPLETED", "CANCELLED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition cursor-pointer whitespace-nowrap ${
                statusFilter === st
                  ? "bg-amber-500 text-black"
                  : "bg-[#18181b] text-zinc-400 hover:text-white border border-[#27272a]"
              }`}
            >
              {st === "ALL" ? "Все" : st === "CONFIRMED" ? "Подтверждены" : st === "COMPLETED" ? "Завершены" : "Отменены"}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-[#121215] border border-[#27272a] rounded-2xl p-6">
        {loading ? (
          <div className="text-center py-12 text-zinc-500 text-sm">Загрузка записей...</div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 text-sm">Записей не найдено</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#27272a] text-zinc-400 text-xs uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Клиент</th>
                  <th className="pb-3 font-semibold">Услуга</th>
                  <th className="pb-3 font-semibold">Барбер</th>
                  <th className="pb-3 font-semibold">Дата & Время</th>
                  <th className="pb-3 font-semibold">Цена</th>
                  <th className="pb-3 font-semibold">Статус</th>
                  <th className="pb-3 font-semibold text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a]">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-[#18181b]/50 transition">
                    <td className="py-4">
                      <div className="font-semibold text-white">{b.clientName}</div>
                      <div className="text-xs text-zinc-400">{b.clientPhone}</div>
                      <div className="text-[11px] text-zinc-500 font-mono">#{b.token}</div>
                    </td>
                    <td className="py-4 text-zinc-300 font-medium">{b.serviceName}</td>
                    <td className="py-4 text-zinc-300">{b.barberName}</td>
                    <td className="py-4 text-zinc-300">
                      <div className="flex items-center space-x-1.5">
                        <Clock className="w-3.5 h-3.5 text-zinc-500" />
                        <span>{b.date} @ {b.startTime} - {b.endTime}</span>
                      </div>
                    </td>
                    <td className="py-4 font-semibold text-white">${b.totalPrice}</td>
                    <td className="py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          b.status === "CONFIRMED"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : b.status === "COMPLETED"
                            ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                            : "bg-red-500/10 text-red-400 border border-red-500/20"
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="py-4 text-right space-x-2">
                      {b.status === "CONFIRMED" && (
                        <button
                          onClick={() => handleUpdateStatus(b.id, "COMPLETED")}
                          title="Завершить визит"
                          className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-medium cursor-pointer"
                        >
                          Завершить
                        </button>
                      )}
                      {b.status !== "CANCELLED" && (
                        <button
                          onClick={() => handleUpdateStatus(b.id, "CANCELLED")}
                          title="Отменить бронь"
                          className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-xs font-medium cursor-pointer"
                        >
                          Отменить
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteBooking(b.id)}
                        className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Booking Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#121215] border border-[#27272a] rounded-2xl w-full max-w-lg p-6 relative">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute right-4 top-4 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-white font-serif mb-4">Новая запись (вручную)</h2>

            <form onSubmit={handleCreateBooking} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">Клиент (Имя)</label>
                <input
                  type="text"
                  required
                  value={newBooking.clientName}
                  onChange={(e) => setNewBooking({ ...newBooking, clientName: e.target.value })}
                  placeholder="Константин Иванченко"
                  className="w-full bg-[#18181b] border border-[#3f3f46] rounded-xl p-3 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">Телефон</label>
                <input
                  type="text"
                  required
                  value={newBooking.clientPhone}
                  onChange={(e) => setNewBooking({ ...newBooking, clientPhone: e.target.value })}
                  placeholder="+7 999 123 45 67"
                  className="w-full bg-[#18181b] border border-[#3f3f46] rounded-xl p-3 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">Услуга</label>
                  <select
                    value={newBooking.serviceId}
                    onChange={(e) => setNewBooking({ ...newBooking, serviceId: e.target.value })}
                    className="w-full bg-[#18181b] border border-[#3f3f46] rounded-xl p-3 text-sm text-white focus:outline-none focus:border-amber-400"
                  >
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} (${s.price})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">Барбер</label>
                  <select
                    value={newBooking.barberId}
                    onChange={(e) => setNewBooking({ ...newBooking, barberId: e.target.value })}
                    className="w-full bg-[#18181b] border border-[#3f3f46] rounded-xl p-3 text-sm text-white focus:outline-none focus:border-amber-400"
                  >
                    {barbers.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">Дата</label>
                  <input
                    type="date"
                    required
                    value={newBooking.date}
                    onChange={(e) => setNewBooking({ ...newBooking, date: e.target.value })}
                    className="w-full bg-[#18181b] border border-[#3f3f46] rounded-xl p-3 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">Время</label>
                  <input
                    type="time"
                    required
                    value={newBooking.startTime}
                    onChange={(e) => setNewBooking({ ...newBooking, startTime: e.target.value })}
                    className="w-full bg-[#18181b] border border-[#3f3f46] rounded-xl p-3 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">Заметки</label>
                <textarea
                  value={newBooking.notes}
                  onChange={(e) => setNewBooking({ ...newBooking, notes: e.target.value })}
                  placeholder="Пожелание клиента..."
                  className="w-full bg-[#18181b] border border-[#3f3f46] rounded-xl p-3 text-sm text-white focus:outline-none focus:border-amber-400 h-20"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-xl text-sm transition mt-4 cursor-pointer"
              >
                Сохранить запись
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
