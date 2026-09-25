let razorpayScriptPromise;

export function loadRazorpayScript() {
  if (typeof window !== "undefined" && typeof window.Razorpay === "function") {
    return Promise.resolve(true);
  }

  if (razorpayScriptPromise) {
    return razorpayScriptPromise;
  }

  razorpayScriptPromise = new Promise((resolve) => {
    const existingScript = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );
    const script = existingScript || document.createElement("script");
    let settled = false;

    const finish = (loaded) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      resolve(loaded && typeof window.Razorpay === "function");
    };

    const timeoutId = window.setTimeout(() => finish(false), 10000);
    script.addEventListener("load", () => finish(true), { once: true });
    script.addEventListener("error", () => finish(false), { once: true });

    if (!existingScript) {
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.head.appendChild(script);
    } else if (typeof window.Razorpay === "function") {
      finish(true);
    }
  }).finally(() => {
    razorpayScriptPromise = undefined;
  });

  return razorpayScriptPromise;
}