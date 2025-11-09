import React from "react";

export default function Pagination({
  page = 1,
  pageCount = 2,
  perPage = 10,
  perPageOptions = [10, 20, 50],
  onPageChange,
  onPerPageChange
}) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "22px",
      background: "#fff",
      borderRadius: "18px",
      boxShadow: "0 2px 12px #e6eaf833",
      marginTop: "18px"
    }}>
      {/* Left: Pages */}
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <button
          disabled={page === 1}
          style={{
            opacity: page === 1 ? 0.45 : 1,
            border: "none",
            background: "none",
            fontSize: 22,
            cursor: "pointer",
            color: "#c4c4c4"
          }}
          onClick={() => onPageChange && onPageChange(page - 1)}
        >&#60;</button>
        {Array.from({ length: pageCount }, (_, idx) => (
          <span
            key={idx + 1}
            style={{
              fontWeight: page === idx + 1 ? 700 : 400,
              color: page === idx + 1 ? "#48c6ef" : "#535454",
              fontSize: 17,
              margin: "0 7px",
              borderBottom: page === idx + 1 ? "2px solid #48c6ef" : "none",
              cursor: "pointer"
            }}
            onClick={() => onPageChange && onPageChange(idx + 1)}
          >
            {idx + 1}
          </span>
        ))}
        <button
          disabled={page === pageCount}
          style={{
            opacity: page === pageCount ? 0.45 : 1,
            border: "none",
            background: "none",
            fontSize: 22,
            cursor: "pointer",
            color: "#c4c4c4"
          }}
          onClick={() => onPageChange && onPageChange(page + 1)}
        >&#62;</button>
      </div>
      {/* Right: Per page */}
      <div style={{
        background: "#f6f7fa",
        borderRadius: 11,
        padding: "8px 18px",
        fontSize: 16,
        color: "#222"
      }}>
        <select
          value={perPage}
          onChange={e => onPerPageChange && onPerPageChange(Number(e.target.value))}
          style={{
            border: "none",
            background: "none",
            fontWeight: 600,
            color: "#222",
            fontSize: 15
          }}
        >
          {perPageOptions.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <span style={{ color: "#888", marginLeft: 4 }}>/ page</span>
      </div>
    </div>
  );
}
