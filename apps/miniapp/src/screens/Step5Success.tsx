import { useBooking } from "../BookingContext";
import "./Step5Success.css";

interface Props {
  onGoToMyBookings: () => void;
}

export default function Step5Success({ onGoToMyBookings }: Props) {
  const { state, dispatch } = useBooking();

  return (
    <div className="screen success-screen">
      <div className="success-icon-wrap">
        <div className="success-ring">
          <span className="success-check">✓</span>
        </div>
      </div>

      <h1 className="success-title">RESERVATION CONFIRMED</h1>
      <p className="success-subtitle">We look forward to seeing you!</p>

      {state.confirmationToken && (
        <div className="token-card">
          <span className="token-label">BOOKING CODE</span>
          <span className="token-value">{state.confirmationToken}</span>
        </div>
      )}

      <div className="details-card">
        <div className="detail-row">
          <span>Service:</span>
          <strong>{state.service?.name}</strong>
        </div>
        <div className="detail-row">
          <span>Master:</span>
          <strong>{state.barber?.name || "Master Barber"}</strong>
        </div>
        <div className="detail-row">
          <span>Date & Time:</span>
          <strong>{state.date} at {state.time}</strong>
        </div>
        <div className="detail-row">
          <span>Client:</span>
          <strong>{state.clientName} ({state.clientPhone})</strong>
        </div>
      </div>

      <div className="cta-bar double-cta">
        <button className="btn-secondary" onClick={onGoToMyBookings}>
          My Bookings
        </button>
        <button className="btn-primary" onClick={() => dispatch({ type: "RESET" })}>
          Book Another
        </button>
      </div>
    </div>
  );
}
