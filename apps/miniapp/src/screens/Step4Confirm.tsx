import { useEffect, useState } from "react";
import { createBooking } from "../api";
import { useBooking } from "../BookingContext";
import "./Step4Confirm.css";

export default function Step4Confirm() {
  const { state, dispatch } = useBooking();
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Auto pre-fill from Telegram WebApp SDK if available
  useEffect(() => {
    const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
    if (tgUser && !state.clientName) {
      const name = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" ");
      dispatch({
        type: "SET_CLIENT",
        name: name || state.clientName,
        phone: tgUser.phone_number || state.clientPhone,
      });
    }
  }, []);

  const handleConfirm = async () => {
    if (!state.clientName.trim() || !state.clientPhone.trim()) {
      setLocalError("Please fill in your name and phone number");
      return;
    }

    if (!state.service || !state.time) {
      setLocalError("Missing booking details");
      return;
    }

    setSubmitting(true);
    setLocalError(null);

    const barberId = state.barber?.id === "any" || !state.barber ? "alex" : state.barber.id;

    try {
      const res = await createBooking({
        serviceId: state.service.id,
        barberId,
        date: state.date,
        startTime: state.time,
        clientName: state.clientName.trim(),
        clientPhone: state.clientPhone.trim(),
      });

      if ("error" in res && res.error) {
        if (res.code === "SLOT_TAKEN") {
          setLocalError("⚠️ This time slot was just booked by someone else. Please go back and pick another time.");
        } else {
          setLocalError(res.error);
        }
        return;
      }

      if ("data" in res && res.data.token) {
        // Store in localStorage history
        const saved = JSON.parse(localStorage.getItem("blackline_bookings") || "[]");
        localStorage.setItem(
          "blackline_bookings",
          JSON.stringify([res.data.token, ...saved])
        );

        dispatch({ type: "CONFIRM", token: res.data.token });
      } else {
        setLocalError("Failed to process booking. Please try again.");
      }
    } catch {
      setLocalError("Network error. Please check your connection.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="screen">
      <div className="screen-header">
        <div className="logo">BLACKLINE</div>
        <p className="screen-subtitle">Review & Confirm Your Reservation</p>
      </div>

      {/* Summary Card */}
      <div className="summary-card">
        <div className="summary-item">
          <span className="label">Service</span>
          <span className="value">{state.service?.name}</span>
        </div>
        <div className="summary-item">
          <span className="label">Master</span>
          <span className="value">
            {state.barber?.name || "Any Available Master"}
          </span>
        </div>
        <div className="summary-item">
          <span className="label">Date & Time</span>
          <span className="value">
            {state.date} at {state.time}
          </span>
        </div>
        <div className="summary-item total">
          <span className="label">Total Price</span>
          <span className="value price">${state.service?.price}</span>
        </div>
      </div>

      {/* Client Contact Inputs */}
      <div className="form-group">
        <label className="input-label">Full Name</label>
        <input
          type="text"
          className="input-field"
          placeholder="e.g. Alexey Ivanov"
          value={state.clientName}
          onChange={(e) =>
            dispatch({
              type: "SET_CLIENT",
              name: e.target.value,
              phone: state.clientPhone,
            })
          }
        />
      </div>

      <div className="form-group">
        <label className="input-label">Phone Number</label>
        <input
          type="tel"
          className="input-field"
          placeholder="+7 (999) 000-00-00"
          value={state.clientPhone}
          onChange={(e) =>
            dispatch({
              type: "SET_CLIENT",
              name: state.clientName,
              phone: e.target.value,
            })
          }
        />
      </div>

      {localError && <div className="error-box">{localError}</div>}

      <div className="cta-bar">
        <button
          className="btn-primary"
          disabled={submitting || !state.clientName || !state.clientPhone}
          onClick={handleConfirm}
        >
          {submitting ? "Booking..." : "Confirm Reservation"}
        </button>
      </div>
    </div>
  );
}
