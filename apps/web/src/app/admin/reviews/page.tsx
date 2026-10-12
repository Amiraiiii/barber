"use client";

import React, { useState, useEffect } from "react";
import { Star, MessageSquare, User, Scissors } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const getHeaders = (): Record<string, string> => {
  const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
};

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/reviews`, {
        credentials: "include",
        headers: getHeaders(),
      });
      const json = await res.json();
      if (json.data) setReviews(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white font-serif">Отзывы клиентов</h1>
        <p className="text-sm text-zinc-400 mt-1">Оценки и отзывы, полученные через Telegram-бота и сайт</p>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 text-zinc-500 text-sm">Загрузка отзывов...</div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 text-sm">Отзывов пока нет</div>
        ) : (
          reviews.map((rev) => (
            <div key={rev.id} className="bg-[#121215] border border-[#27272a] rounded-2xl p-6 relative">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                    {rev.clientName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">{rev.clientName}</h3>
                    <p className="text-xs text-zinc-400">Мастер: <span className="text-zinc-200">{rev.barberName}</span></p>
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < rev.rating ? "text-amber-400 fill-amber-400" : "text-zinc-700"
                      }`}
                    />
                  ))}
                  <span className="text-sm font-bold text-white ml-2">{rev.rating}.0</span>
                </div>
              </div>

              <p className="text-sm text-zinc-300 bg-[#18181b] p-4 rounded-xl border border-[#27272a]">
                "{rev.comment}"
              </p>

              <div className="text-right mt-3 text-[11px] text-zinc-500">
                {new Date(rev.createdAt).toLocaleDateString("ru-RU")}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
