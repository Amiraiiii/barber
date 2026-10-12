import { useEffect, useState } from "react";
import { fetchSlots, type SlotStatus } from "../api";
import { useBooking } from "../BookingContext";
import "./Step3DateTime.css";

function generateNextDays(count = 7) {
  const days = [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const iso = d.toISOString().split("T")[0];
    const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
    const dayNum = d.getDate();
    const month = d.toLocaleDateString("en-US", { month: "short" });
    days.push({ iso, dayName, dayNum, month });
  }
  return days;
}

export default function Step3DateTime() {
  const { state, dispatch } = useBooking();
  const days = generateNextDays(7);

  const [slots, setSlots] = useState<SlotStatus[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!state.service) return;
    setLoading(true);
    const barberId = state.barber?.id === "any" || !state.barber ? "alex" : state.barber.id;

    fetchSlots(state.date, barberId, state.service.id)
      .then(setSlots)
      .catch(() => {
        // Fallback demo slots if offline
        setSlots([
          { time: "10:00", endTime: "10:45", available: true },
          { time: "11:00", endTime: "11:45", available: false, reason: "Booked" },
          { time: "12:00", endTime: "12:45", available: true },
          { time: "13:00", endTime: "13:45", available: true },
          { time: "14:00", endTime: "14:45", available: false, reason: "Booked" },
          { time: "15:00", endTime: "15:45", available: true },
          { time: "16:00", endTime: "16:45", available: true },
          { time: "17:00", endTime: "17:45", available: true },
          { time: "18:00", endTime: "18:45", available: true },
          { time: "19:00", endTime: "19:45", available: true },
        ]);
      })
      .finally(() => setLoading(false));
  }, [state.date, state.barber, state.service]);

  return (
    <div className="screen">
      <div className="screen-header">
        <div className="logo">BLACKLINE</div>
        <p className="screen-subtitle">Select date & available time</p>
      </div>

      {/* Date Ribbon */}
      <div className="date-ribbon">
        {days.map((d) => {
          const isSelected = state.date === d.iso;
          return (
            <button
              key={d.iso}
              className={`date-chip${isSelected ? " selected" : ""}`}
              onClick={() => dispatch({ type: "SET_DATE", date: d.iso })}
            >
              <span className="day-name">{d.dayName}</span>
              <span className="day-num">{d.dayNum}</span>
              <span className="day-month">{d.month}</span>
            </button>
          );
        })}
      </div>

      {/* Time Slots */}
      <div className="section-title">Available Slots</div>

      {loading ? (
        <div className="slots-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton slot-skeleton" />
          ))}
        </div>
      ) : slots.length === 0 ? (
        <div className="no-slots">No available slots for this date.</div>
      ) : (
        <div className="slots-grid">
          {slots.map((s) => {
            const isSelected = state.time === s.time;
            const isBooked = !s.available;

            return (
              <button
                key={s.time}
                disabled={isBooked}
                className={`slot-chip${isSelected ? " selected" : ""}${isBooked ? " booked" : ""}`}
                onClick={() => dispatch({ type: "SET_TIME", time: s.time })}
              >
                <span className="slot-time">{s.time}</span>
                {isBooked && <span className="booked-badge">BOOKED</span>}
              </button>
            );
          })}
        </div>
      )}

      <div className="cta-bar">
        <button
          className="btn-primary"
          disabled={!state.time}
          onClick={() => dispatch({ type: "NEXT" })}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
