import React from "react";
import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "70vh",
        gap: 16,
        textAlign: "center",
        padding: 32,
      }}
    >
      <div style={{ fontSize: "5rem", lineHeight: 1 }}>404</div>
      <h2 style={{ color: "var(--text)", fontWeight: 800, fontSize: "1.5rem" }}>
        Page not found
      </h2>
      <p style={{ color: "var(--overlay1)" }}>
        This page doesn't exist or was moved.
      </p>
      <button className="btn btn-primary" onClick={() => navigate("/")}>
        Back to Dashboard
      </button>
    </div>
  );
}
