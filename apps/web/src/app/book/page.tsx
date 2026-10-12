"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import styles from "./book.module.css";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: string;
}

interface Barber {
  id: string;
  name: string;
  role: string;
  experience: string;
}

const SERVICES: Service[] = [
  {
    id: "haircut",
    name: "Signature Haircut",
    description: "Precision cut, razor line-up, wash, scalp massage & hot towel finish.",
    price: 65,
    duration: "45 min",
  },
  {
    id: "beard",
    name: "Beard Sculpting",
    description: "Razor edge line-up, precise trim, hot oil treatment & beard balm finish.",
    price: 45,
    duration: "30 min",
  },
  {
    id: "executive",
    name: "The Executive Package",
    description: "Signature haircut + Beard sculpt + luxury scalp & shoulder relaxation.",
    price: 100,
    duration: "75 min",
  },
  {
    id: "shave",
    name: "Royal Hot Towel Shave",
    description: "Traditional straight-razor shave with warm pre-shave oil & cold compress.",
    price: 55,
    duration: "45 min",
  },
  {
    id: "buzz",
    name: "Buzz Cut & Line-Up",
    description: "Clipper fade/buzz cut with razor neck cleanup & cold towel refresh.",
    price: 40,
    duration: "30 min",
  },
];

const BARBERS: Barber[] = [
  {
    id: "any",
    name: "Any Available Master",
    role: "First available slot",
    experience: "Recommended for faster booking",
  },
  {
    id: "vance",
    name: "Alexander Vance",
    role: "Senior Master Barber",
    experience: "12 yrs experience • Fades & Classic Taper",
  },
  {
    id: "cole",
    name: "Dmitri Cole",
    role: "Master Craftsman",
    experience: "9 yrs experience • Razor Work & Beard Sculpting",
  },
  {
    id: "mercer",
    name: "Julian Mercer",
    role: "Senior Stylist",
    experience: "7 yrs experience • Modern Textured Cuts",
  },
];

// Fallback slots shown while loading
const DEFAULT_SLOTS = ["10:00", "11:00", "12:00", "14:00", "15:00", "16:30", "18:00", "19:30"];

interface SlotStatus {
  time: string;
  endTime: string;
  available: boolean;
  reason?: string;
}

const fallbackSlots = (): SlotStatus[] =>
  DEFAULT_SLOTS.map((t) => ({ time: t, endTime: t, available: t !== "14:00", reason: t === "14:00" ? "Lunch Break" : undefined }));

export default function BookPage() {
  const [step, setStep] = useState<number>(1);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>("haircut");
  const [selectedBarberId, setSelectedBarberId] = useState<string | null>("any");
  
  // Generate next 7 available dates
  const dates = useMemo(() => {
    const list = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      list.push({
        iso: d.toISOString().split("T")[0],
        day: d.toLocaleDateString("en-US", { weekday: "short" }),
        num: d.getDate(),
        month: d.toLocaleDateString("en-US", { month: "short" }),
      });
    }
    return list;
  }, []);

  const [selectedDate, setSelectedDate] = useState<string>(dates[0]?.iso || "");
  const [selectedTime, setSelectedTime] = useState<string | null>("14:00");

  const [clientInfo, setClientInfo] = useState({
    name: "",
    phone: "",
    email: "",
    notes: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingRef, setBookingRef] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Slots fetched from API
  const [slots, setSlots] = useState<SlotStatus[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const selectedService = SERVICES.find((s) => s.id === selectedServiceId);
  const selectedBarber = BARBERS.find((b) => b.id === selectedBarberId);

  // Fetch availability whenever date or barber changes (step 3)
  const fetchSlots = useCallback(async () => {
    if (!selectedDate || !selectedServiceId) return;
    setSlotsLoading(true);
    try {
      const params = new URLSearchParams({
        date: selectedDate,
        barberId: selectedBarberId || "any",
        serviceId: selectedServiceId,
      });
      const res = await fetch(`${API_BASE}/api/v1/availability?${params}`);
      if (res.ok) {
        const json = await res.json();
        setSlots(json.data.slots);
      } else {
        // Fallback to default slots if API unavailable
        setSlots(DEFAULT_SLOTS.map((t) => ({ time: t, endTime: t, available: t !== "14:00" })));
      }
    } catch {
      setSlots(DEFAULT_SLOTS.map((t) => ({ time: t, endTime: t, available: t !== "14:00" })));
    } finally {
      setSlotsLoading(false);
    }
  }, [selectedDate, selectedBarberId, selectedServiceId]);

  useEffect(() => {
    if (step === 3) fetchSlots();
  }, [step, fetchSlots]);

  // Re-fetch when date changes on step 3
  useEffect(() => {
    if (step === 3) {
      setSelectedTime(null); // reset time when date changes
      fetchSlots();
    }
  }, [selectedDate]);

  const handleNext = async () => {
    if (step < 4) {
      setShowErrors(false);
      setSubmitError(null);
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (step === 4) {
      if (!isStep4Valid) {
        setShowErrors(true);
        return;
      }
      setShowErrors(false);
      setSubmitError(null);
      setIsSubmitting(true);
      try {
        const res = await fetch(`${API_BASE}/api/v1/bookings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            serviceId: selectedServiceId,
            barberId: selectedBarberId || "any",
            date: selectedDate,
            startTime: selectedTime,
            clientName: clientInfo.name,
            clientPhone: clientInfo.phone,
            clientEmail: clientInfo.email || undefined,
            notes: clientInfo.notes || undefined,
          }),
        });

        if (res.status === 409) {
          setSubmitError("This slot was just taken. Please go back and choose another time.");
          setIsSubmitting(false);
          return;
        }

        if (!res.ok) {
          setSubmitError("Something went wrong. Please try again.");
          setIsSubmitting(false);
          return;
        }

        const json = await res.json();
        const ref = json.data?.token || "BLK-" + Math.floor(10000 + Math.random() * 90000);
        setBookingRef(ref);
        setStep(5);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch {
        setSubmitError("Could not reach the server. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleBack = () => {
    if (step > 1 && step < 5) {
      setStep(step - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const isStep1Valid = !!selectedServiceId;
  const isStep2Valid = !!selectedBarberId;
  const isStep3Valid = !!selectedDate && !!selectedTime;
  const isStep4Valid = clientInfo.name.trim().length >= 2 && clientInfo.phone.trim().length >= 7;

  const canProceed =
    (step === 1 && isStep1Valid) ||
    (step === 2 && isStep2Valid) ||
    (step === 3 && isStep3Valid) ||
    (step === 4 && isStep4Valid);

  return (
    <div className={styles.page}>
      {/* Sticky Header */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <a href="/" className={styles.backLink}>
            ← Back to Home
          </a>
          <a href="/" className={styles.wordmark}>
            BLACKLINE
          </a>
          <div className={styles.stepIndicator} aria-label={`Step ${step} of 4`}>
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`${styles.stepDot} ${
                  i === step ? styles.stepDotActive : i < step ? styles.stepDotCompleted : ""
                }`}
              />
            ))}
          </div>
        </div>
      </header>

      {/* Main Booking Content */}
      <main className={styles.main}>
        {step < 5 ? (
          <div className={styles.layout}>
            {/* Step Views */}
            <div className={styles.stepContainer}>
              {/* STEP 1: Select Service */}
              {step === 1 && (
                <section aria-labelledby="step1-title">
                  <div className={styles.stepTitleGroup}>
                    <p className={styles.stepNumber}>Step 01 / 04</p>
                    <h1 className={styles.stepTitle} id="step1-title">
                      Select Service
                    </h1>
                    <p className={styles.stepSubtitle}>
                      Choose your treatment from our signature editorial menu.
                    </p>
                  </div>

                  <div className={styles.servicesGrid} role="radiogroup" aria-label="Select Service">
                    {SERVICES.map((serv) => {
                      const isSelected = selectedServiceId === serv.id;
                      return (
                        <div
                          key={serv.id}
                          className={`${styles.serviceCard} ${
                            isSelected ? styles.serviceCardSelected : ""
                          }`}
                          onClick={() => setSelectedServiceId(serv.id)}
                          role="radio"
                          aria-checked={isSelected}
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") setSelectedServiceId(serv.id);
                          }}
                        >
                          <div className={styles.serviceInfo}>
                            <h3 className={styles.serviceName}>{serv.name}</h3>
                            <p className={styles.serviceDesc}>{serv.description}</p>
                          </div>
                          <div className={styles.serviceMeta}>
                            <span className={styles.servicePrice}>${serv.price}</span>
                            <span className={styles.serviceDuration}>{serv.duration}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* STEP 2: Select Barber */}
              {step === 2 && (
                <section aria-labelledby="step2-title">
                  <div className={styles.stepTitleGroup}>
                    <p className={styles.stepNumber}>Step 02 / 04</p>
                    <h1 className={styles.stepTitle} id="step2-title">
                      Select Master
                    </h1>
                    <p className={styles.stepSubtitle}>
                      Choose your preferred barber or select first available.
                    </p>
                  </div>

                  <div className={styles.barbersGrid} role="radiogroup" aria-label="Select Barber">
                    {BARBERS.map((barber) => {
                      const isSelected = selectedBarberId === barber.id;
                      return (
                        <div
                          key={barber.id}
                          className={`${styles.barberCard} ${
                            isSelected ? styles.barberCardSelected : ""
                          }`}
                          onClick={() => setSelectedBarberId(barber.id)}
                          role="radio"
                          aria-checked={isSelected}
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") setSelectedBarberId(barber.id);
                          }}
                        >
                          <div className={styles.barberAvatar}>
                            {barber.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </div>
                          <h3 className={styles.barberName}>{barber.name}</h3>
                          <p className={styles.barberRole}>{barber.role}</p>
                          <p className={styles.barberExp}>{barber.experience}</p>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* STEP 3: Select Date & Time */}
              {step === 3 && (
                <section aria-labelledby="step3-title">
                  <div className={styles.stepTitleGroup}>
                    <p className={styles.stepNumber}>Step 03 / 04</p>
                    <h1 className={styles.stepTitle} id="step3-title">
                      Date & Time
                    </h1>
                    <p className={styles.stepSubtitle}>
                      Select your preferred appointment date and time slot.
                    </p>
                  </div>

                  <div className={styles.dateTimeWrap}>
                    <div>
                      <p className={styles.timeSectionTitle}>Select Date</p>
                      <div className={styles.dateRibbon} role="radiogroup" aria-label="Select Date">
                        {dates.map((d) => {
                          const isSelected = selectedDate === d.iso;
                          return (
                            <div
                              key={d.iso}
                              className={`${styles.dateCard} ${
                                isSelected ? styles.dateCardSelected : ""
                              }`}
                              onClick={() => setSelectedDate(d.iso)}
                              role="radio"
                              aria-checked={isSelected}
                              tabIndex={0}
                            >
                              <span className={styles.dateDay}>{d.day}</span>
                              <span className={styles.dateNum}>{d.num}</span>
                              <span className={styles.dateMonth}>{d.month}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <p className={styles.timeSectionTitle}>
                        Select Time Slot
                        {slotsLoading && <span className={styles.slotsLoading}> — loading...</span>}
                      </p>
                      <div className={styles.timeGrid} role="radiogroup" aria-label="Select Time">
                        {(slots.length > 0 ? slots : fallbackSlots()).map((slot) => {
                          const isSelected = selectedTime === slot.time;
                          const isBooked = !slot.available;
                          return (
                            <div
                              key={slot.time}
                              className={`${styles.timeSlot} ${
                                isBooked ? styles.timeSlotBooked : ""
                              } ${
                                isSelected && !isBooked ? styles.timeSlotSelected : ""
                              }`}
                              onClick={() => !isBooked && setSelectedTime(slot.time)}
                              role="radio"
                              aria-checked={isSelected}
                              aria-disabled={isBooked}
                              tabIndex={isBooked ? -1 : 0}
                              title={isBooked ? (slot.reason || "Already booked") : undefined}
                            >
                              <span>{slot.time}</span>
                              {isBooked && <span className={styles.bookedLabel}>{slot.reason || "Booked"}</span>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* STEP 4: Client Info */}
              {step === 4 && (
                <section aria-labelledby="step4-title">
                  <div className={styles.stepTitleGroup}>
                    <p className={styles.stepNumber}>Step 04 / 04</p>
                    <h1 className={styles.stepTitle} id="step4-title">
                      Your Details
                    </h1>
                    <p className={styles.stepSubtitle}>
                      Enter your contact information to finalize the reservation.
                    </p>
                  </div>

                  <form
                    className={styles.formGrid}
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleNext();
                    }}
                  >
                    <div className={styles.formGroup}>
                      <label className={styles.label} htmlFor="name">
                        Full Name *
                      </label>
                      <input
                        id="name"
                        type="text"
                        required
                        className={`${styles.input} ${
                          showErrors && clientInfo.name.trim().length < 2 ? styles.inputError : ""
                        }`}
                        placeholder="e.g. Julian Hayes"
                        value={clientInfo.name}
                        onChange={(e) => {
                          setClientInfo({ ...clientInfo, name: e.target.value });
                          if (showErrors) setShowErrors(false);
                        }}
                      />
                      {showErrors && clientInfo.name.trim().length < 2 && (
                        <span className={styles.fieldError}>Please enter your full name</span>
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label} htmlFor="phone">
                        Phone Number *
                      </label>
                      <input
                        id="phone"
                        type="tel"
                        required
                        className={`${styles.input} ${
                          showErrors && clientInfo.phone.trim().length < 7 ? styles.inputError : ""
                        }`}
                        placeholder="+1 (555) 000-0000"
                        value={clientInfo.phone}
                        onChange={(e) => {
                          setClientInfo({ ...clientInfo, phone: e.target.value });
                          if (showErrors) setShowErrors(false);
                        }}
                      />
                      {showErrors && clientInfo.phone.trim().length < 7 && (
                        <span className={styles.fieldError}>Please enter a valid phone number</span>
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label} htmlFor="email">
                        Email Address (Optional)
                      </label>
                      <input
                        id="email"
                        type="email"
                        className={styles.input}
                        placeholder="julian@example.com"
                        value={clientInfo.email}
                        onChange={(e) =>
                          setClientInfo({ ...clientInfo, email: e.target.value })
                        }
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label} htmlFor="notes">
                        Special Requests / Notes
                      </label>
                      <textarea
                        id="notes"
                        rows={3}
                        className={styles.textarea}
                        placeholder="Preferred styling products, hair concerns, etc."
                        value={clientInfo.notes}
                        onChange={(e) =>
                          setClientInfo({ ...clientInfo, notes: e.target.value })
                        }
                      />
                    </div>
                  </form>
                </section>
              )}
            </div>

            {/* Sidebar Summary */}
            <aside className={styles.summarySidebar} aria-label="Booking Summary">
              <h2 className={styles.summaryTitle}>Booking Summary</h2>

              <div className={styles.summaryList}>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Treatment</span>
                  <span className={styles.summaryValue}>
                    {selectedService ? selectedService.name : "Not selected"}
                  </span>
                </div>

                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Master Barber</span>
                  <span className={styles.summaryValue}>
                    {selectedBarber ? selectedBarber.name : "Not selected"}
                  </span>
                </div>

                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Date & Time</span>
                  <span className={styles.summaryValue}>
                    {selectedDate && selectedTime
                      ? `${selectedDate} @ ${selectedTime}`
                      : "Not selected"}
                  </span>
                </div>

                <div className={styles.summaryPriceRow}>
                  <span className={styles.summaryLabel}>Total</span>
                  <span className={styles.summaryTotalPrice}>
                    ${selectedService ? selectedService.price : 0}
                  </span>
                </div>
              </div>

              <div className={styles.actionRow}>
                {step > 1 && (
                  <button
                    type="button"
                    className={`btn-ghost ${styles.btnBack}`}
                    onClick={handleBack}
                  >
                    Back
                  </button>
                )}
                <div className={styles.btnGroup}>
                  <button
                    type="button"
                    className={`btn-primary ${styles.btnNext}`}
                    disabled={isSubmitting}
                    onClick={handleNext}
                  >
                    {isSubmitting
                      ? "Confirming..."
                      : step === 4
                      ? "Confirm Reservation"
                      : "Continue"}
                  </button>
                  {step === 4 && showErrors && (
                    <p className={styles.formHint}>
                      Please fill in the required fields above.
                    </p>
                  )}
                  {submitError && (
                    <p className={styles.formHint}>{submitError}</p>
                  )}
                </div>
              </div>
            </aside>
          </div>
        ) : (
          /* STEP 5: Confirmation Screen */
          <div className={styles.confirmationBox}>
            <div className={styles.confBadge}>✓</div>
            <h1 className={styles.confTitle}>Reservation Confirmed</h1>
            <p className={styles.confSub}>
              We look forward to welcoming you to BLACKLINE BARBERS.
            </p>

            <div className={styles.refBox}>
              <span className={styles.refLabel}>Booking Reference</span>
              <span className={styles.refCode}>{bookingRef}</span>
            </div>

            <div className={styles.confDetailsGrid}>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Client</span>
                <span className={styles.summaryValue}>{clientInfo.name}</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Phone</span>
                <span className={styles.summaryValue}>{clientInfo.phone}</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Service</span>
                <span className={styles.summaryValue}>{selectedService?.name}</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Master</span>
                <span className={styles.summaryValue}>{selectedBarber?.name}</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Date & Time</span>
                <span className={styles.summaryValue}>
                  {selectedDate} @ {selectedTime}
                </span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Price</span>
                <span className={styles.summaryValue}>${selectedService?.price}</span>
              </div>
            </div>

            <div className={styles.confActions}>
              <a href="/" className="btn-primary">
                Return to Home
              </a>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => {
                  setStep(1);
                  setBookingRef(null);
                  setSelectedServiceId("haircut");
                }}
              >
                Book Another Appointment
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
