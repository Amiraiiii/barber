"use client";

import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  DollarSign,
  CalendarCheck,
  UserCheck,
  Percent,
  Scissors,
  Users,
  Grid,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const getHeaders = (): Record<string, string> => {
  const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
};

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("all");

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/v1/admin/analytics?period=${period}`, {
        credentials: "include",
        headers: getHeaders(),
      });
      const json = await res.json();
      if (json.data) setAnalytics(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !analytics) {
    return (
      <div className="text-center py-20 text-zinc-500 text-sm">
        Загрузка бизнес-аналитики...
      </div>
    );
  }

  const { summary, popularServices, barberWorkload, heatmap } = analytics;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header & Period Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-serif">Бизнес-аналитика</h1>
          <p className="text-sm text-zinc-400 mt-1">Показатели выручки, загрузки мастеров и пиковых часов</p>
        </div>

        <div className="flex items-center space-x-2 bg-[#121215] border border-[#27272a] p-1.5 rounded-xl">
          {[
            { label: "Все время", value: "all" },
            { label: "7 дней", value: "7d" },
            { label: "30 дней", value: "30d" },
          ].map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                period === p.value
                  ? "bg-amber-500 text-black shadow"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-[#121215] border border-[#27272a] rounded-2xl p-6 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Общая выручка</span>
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mt-3">${summary.totalRevenue}</div>
          <p className="text-xs text-amber-400 mt-2 flex items-center space-x-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Выполнено: ${summary.completedRevenue}</span>
          </p>
        </div>

        <div className="bg-[#121215] border border-[#27272a] rounded-2xl p-6 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Всего записей</span>
            <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mt-3">{summary.totalBookings}</div>
          <p className="text-xs text-zinc-400 mt-2">Завершено: {summary.completedCount}</p>
        </div>

        <div className="bg-[#121215] border border-[#27272a] rounded-2xl p-6 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Процент отмен</span>
            <div className="p-2.5 bg-red-500/10 text-red-400 rounded-xl">
              <Percent className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mt-3">{summary.cancellationRate}%</div>
          <p className="text-xs text-red-400 mt-2">Отменено записей: {summary.cancelledCount}</p>
        </div>

        <div className="bg-[#121215] border border-[#27272a] rounded-2xl p-6 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Возвращаемость</span>
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mt-3">{summary.retentionRate}%</div>
          <p className="text-xs text-emerald-400 mt-2">Повторные клиенты: {summary.repeatClients}</p>
        </div>
      </div>

      {/* Heatmap Section */}
      <div className="bg-[#121215] border border-[#27272a] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-white font-serif flex items-center space-x-2">
              <Grid className="w-5 h-5 text-amber-400" />
              <span>Тепловая карта загрузки (День недели × Час)</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-1">Визуализация пиковых часов визитов клиентов</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs">
            <thead>
              <tr className="border-b border-[#27272a]">
                <th className="py-2.5 px-3 text-left font-semibold text-zinc-400">День / Час</th>
                {heatmap.hours.map((h: string) => (
                  <th key={h} className="py-2.5 px-2 font-semibold text-zinc-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a]">
              {heatmap.days.map((dayName: string, dayIdx: number) => (
                <tr key={dayName}>
                  <td className="py-3 px-3 text-left font-semibold text-zinc-300">{dayName}</td>
                  {heatmap.hours.map((_: string, hrIdx: number) => {
                    const count = heatmap.grid[dayIdx][hrIdx] || 0;
                    return (
                      <td key={hrIdx} className="p-1">
                        <div
                          title={`${dayName}, ${heatmap.hours[hrIdx]} — Записей: ${count}`}
                          className={`py-2 px-1 rounded-lg font-bold transition flex items-center justify-center ${
                            count === 0
                              ? "bg-[#18181b] text-zinc-600"
                              : count === 1
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              : count === 2
                              ? "bg-amber-500/40 text-amber-200 border border-amber-500/50"
                              : "bg-amber-500 text-black shadow-md shadow-amber-500/20"
                          }`}
                        >
                          {count}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Breakdowns: Services & Barbers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Services */}
        <div className="bg-[#121215] border border-[#27272a] rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white font-serif mb-4 flex items-center space-x-2">
            <Scissors className="w-5 h-5 text-amber-400" />
            <span>Популярность услуг</span>
          </h2>

          <div className="space-y-4">
            {popularServices.map((srv: any) => {
              const maxCount = Math.max(...popularServices.map((s: any) => s.count), 1);
              const percent = Math.round((srv.count / maxCount) * 100);

              return (
                <div key={srv.serviceName} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-zinc-200">{srv.serviceName}</span>
                    <span className="text-zinc-400">{srv.count} записей (${srv.revenue})</span>
                  </div>
                  <div className="w-full bg-[#18181b] h-2.5 rounded-full overflow-hidden border border-[#27272a]">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Barber Workload */}
        <div className="bg-[#121215] border border-[#27272a] rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white font-serif mb-4 flex items-center space-x-2">
            <Users className="w-5 h-5 text-amber-400" />
            <span>Загрузка мастеров</span>
          </h2>

          <div className="space-y-4">
            {barberWorkload.map((brb: any) => {
              const maxCount = Math.max(...barberWorkload.map((b: any) => b.count), 1);
              const percent = Math.round((brb.count / maxCount) * 100);

              return (
                <div key={brb.barberName} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-zinc-200">{brb.barberName}</span>
                    <span className="text-zinc-400">{brb.count} записей (${brb.revenue})</span>
                  </div>
                  <div className="w-full bg-[#18181b] h-2.5 rounded-full overflow-hidden border border-[#27272a]">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
