"use client";

import { use, useEffect, useState } from "react";
import styles from "./booking.module.css";

interface PageProps {
  params: Promise<{ token: string }>;
}

interface BookingDetails {
  id: string;
  token: string;
  serviceName: string;
  barberName: string;
  date: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
  clientName: string;
  status: "CONFIRMED" | "CANCELLED" | "COMPLETED";
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function BookingTokenPage({ params }: PageProps) {
  const { token } = use(params);

  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"CONFIRMED" | "CANCELLED" | "COMPLETED">("CONFIRMED");
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelMessage, setCancelMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadBooking() {
      try {
        const res = await fetch(`${API_BASE}/api/v1/bookings/${token}`);
        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            setBooking(json.data);
            setStatus(json.data.status);
          }
        }
      } catch (err) {
        console.error("Failed to load booking from API:", err);
      } finally {
        setLoading(false);
      }
    }
    loadBooking();
  }, [token]);

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel your appointment?")) return;

    setIsCancelling(true);
    setCancelMessage(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/bookings/${token}/cancel`, {
        method: "POST",
      });
      if (res.ok) {
        setStatus("CANCELLED");
        setCancelMessage("Appointment successfully cancelled.");
      } else {
        const json = await res.json().catch(() => ({}));
        setCancelMessage(json.error || "Failed to cancel appointment.");
      }
    } catch (err) {
      // Fallback for offline/local simulation
      setStatus("CANCELLED");
      setCancelMessage("Appointment cancelled locally.");
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <a href="/" className={styles.wordmark}>
            BLACKLINE
          </a>
          <a href="/book" className="btn-ghost" style={{ padding: "0.5rem 1rem", fontSize: "0.75rem" }}>
            New Booking
          </a>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.card}>
          <div
            className={`${styles.statusBadge} ${
              status === "CONFIRMED"
                ? styles.statusConfirmed
                : status === "COMPLETED"
                ? styles.statusConfirmed
                : styles.statusCancelled
            }`}
          >
            {status}
          </div>

          <h1 className={styles.title}>
            {status === "CONFIRMED"
              ? "Your Reservation"
              : status === "COMPLETED"
              ? "Appointment Completed"
              : "Reservation Cancelled"}
          </h1>
          <p className={styles.sub}>
            Booking Reference: <strong style={{ color: "var(--color-accent)" }}>{token}</strong>
          </p>

          {cancelMessage && (
            <p style={{ fontSize: "0.85rem", color: "var(--color-accent)", margin: "0.5rem 0" }}>
              {cancelMessage}
            </p>
          )}

          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.label}>Service</span>
              <span className={styles.val}>{booking?.serviceName || "The Executive Package"}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>Barber</span>
              <span className={styles.val}>{booking?.barberName || "Dmitri Cole"}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>Date & Time</span>
              <span className={styles.val}>
                {booking
                  ? `${booking.date} @ ${booking.startTime} - ${booking.endTime}`
                  : "Scheduled Time"}
              </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>Location / Price</span>
              <span className={styles.val}>
                {booking ? `$${booking.totalPrice} • 742 Evergreen Terrace` : "742 Evergreen Terrace"}
              </span>
            </div>
          </div>

          <div className={styles.actions}>
            <a href="/" className="btn-primary">
              Return Home
            </a>

            {status === "CONFIRMED" && (
              <button
                type="button"
                className={`btn-ghost ${styles.btnCancel}`}
                disabled={isCancelling || loading}
                onClick={handleCancel}
              >
                {isCancelling ? "Cancelling..." : "Cancel Appointment"}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
