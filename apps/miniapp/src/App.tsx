import { useEffect, useState } from "react";
import { BookingProvider, useBooking } from "./BookingContext";
import Step1Services from "./screens/Step1Services";
import Step2Barbers from "./screens/Step2Barbers";
import Step3DateTime from "./screens/Step3DateTime";
import Step4Confirm from "./screens/Step4Confirm";
import Step5Success from "./screens/Step5Success";
import MyBookings from "./screens/MyBookings";
import "./App.css";

function MiniAppRouter() {
  const { state, dispatch } = useBooking();
  const [view, setView] = useState<"booking" | "my_bookings">("booking");

  useEffect(() => {
    // Initialize Telegram WebApp SDK if present
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();

      // Back button integration
      if (view === "my_bookings" || state.step > 1) {
        tg.BackButton.show();
        tg.BackButton.onClick(() => {
          if (view === "my_bookings") {
            setView("booking");
          } else {
            dispatch({ type: "BACK" });
          }
        });
      } else {
        tg.BackButton.hide();
      }
    }
  }, [state.step, view, dispatch]);

  return (
    <div className="app-container">
      {/* Top Bar Navigation */}
      <header className="top-bar">
        <div className="top-bar-left">
          {(state.step > 1 || view === "my_bookings") && (
            <button
              className="back-btn"
              onClick={() => {
                if (view === "my_bookings") setView("booking");
                else dispatch({ type: "BACK" });
              }}
            >
              ← Back
            </button>
          )}
        </div>
        <div className="top-bar-right">
          <button
            className={`nav-tab${view === "my_bookings" ? " active" : ""}`}
            onClick={() => setView(view === "my_bookings" ? "booking" : "my_bookings")}
          >
            {view === "my_bookings" ? "Book Service" : "My Bookings"}
          </button>
        </div>
      </header>

      {/* Progress Dots when booking */}
      {view === "booking" && state.step < 5 && (
        <div className="stepper">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`step-dot${s === state.step ? " active" : ""}${s < state.step ? " done" : ""}`}
            />
          ))}
        </div>
      )}

      {/* Main View Router */}
      <main className="main-content">
        {view === "my_bookings" ? (
          <MyBookings onBackToBooking={() => setView("booking")} />
        ) : (
          <>
            {state.step === 1 && <Step1Services />}
            {state.step === 2 && <Step2Barbers />}
            {state.step === 3 && <Step3DateTime />}
            {state.step === 4 && <Step4Confirm />}
            {state.step === 5 && (
              <Step5Success onGoToMyBookings={() => setView("my_bookings")} />
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BookingProvider>
      <MiniAppRouter />
    </BookingProvider>
  );
}
