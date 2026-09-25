import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleClearSession = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // ignore
    }
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#0b1329",
            color: "#ffffff",
            padding: "24px",
            fontFamily: "Inter, system-ui, -apple-system, sans-serif",
          }}
        >
          <div
            style={{
              maxWidth: "600px",
              width: "100%",
              background: "rgba(15, 23, 42, 0.95)",
              border: "1px solid rgba(148, 163, 184, 0.2)",
              borderRadius: "16px",
              padding: "36px",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.5)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                background: "rgba(239, 68, 68, 0.15)",
                color: "#ef4444",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "28px",
                marginBottom: "20px",
              }}
            >
              ⚠️
            </div>

            <h1 style={{ fontSize: "24px", marginBottom: "12px", fontWeight: 700 }}>
              Something went wrong
            </h1>

            <p style={{ color: "#94a3b8", fontSize: "14px", marginBottom: "20px" }}>
              An unexpected error occurred while rendering this page.
            </p>

            {this.state.error && (
              <div
                style={{
                  background: "#020617",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  borderRadius: "8px",
                  padding: "12px 16px",
                  textAlign: "left",
                  fontSize: "13px",
                  color: "#fca5a5",
                  fontFamily: "monospace",
                  overflowX: "auto",
                  marginBottom: "24px",
                  maxHeight: "160px",
                }}
              >
                {this.state.error.toString()}
              </div>
            )}

            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={this.handleReset}
                style={{
                  padding: "10px 20px",
                  borderRadius: "8px",
                  border: "none",
                  background: "linear-gradient(135deg, #2563eb, #4f46e5)",
                  color: "#ffffff",
                  fontWeight: 600,
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                Reload Page
              </button>

              <button
                type="button"
                onClick={this.handleClearSession}
                style={{
                  padding: "10px 20px",
                  borderRadius: "8px",
                  border: "1px solid rgba(148, 163, 184, 0.3)",
                  background: "transparent",
                  color: "#cbd5e1",
                  fontWeight: 600,
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                Clear Cache & Restart
              </button>

              <a
                href="/"
                style={{
                  padding: "10px 20px",
                  borderRadius: "8px",
                  border: "1px solid rgba(148, 163, 184, 0.3)",
                  background: "transparent",
                  color: "#cbd5e1",
                  fontWeight: 600,
                  fontSize: "14px",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                }}
              >
                Go to Home
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
