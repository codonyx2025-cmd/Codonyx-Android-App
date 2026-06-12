/**
 * Lightweight production error monitoring.
 * Captures unhandled errors and rejections, logs structured data.
 * Replace the reporter with Sentry/LogRocket when ready.
 */

interface ErrorReport {
  message: string;
  stack?: string;
  componentStack?: string;
  url: string;
  timestamp: number;
  userAgent: string;
}

const errorBuffer: ErrorReport[] = [];
const MAX_BUFFER = 50;

function createReport(error: Error | string, extra?: string): ErrorReport {
  const err = typeof error === "string" ? new Error(error) : error;
  return {
    message: err.message,
    stack: err.stack,
    componentStack: extra,
    url: window.location.href,
    timestamp: Date.now(),
    userAgent: navigator.userAgent,
  };
}

function reportError(error: Error | string, extra?: string) {
  const report = createReport(error, extra);
  
  if (errorBuffer.length < MAX_BUFFER) {
    errorBuffer.push(report);
  }

  // Log in development, silent in production
  if (import.meta.env.DEV) {
    console.error("[Monitor]", report);
  }

  // TODO: Replace with actual monitoring service (Sentry, LogRocket, etc.)
  // Example: Sentry.captureException(error);
}

export function initMonitoring() {
  // Global unhandled error handler
  window.addEventListener("error", (event) => {
    reportError(event.error || event.message);
  });

  // Unhandled promise rejections
  window.addEventListener("unhandledrejection", (event) => {
    const error = event.reason instanceof Error 
      ? event.reason 
      : new Error(String(event.reason));
    reportError(error);
  });

  // Expose for ErrorBoundary componentDidCatch
  (window as any).__reportError = (error: Error, info?: { componentStack?: string }) => {
    reportError(error, info?.componentStack);
  };

  // Detect stale chunk loading errors and auto-reload
  window.addEventListener("error", (event) => {
    const msg = event.error?.message || event.message || "";
    if (
      msg.includes("Failed to fetch dynamically imported module") ||
      msg.includes("Loading chunk") ||
      msg.includes("Loading CSS chunk")
    ) {
      // Stale deployment — reload once
      const key = "chunk-reload-" + window.location.pathname;
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "1");
        window.location.reload();
      }
    }
  });
}

export function getErrorBuffer() {
  return [...errorBuffer];
}
