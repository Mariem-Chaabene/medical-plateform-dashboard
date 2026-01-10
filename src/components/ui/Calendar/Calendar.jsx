import React, { useEffect, useMemo, useState } from "react";

const monthNames = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];
const dayNames = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const viewLabels = {
  month: "Mois",
  week: "Semaine",
  day: "Jour",
};

function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function startOfWeek(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  return d;
}

function endOfWeek(date) {
  const d = startOfWeek(date);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

function isSameMonth(d, monthRef) {
  return (
    d.getFullYear() === monthRef.getFullYear() &&
    d.getMonth() === monthRef.getMonth()
  );
}

function ChevronLeft() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#111827"
      strokeWidth="2"
    >
      <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ChevronRight() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#111827"
      strokeWidth="2"
    >
      <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const iconBtnStyle = {
  border: "1px solid #e5e7eb",
  background: "#fff",
  cursor: "pointer",
  padding: 8,
  borderRadius: 10,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

export default function CalendarModal({
  isOpen,
  onClose,
  events = [],
  onEventClick,
}) {
  const today = new Date();
  const [viewMode, setViewMode] = useState("month"); // month | week | day
  const [currentDate, setCurrentDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState(today);

  // si on reçoit des events, positionner le calendrier sur le mois du 1er event
  useEffect(() => {
    const first = Array.isArray(events)
      ? events.find((e) => e?.startDate instanceof Date)
      : null;
    if (first?.startDate) {
      setCurrentDate(
        new Date(first.startDate.getFullYear(), first.startDate.getMonth(), 1)
      );
      setSelectedDate(new Date(first.startDate));
    }
  }, [events]);

  const timeSlots = useMemo(
    () =>
      Array.from(
        { length: 24 },
        (_, i) => `${i.toString().padStart(2, "0")}:00`
      ),
    []
  );

  const filteredEvents = useMemo(() => {
    const safe = Array.isArray(events) ? events : [];

    if (viewMode === "month") {
      return safe.filter(
        (e) =>
          e?.startDate instanceof Date && isSameMonth(e.startDate, currentDate)
      );
    }

    if (viewMode === "week") {
      const s = startOfWeek(currentDate);
      const e = endOfWeek(currentDate);
      return safe.filter(
        (ev) =>
          ev?.startDate instanceof Date &&
          ev.startDate >= s &&
          ev.startDate <= e
      );
    }

    // day
    return safe.filter(
      (ev) =>
        ev?.startDate instanceof Date && sameDay(ev.startDate, selectedDate)
    );
  }, [events, viewMode, currentDate, selectedDate]);

  function navigatePrev() {
    if (viewMode === "month") {
      setCurrentDate(
        new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
      );
      return;
    }
    if (viewMode === "week") {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 7);
      setCurrentDate(d);
      return;
    }
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d);
    setCurrentDate(new Date(d.getFullYear(), d.getMonth(), 1));
  }

  function navigateNext() {
    if (viewMode === "month") {
      setCurrentDate(
        new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
      );
      return;
    }
    if (viewMode === "week") {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 7);
      setCurrentDate(d);
      return;
    }
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d);
    setCurrentDate(new Date(d.getFullYear(), d.getMonth(), 1));
  }

  function getDaysInMonth(date) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  }
  function getFirstDayOfMonth(date) {
    const jsDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay(); // 0=Dim..6=Sam
    return jsDay === 0 ? 6 : jsDay - 1; // 0=Lun..6=Dim
  }

  function renderMonth() {
    const daysInMonth = getDaysInMonth(currentDate);
    const first = getFirstDayOfMonth(currentDate);
    const cells = [];

    for (let i = 0; i < first; i++) {
      cells.push(
        <div
          key={`e-${i}`}
          style={{
            background: "#f3f4f6",
            border: "1px solid #e5e7eb",
            minHeight: 110,
          }}
        />
      );
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const cellDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        d
      );
      const isToday = sameDay(cellDate, today);
      const evs = filteredEvents.filter(
        (ev) => ev?.startDate instanceof Date && sameDay(ev.startDate, cellDate)
      );

      cells.push(
        <div
          key={d}
          onClick={() => {
            setSelectedDate(cellDate);
            setViewMode("day");
          }}
          style={{
            border: "1px solid #e5e7eb",
            padding: 8,
            background: isToday ? "#eff6ff" : "#fff",
            cursor: "pointer",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: 999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 12,
              background: isToday ? "#3b82f6" : "transparent",
              color: isToday ? "#fff" : "#111827",
              marginBottom: 6,
            }}
          >
            {d}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {evs.slice(0, 3).map((ev) => (
              <div
                key={ev.id}
                title={ev.title}
                onClick={(e) => {
                  e.stopPropagation();
                  onEventClick?.(ev);
                }}
                style={{
                  background: ev.color || "#e5e7eb",
                  color: ev.textColor || "#111827",
                  borderLeft: `3px solid ${ev.borderColor || "#d1d5db"}`,
                  padding: "3px 6px",
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {ev.startTime ? `${ev.startTime} ` : ""}
                {ev.title}
              </div>
            ))}
            {evs.length > 3 && (
              <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 700 }}>
                +{evs.length - 3} more
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            background: "#f9fafb",
            borderBottom: "1px solid #e5e7eb",
            flexShrink: 0,
          }}
        >
          {dayNames.map((n) => (
            <div
              key={n}
              style={{
                padding: 10,
                textAlign: "center",
                fontWeight: 800,
                color: "#374151",
              }}
            >
              {n}
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
          {cells}
        </div>
      </>
    );
  }

  function renderDayOrWeek(mode) {
    const hourHeight = 40;

    const weekDays =
      mode === "week"
        ? Array.from({ length: 7 }, (_, i) => {
            const s = startOfWeek(currentDate);
            const d = new Date(s);
            d.setDate(s.getDate() + i);
            return d;
          })
        : [selectedDate];

    const eventsByDay = weekDays.map((day) =>
      filteredEvents.filter(
        (ev) => ev?.startDate instanceof Date && sameDay(ev.startDate, day)
      )
    );

    return (
      <div
        style={{
          display: "flex",
          height: 640,
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: 70,
            borderRight: "1px solid #e5e7eb",
            background: "#fff",
          }}
        >
          <div style={{ height: 48, borderBottom: "1px solid #e5e7eb" }} />
          {timeSlots.map((t) => (
            <div
              key={t}
              style={{
                height: hourHeight,
                borderBottom: "1px solid #f1f5f9",
                padding: "6px 8px",
                fontSize: 11,
                color: "#6b7280",
                textAlign: "right",
              }}
            >
              {t}
            </div>
          ))}
        </div>

        <div
          style={{
            flex: 1,
            display: "grid",
            gridTemplateColumns: `repeat(${weekDays.length}, 1fr)`,
            overflow: "auto",
            background: "#fff",
          }}
        >
          {weekDays.map((day, idx) => (
            <div
              key={idx}
              style={{
                borderRight:
                  idx < weekDays.length - 1 ? "1px solid #e5e7eb" : "none",
              }}
            >
              <div
                style={{
                  height: 48,
                  borderBottom: "1px solid #e5e7eb",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#fff",
                }}
              >
                {mode === "week" && (
                  <div
                    style={{ fontSize: 11, color: "#6b7280", fontWeight: 700 }}
                  >
                    {dayNames[day.getDay()]}
                  </div>
                )}
                <div
                  style={{ fontSize: 13, fontWeight: 900, color: "#111827" }}
                >
                  {day.getDate()}/{String(day.getMonth() + 1).padStart(2, "0")}
                </div>
              </div>

              <div
                style={{
                  position: "relative",
                  height: timeSlots.length * hourHeight,
                }}
              >
                {timeSlots.map((t) => (
                  <div
                    key={t}
                    style={{
                      height: hourHeight,
                      borderBottom: "1px solid #f1f5f9",
                    }}
                  />
                ))}

                {eventsByDay[idx].map((ev) => {
                  const [sh, sm] = (ev.startTime || "00:00")
                    .split(":")
                    .map(Number);
                  const [eh, em] = (ev.endTime || ev.startTime || "00:30")
                    .split(":")
                    .map(Number);

                  const startMin = sh * 60 + sm;
                  const endMin = Math.max(eh * 60 + em, startMin + 15);
                  const top = (startMin / 60) * hourHeight;
                  const h = ((endMin - startMin) / 60) * hourHeight;

                  return (
                    <div
                      key={ev.id}
                      onClick={() => onEventClick?.(ev)}
                      style={{
                        position: "absolute",
                        left: 6,
                        right: 6,
                        top,
                        height: h,
                        background: ev.color || "#e5e7eb",
                        color: ev.textColor || "#111827",
                        borderLeft: `3px solid ${ev.borderColor || "#d1d5db"}`,
                        borderRadius: 6,
                        padding: "6px 8px",
                        fontSize: 12,
                        fontWeight: 800,
                        overflow: "hidden",
                        cursor: "pointer",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
                      }}
                      title={ev.title}
                    >
                      <div style={{ fontSize: 12 }}>{ev.title}</div>
                      <div style={{ fontSize: 11, opacity: 0.8, marginTop: 4 }}>
                        {ev.startTime} - {ev.endTime}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!isOpen) return null;

  return (
    <div
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.35)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 18,
      }}
    >
      <div
        style={{
          width: "min(1100px, 96vw)",
          height: "min(820px, 92vh)",
          background: "#fff",
          borderRadius: 14,
          boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: 16,
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexShrink: 0,
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 900, color: "#111827" }}>
            {viewMode === "month" &&
              `${
                monthNames[currentDate.getMonth()]
              } ${currentDate.getFullYear()}`}
            {viewMode === "week" &&
              `Semaine: ${startOfWeek(currentDate).toLocaleDateString(
                "fr-FR"
              )} - ${endOfWeek(currentDate).toLocaleDateString("fr-FR")}`}
            {viewMode === "day" &&
              `${selectedDate.toLocaleDateString("fr-FR")}`}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                display: "flex",
                background: "#f3f4f6",
                borderRadius: 10,
                padding: 3,
              }}
            >
              {["month", "week", "day"].map((m) => (
                <button
                  key={m}
                  onClick={() => setViewMode(m)}
                  style={{
                    border: "none",
                    cursor: "pointer",
                    padding: "8px 12px",
                    borderRadius: 8,
                    fontWeight: 800,
                    fontSize: 13,
                    background: viewMode === m ? "#3b82f6" : "transparent",
                    color: viewMode === m ? "#fff" : "#374151",
                  }}
                >
                  {viewLabels[m]}{" "}
                </button>
              ))}
            </div>

            <button onClick={navigatePrev} style={iconBtnStyle} title="Prev">
              <ChevronLeft />
            </button>
            <button onClick={navigateNext} style={iconBtnStyle} title="Next">
              <ChevronRight />
            </button>

            <button
              onClick={onClose}
              style={{ ...iconBtnStyle, padding: "8px 12px", fontWeight: 900 }}
            >
              ✕
            </button>
          </div>
        </div>

        <div style={{ padding: 12, overflow: "auto", flex: "1 1 auto" }}>
          {viewMode === "month" && renderMonth()}
          {viewMode === "week" && renderDayOrWeek("week")}
          {viewMode === "day" && renderDayOrWeek("day")}
        </div>

        <div
          style={{
            borderTop: "1px solid #e5e7eb",
            padding: "10px 16px",
            background: "#f9fafb",
            fontSize: 13,
            color: "#374151",
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {filteredEvents.length} rendez-vous affiché(s)
        </div>
      </div>
    </div>
  );
}
