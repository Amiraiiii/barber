import { useEffect, useState } from "react";
import { fetchBarbers, type Barber } from "../api";
import { useBooking } from "../BookingContext";
import "./Step2Barbers.css";

const ANY_BARBER: Barber = {
  id: "any",
  name: "Any Available Master",
  roleTitle: "Fastest booking",
  avatarUrl: "",
};

export default function Step2Barbers() {
  const { state, dispatch } = useBooking();
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBarbers()
      .then((data) => setBarbers([ANY_BARBER, ...data]))
      .catch(() =>
        setBarbers([
          ANY_BARBER,
          { id: "alex", name: "Alex Vance", roleTitle: "Master Barber", avatarUrl: "/images/barbers/alex.jpg" },
          { id: "daniel", name: "Daniel Cross", roleTitle: "Beard Specialist", avatarUrl: "/images/barbers/daniel.jpg" },
          { id: "ryan", name: "Ryan Cole", roleTitle: "Senior Stylist", avatarUrl: "/images/barbers/ryan.jpg" },
        ])
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="screen">
      <div className="screen-header">
        <div className="logo">BLACKLINE</div>
        <p className="screen-subtitle">Choose your preferred master</p>
      </div>

      {loading ? (
        <div className="loader-wrap">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton" />
          ))}
        </div>
      ) : (
        <div className="barbers-grid">
          {barbers.map((b) => {
            const isSelected = state.barber?.id === b.id;
            const initials = b.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .substring(0, 2);

            return (
              <button
                key={b.id}
                className={`barber-card${isSelected ? " selected" : ""}`}
                onClick={() => dispatch({ type: "SET_BARBER", barber: b })}
              >
                <div className="barber-avatar">
                  {b.id === "any" ? (
                    <span className="avatar-icon">★</span>
                  ) : b.avatarUrl ? (
                    <img src={b.avatarUrl} alt={b.name} onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
                  ) : (
                    <span className="avatar-initials">{initials}</span>
                  )}
                </div>
                <div className="barber-info">
                  <span className="barber-name">{b.name}</span>
                  <span className="barber-role">{b.roleTitle}</span>
                </div>
                {isSelected && <div className="barber-check">✓</div>}
              </button>
            );
          })}
        </div>
      )}

      <div className="cta-bar">
        <button
          className="btn-primary"
          disabled={!state.barber}
          onClick={() => dispatch({ type: "NEXT" })}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
