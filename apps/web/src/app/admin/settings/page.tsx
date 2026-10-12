"use client";

import React, { useState, useEffect } from "react";
import { Settings, Save, CheckCircle } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const getHeaders = (): Record<string, string> => {
  const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({
    salonName: "BLACKLINE BARBERS",
    address: "ул. Центральная 10, Москва",
    phone: "+7 (495) 000-00-00",
    workingHours: "Пн-Сб 10:00 - 21:00, Вс — Выходной",
    cancelGracePeriodHours: "2",
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/settings`, {
        credentials: "include",
        headers: getHeaders(),
      });
      const json = await res.json();
      if (json.data) setSettings(json.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getHeaders() },
        credentials: "include",
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white font-serif">Настройки барбершопа</h1>
        <p className="text-sm text-zinc-400 mt-1">Редактирование контактной информации, адреса и правил отмены</p>
      </div>

      {saved && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-emerald-300 text-sm flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <span>Настройки успешно сохранены!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-[#121215] border border-[#27272a] rounded-2xl p-6 space-y-6">
        <div>
          <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">Название барбершопа</label>
          <input
            type="text"
            value={settings.salonName || ""}
            onChange={(e) => setSettings({ ...settings, salonName: e.target.value })}
            className="w-full bg-[#18181b] border border-[#3f3f46] rounded-xl p-3 text-sm text-white focus:outline-none focus:border-amber-400"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">Адрес</label>
            <input
              type="text"
              value={settings.address || ""}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              className="w-full bg-[#18181b] border border-[#3f3f46] rounded-xl p-3 text-sm text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">Телефон салона</label>
            <input
              type="text"
              value={settings.phone || ""}
              onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
              className="w-full bg-[#18181b] border border-[#3f3f46] rounded-xl p-3 text-sm text-white focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">Режим работы (для Telegram и сайта)</label>
          <input
            type="text"
            value={settings.workingHours || ""}
            onChange={(e) => setSettings({ ...settings, workingHours: e.target.value })}
            className="w-full bg-[#18181b] border border-[#3f3f46] rounded-xl p-3 text-sm text-white focus:outline-none focus:border-amber-400"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">Мин. время для бесплатной отмены (в часах)</label>
          <input
            type="number"
            value={settings.cancelGracePeriodHours || "2"}
            onChange={(e) => setSettings({ ...settings, cancelGracePeriodHours: e.target.value })}
            className="w-full bg-[#18181b] border border-[#3f3f46] rounded-xl p-3 text-sm text-white focus:outline-none focus:border-amber-400"
          />
        </div>

        <button
          type="submit"
          className="inline-flex items-center space-x-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-xl text-sm transition cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>Сохранить изменения</span>
        </button>
      </form>
    </div>
  );
}
