import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "60vh",
            gap: 16,
            padding: 32,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "3rem" }}>⚠️</div>
          <h2 style={{ color: "var(--text)", fontWeight: 800 }}>
            Something went wrong
          </h2>
          <p style={{ color: "var(--overlay1)", maxWidth: 400 }}>
            {this.state.error?.message || "An unexpected error occurred."}
          </p>
          <button
            style={{
              padding: "10px 20px",
              background: "var(--mauve)",
              color: "var(--crust)",
              border: "none",
              borderRadius: "var(--radius)",
              cursor: "pointer",
              fontFamily: "Outfit, sans-serif",
              fontWeight: 600,
            }}
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.href = "/";
            }}
          >
            Go to Dashboard
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
