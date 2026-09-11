import { loadRazorpayScript } from "./loadRazorpay";
import { createPaymentOrder, verifyPayment } from "../services/paymentService";

export async function processRazorpayPayment({ requestId, officeName, user, onSuccess, onError }) {
  try {
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      const errorMsg = "Unable to load Razorpay payment gateway script. Check your internet connection.";
      if (onError) onError(errorMsg);
      throw new Error(errorMsg);
    }

    const orderRes = await createPaymentOrder(requestId);
    const orderData = orderRes?.data ? orderRes.data : orderRes;

    const keyId = orderData.keyId || orderData.key;
    const orderId = orderData.orderId || orderData.id;
    const amount = orderData.amount;
    const currency = orderData.currency || "INR";

    if (!keyId || !orderId) {
      throw new Error(`Invalid payment order payload received from backend: ${JSON.stringify(orderData)}`);
    }

    return new Promise((resolve, reject) => {
      const options = {
        key: keyId,
        amount: amount,
        currency: currency,
        name: "SpacesHub",
        description: officeName || "Property Booking",
        order_id: orderId,
        handler: async (response) => {
          try {
            const verified = await verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            if (onSuccess) onSuccess(verified);
            resolve(verified);
          } catch (verifyError) {
            console.error("Payment verification failed:", verifyError);
            const msg = verifyError.response?.data?.message || "Payment verification failed.";
            if (onError) onError(msg);
            reject(new Error(msg));
          }
        },
        modal: {
          ondismiss: () => {
            const msg = "Payment checkout was closed.";
            if (onError) onError(msg);
            reject(new Error(msg));
          },
        },
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
        },
        theme: {
          color: "#2563eb",
        },
      };

      const razorpayCheckout = new window.Razorpay(options);
      razorpayCheckout.open();
    });
  } catch (err) {
    console.error("Razorpay initiation failed:", err);
    const msg = err.response?.data?.message || err.message || "Unable to start payment.";
    if (onError) onError(msg);
    throw err;
  }
}
