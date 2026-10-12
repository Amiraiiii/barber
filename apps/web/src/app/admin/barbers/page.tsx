"use client";

import React, { useState, useEffect } from "react";
import { Users, Plus, Edit2, Calendar, Phone, Mail, Clock, CheckCircle, X } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const DAYS_OF_WEEK = ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"];

const getHeaders = (): Record<string, string> => {
  const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
};

export default function AdminBarbersPage() {
  const [barbers, setBarbers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBarber, setSelectedBarber] = useState<any | null>(null);

  useEffect(() => {
    fetchBarbers();
  }, []);

  const fetchBarbers = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/barbers`, {
        credentials: "include",
        headers: getHeaders(),
      });
      const json = await res.json();
      if (json.data) {
        setBarbers(json.data);
        if (json.data.length > 0) setSelectedBarber(json.data[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-serif">Мастера и графики работы</h1>
          <p className="text-sm text-zinc-400 mt-1">Управление персоналом, рабочими сменами и перерывами</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Barbers List */}
        <div className="space-y-4">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Список мастеров</h2>
          {loading ? (
            <div className="text-zinc-500 text-sm py-4">Загрузка мастеров...</div>
          ) : (
            barbers.map((b) => (
              <div
                key={b.id}
                onClick={() => setSelectedBarber(b)}
                className={`p-5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                  selectedBarber?.id === b.id
                    ? "bg-[#1d1d22] border-amber-500/50 shadow-lg shadow-amber-500/5"
                    : "bg-[#121215] border-[#27272a] hover:border-zinc-700"
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-amber-400 text-lg">
                    {b.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">{b.name}</h3>
                    <p className="text-xs text-zinc-400">{b.roleTitle}</p>
                    <div className="flex items-center space-x-2 text-[11px] text-zinc-500 mt-1">
                      <span>{b.phone}</span>
                    </div>
                  </div>
                </div>

                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    b.isActive !== false ? "bg-emerald-500" : "bg-zinc-600"
                  }`}
                />
              </div>
            ))
          )}
        </div>

        {/* Schedule & Working Hours Details */}
        <div className="lg:col-span-2 bg-[#121215] border border-[#27272a] rounded-2xl p-6">
          {selectedBarber ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-[#27272a] pb-4">
                <div>
                  <h2 className="text-xl font-bold text-white font-serif">{selectedBarber.name}</h2>
                  <p className="text-xs text-amber-400 font-medium">{selectedBarber.roleTitle}</p>
                </div>
                <div className="text-xs text-zinc-400">
                  <span>Telegram ID: </span>
                  <code className="text-zinc-200">{selectedBarber.telegramChatId || "Не привязан"}</code>
                </div>
              </div>

              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Недельный график смен</h3>

              <div className="space-y-3">
                {(selectedBarber.workingHours || []).map((wh: any) => (
                  <div
                    key={wh.dayOfWeek}
                    className="p-3.5 bg-[#18181b] border border-[#27272a] rounded-xl flex items-center justify-between text-sm"
                  >
                    <span className="font-semibold text-zinc-300 w-32">
                      {DAYS_OF_WEEK[wh.dayOfWeek]}
                    </span>

                    {wh.isOff ? (
                      <span className="text-xs text-red-400 bg-red-950/30 border border-red-900/50 px-3 py-1 rounded-lg">
                        Выходной
                      </span>
                    ) : (
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1.5 text-zinc-200">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          <span>{wh.startTime} - {wh.endTime}</span>
                        </div>
                        {wh.breakStart && (
                          <span className="text-xs text-zinc-500 bg-zinc-800 px-2.5 py-1 rounded-md">
                            Обед: {wh.breakStart} - {wh.breakEnd}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-zinc-500 text-sm">
              Выберите мастера слева для просмотра подробного графика
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
