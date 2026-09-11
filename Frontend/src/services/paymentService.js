import API from "./api";

export const createPaymentOrder = async (requestId) => {
  const userId = Number(localStorage.getItem("userId"));

  const response = await API.post(
    `/payments/create-order/${requestId}`,
    { userId }
  );

  return response.data;
};

export const verifyPayment = async (payload) => {
  const response = await API.post("/payments/verify", payload);
  return response.data;
};