import React, { createContext, useContext, useReducer } from "react";
import type { Service, Barber } from "./api";

// ── Booking State ──────────────────────────────────────────
export interface BookingState {
  step: number; // 1..5
  service: Service | null;
  barber: Barber | null;
  date: string;
  time: string | null;
  clientName: string;
  clientPhone: string;
  confirmationToken: string | null;
  error: string | null;
}

const initial: BookingState = {
  step: 1,
  service: null,
  barber: null,
  date: new Date().toISOString().split("T")[0],
  time: null,
  clientName: "",
  clientPhone: "",
  confirmationToken: null,
  error: null,
};

// ── Actions ───────────────────────────────────────────────
type Action =
  | { type: "SET_SERVICE"; service: Service }
  | { type: "SET_BARBER"; barber: Barber }
  | { type: "SET_DATE"; date: string }
  | { type: "SET_TIME"; time: string }
  | { type: "SET_CLIENT"; name: string; phone: string }
  | { type: "CONFIRM"; token: string }
  | { type: "SET_ERROR"; error: string | null }
  | { type: "NEXT" }
  | { type: "BACK" }
  | { type: "RESET" };

function reducer(state: BookingState, action: Action): BookingState {
  switch (action.type) {
    case "SET_SERVICE":
      return { ...state, service: action.service };
    case "SET_BARBER":
      return { ...state, barber: action.barber };
    case "SET_DATE":
      return { ...state, date: action.date, time: null };
    case "SET_TIME":
      return { ...state, time: action.time };
    case "SET_CLIENT":
      return { ...state, clientName: action.name, clientPhone: action.phone };
    case "CONFIRM":
      return { ...state, confirmationToken: action.token, step: 5 };
    case "SET_ERROR":
      return { ...state, error: action.error };
    case "NEXT":
      return { ...state, step: Math.min(state.step + 1, 5), error: null };
    case "BACK":
      return { ...state, step: Math.max(state.step - 1, 1), error: null };
    case "RESET":
      return { ...initial, date: new Date().toISOString().split("T")[0] };
    default:
      return state;
  }
}

// ── Context ───────────────────────────────────────────────
const Ctx = createContext<{
  state: BookingState;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial);
  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>;
}

export function useBooking() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useBooking must be inside BookingProvider");
  return ctx;
}
