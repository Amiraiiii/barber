"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  CalendarCheck,
  DollarSign,
  Users,
  Star,
  Plus,
  ArrowUpRight,
  Clock,
  TrendingUp,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const getHeaders = (): Record<string, string> => {
  const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
};

export default function AdminDashboardPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/bookings`, {
        credentials: "include",
        headers: getHeaders(),
      });
      const json = await res.json();
      if (json.data) {
        setBookings(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const activeCount = bookings.filter((b) => b.status === "CONFIRMED").length;
  const totalRevenue = bookings
    .filter((b) => b.status === "CONFIRMED" || b.status === "COMPLETED")
    .reduce((acc, b) => acc + (b.totalPrice || 0), 0);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-serif">Обзор барбершопа</h1>
          <p className="text-sm text-zinc-400 mt-1">Оперативная сводка записей, дохода и работы мастеров</p>
        </div>
        <Link
          href="/admin/bookings"
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-xl text-sm transition shadow-lg shadow-amber-500/10 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Создать запись</span>
        </Link>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-[#121215] border border-[#27272a] rounded-2xl p-6 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Активные записи</span>
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mt-3">{activeCount}</div>
          <p className="text-xs text-zinc-500 mt-2">Бронирований к выполнению</p>
        </div>

        <div className="bg-[#121215] border border-[#27272a] rounded-2xl p-6 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Доход (расчетный)</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mt-3">${totalRevenue}</div>
          <p className="text-xs text-emerald-400 mt-2 flex items-center space-x-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Выручка с подтвержденных записей</span>
          </p>
        </div>

        <div className="bg-[#121215] border border-[#27272a] rounded-2xl p-6 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Мастера на смене</span>
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mt-3">3</div>
          <p className="text-xs text-zinc-500 mt-2">Все мастера работают по графику</p>
        </div>

        <div className="bg-[#121215] border border-[#27272a] rounded-2xl p-6 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Средняя оценка</span>
            <div className="p-2 bg-yellow-500/10 text-yellow-400 rounded-xl">
              <Star className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mt-3">5.0 / 5</div>
          <p className="text-xs text-yellow-400 mt-2">На основе отзывов клиентов</p>
        </div>
      </div>

      {/* Recent Bookings Section */}
      <div className="bg-[#121215] border border-[#27272a] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white font-serif">Последние записи</h2>
          <Link
            href="/admin/bookings"
            className="text-xs text-amber-400 hover:underline flex items-center space-x-1"
          >
            <span>Смотреть все</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-10 text-zinc-500 text-sm">Загрузка данных...</div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-10 text-zinc-500 text-sm">Записей пока нет</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#27272a] text-zinc-400 text-xs uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Клиент</th>
                  <th className="pb-3 font-semibold">Услуга</th>
                  <th className="pb-3 font-semibold">Барбер</th>
                  <th className="pb-3 font-semibold">Дата & Время</th>
                  <th className="pb-3 font-semibold">Сумма</th>
                  <th className="pb-3 font-semibold">Статус</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a]">
                {bookings.slice(0, 5).map((booking) => (
                  <tr key={booking.id} className="hover:bg-[#18181b]/50 transition">
                    <td className="py-4">
                      <div className="font-semibold text-white">{booking.clientName}</div>
                      <div className="text-xs text-zinc-400">{booking.clientPhone}</div>
                    </td>
                    <td className="py-4 text-zinc-300">{booking.serviceName}</td>
                    <td className="py-4 text-zinc-300">{booking.barberName}</td>
                    <td className="py-4 text-zinc-300">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-zinc-500" />
                        <span>{booking.date} @ {booking.startTime}</span>
                      </div>
                    </td>
                    <td className="py-4 font-semibold text-white">${booking.totalPrice}</td>
                    <td className="py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          booking.status === "CONFIRMED"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : booking.status === "COMPLETED"
                            ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                            : "bg-red-500/10 text-red-400 border border-red-500/20"
                        }`}
                      >
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
