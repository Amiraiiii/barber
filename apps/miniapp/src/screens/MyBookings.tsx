import { useEffect, useState } from "react";
import { API_BASE, cancelBooking, type Booking } from "../api";
import { useBooking } from "../BookingContext";
import "./MyBookings.css";

interface Props {
  onBackToBooking: () => void;
}

export default function MyBookings({ onBackToBooking }: Props) {
  const { dispatch } = useBooking();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingToken, setCancellingToken] = useState<string | null>(null);

  const loadBookings = async () => {
    setLoading(true);
    const tokens: string[] = JSON.parse(
      localStorage.getItem("blackline_bookings") || "[]"
    );

    if (tokens.length === 0) {
      setBookings([]);
      setLoading(false);
      return;
    }

    try {
      const results: Booking[] = [];
      for (const t of tokens) {
        try {
          const res = await fetch(`${API_BASE}/api/v1/bookings/${t}`);
          const json = await res.json();
          if (json.data) {
            results.push(json.data);
          }
        } catch {
          // Ignore individual fetch failure
        }
      }
      setBookings(results);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const handleCancel = async (token: string) => {
    setCancellingToken(token);
    try {
      await cancelBooking(token);
      await loadBookings();
    } finally {
      setCancellingToken(null);
    }
  };

  return (
    <div className="screen">
      <div className="screen-header">
        <div className="logo">BLACKLINE</div>
        <p className="screen-subtitle">Your Active Reservations</p>
      </div>

      {loading ? (
        <div className="loader-wrap">
          {[1, 2].map((i) => (
            <div key={i} className="skeleton" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="empty-bookings">
          <p>No active reservations found.</p>
          <button className="btn-secondary" onClick={onBackToBooking}>
            Book a Service Now
          </button>
        </div>
      ) : (
        <div className="bookings-list">
          {bookings.map((b) => {
            const isCancelled = b.status === "CANCELLED";
            return (
              <div key={b.id || b.token} className={`booking-card${isCancelled ? " cancelled" : ""}`}>
                <div className="card-top">
                  <span className="card-service">{b.serviceName}</span>
                  <span className={`status-pill ${b.status.toLowerCase()}`}>
                    {b.status}
                  </span>
                </div>

                <div className="card-body">
                  <div className="card-row">
                    <span className="label">Master:</span>
                    <span>{b.barberName}</span>
                  </div>
                  <div className="card-row">
                    <span className="label">Date:</span>
                    <span>{b.date}</span>
                  </div>
                  <div className="card-row">
                    <span className="label">Time:</span>
                    <span>{b.startTime} - {b.endTime}</span>
                  </div>
                  <div className="card-row">
                    <span className="label">Token:</span>
                    <span className="token-code">{b.token}</span>
                  </div>
                </div>

                {!isCancelled && (
                  <div className="card-actions">
                    <button
                      className="btn-cancel"
                      disabled={cancellingToken === b.token}
                      onClick={() => handleCancel(b.token)}
                    >
                      {cancellingToken === b.token ? "Cancelling..." : "Cancel Booking"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="cta-bar">
        <button
          className="btn-primary"
          onClick={() => {
            dispatch({ type: "RESET" });
            onBackToBooking();
          }}
        >
          + New Booking
        </button>
      </div>
    </div>
  );
}
