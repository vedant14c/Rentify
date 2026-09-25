import API from "./api";

export const createPaymentOrder = async (requestId) => {
  const response = await API.post(`/payments/create-order/${requestId}`);

  return response.data;
};

export const verifyPayment = async (payload) => {
  const response = await API.post("/payments/verify", payload);
  return response.data;
};