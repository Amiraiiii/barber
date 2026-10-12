"use client";

import React, { useState, useEffect } from "react";
import { Scissors, Plus, Edit2, Trash2, CheckCircle, XCircle, X } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const getHeaders = (): Record<string, string> => {
  const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
};

export default function AdminServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 50,
    durationMin: 45,
    isActive: true,
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/services`, {
        credentials: "include",
        headers: getHeaders(),
      });
      const json = await res.json();
      if (json.data) setServices(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingService(null);
    setFormData({ name: "", description: "", price: 50, durationMin: 45, isActive: true });
    setIsModalOpen(true);
  };

  const openEditModal = (service: any) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || "",
      price: service.price,
      durationMin: service.durationMin,
      isActive: service.isActive !== false,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingService
        ? `${API_BASE}/api/v1/admin/services/${editingService.id}`
        : `${API_BASE}/api/v1/admin/services`;
      const method = editingService ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...getHeaders() },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchServices();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Удалить эту услугу?")) return;
    try {
      await fetch(`${API_BASE}/api/v1/admin/services/${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: getHeaders(),
      });
      fetchServices();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-serif">Услуги и прайс-лист</h1>
          <p className="text-sm text-zinc-400 mt-1">Управление каталогом услуг, ценами и продолжительностью</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-xl text-sm transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Добавить услугу</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-12 text-zinc-500 text-sm">Загрузка услуг...</div>
        ) : (
          services.map((s) => (
            <div key={s.id} className="bg-[#121215] border border-[#27272a] rounded-2xl p-6 relative flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Scissors className="w-5 h-5" />
                  </div>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      s.isActive !== false
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-zinc-800 text-zinc-500"
                    }`}
                  >
                    {s.isActive !== false ? "Активна" : "Неактивна"}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white font-serif">{s.name}</h3>
                <p className="text-xs text-zinc-400 mt-2 line-clamp-2">{s.description}</p>

                <div className="flex items-center space-x-4 mt-6 pt-4 border-t border-[#27272a]">
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Стоимость</span>
                    <span className="text-xl font-bold text-white">${s.price}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Длительность</span>
                    <span className="text-sm font-semibold text-zinc-300">{s.durationMin} мин</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 mt-6 pt-4 border-t border-[#27272a]">
                <button
                  onClick={() => openEditModal(s)}
                  className="p-2 text-zinc-400 hover:text-white hover:bg-[#18181b] rounded-lg transition"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(s.id)}
                  className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Service Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#121215] border border-[#27272a] rounded-2xl w-full max-w-lg p-6 relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute right-4 top-4 text-zinc-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-white font-serif mb-4">
              {editingService ? "Редактировать услугу" : "Добавить новую услугу"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">Название услуги</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Royal Hot Towel Shave"
                  className="w-full bg-[#18181b] border border-[#3f3f46] rounded-xl p-3 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">Описание</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Подробности процедуры..."
                  className="w-full bg-[#18181b] border border-[#3f3f46] rounded-xl p-3 text-sm text-white focus:outline-none focus:border-amber-400 h-24"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">Цена ($)</label>
                  <input
                    type="number"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full bg-[#18181b] border border-[#3f3f46] rounded-xl p-3 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">Длительность (мин)</label>
                  <input
                    type="number"
                    required
                    value={formData.durationMin}
                    onChange={(e) => setFormData({ ...formData, durationMin: Number(e.target.value) })}
                    className="w-full bg-[#18181b] border border-[#3f3f46] rounded-xl p-3 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-xl text-sm transition mt-4 cursor-pointer"
              >
                Сохранить
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
