import { useEffect, useState } from "react";
import { fetchServices, type Service } from "../api";
import { useBooking } from "../BookingContext";
import "./Step1Services.css";

export default function Step1Services() {
  const { state, dispatch } = useBooking();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServices()
      .then(setServices)
      .catch(() =>
        setServices([
          { id: "haircut", name: "Signature Haircut", description: "Precision cut + hot towel finish.", price: 65, durationMin: 45 },
          { id: "beard", name: "Beard Sculpting", description: "Razor edge line-up + beard balm.", price: 45, durationMin: 30 },
          { id: "executive", name: "The Executive Package", description: "Haircut + Beard + scalp relaxation.", price: 100, durationMin: 75 },
          { id: "shave", name: "Royal Hot Towel Shave", description: "Straight-razor shave + cold compress.", price: 55, durationMin: 45 },
          { id: "buzz", name: "Buzz Cut & Line-Up", description: "Clipper fade + neck cleanup.", price: 40, durationMin: 30 },
        ])
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="screen">
      <div className="screen-header">
        <div className="logo">BLACKLINE</div>
        <p className="screen-subtitle">Select a service to begin</p>
      </div>

      {loading ? (
        <div className="loader-wrap">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton" />)}
        </div>
      ) : (
        <div className="list">
          {services.map((s) => {
            const isSelected = state.service?.id === s.id;
            return (
              <button
                key={s.id}
                className={`service-card${isSelected ? " selected" : ""}`}
                onClick={() => dispatch({ type: "SET_SERVICE", service: s })}
              >
                <div className="service-info">
                  <span className="service-name">{s.name}</span>
                  <span className="service-desc">{s.description}</span>
                </div>
                <div className="service-meta">
                  <span className="service-price">${s.price}</span>
                  <span className="service-dur">{s.durationMin} min</span>
                </div>
                {isSelected && <div className="check">✓</div>}
              </button>
            );
          })}
        </div>
      )}

      <div className="cta-bar">
        <button
          className="btn-primary"
          disabled={!state.service}
          onClick={() => dispatch({ type: "NEXT" })}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
