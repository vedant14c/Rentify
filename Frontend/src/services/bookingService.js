import API from "./api";

export const getPropertyAvailability = async (propertyId, date) => {
  try {
    const response = await API.get(`/properties/${propertyId}/availability`, {
      params: date ? { date } : undefined,
    });
    if (response.data && response.data.data) {
      return response.data.data;
    }
    return response.data;
  } catch (err) {
    const fallbackResponse = await API.get("/requests/availability", {
      params: { propertyId },
    });
    if (fallbackResponse.data && fallbackResponse.data.data) {
      return {
        bookedDateRanges: fallbackResponse.data.data || [],
      };
    }
    return {
      bookedDateRanges: fallbackResponse.data || [],
    };
  }
};

export const createBookingRequest = async (bookingData) => {
  const response = await API.post("/requests", {
    propertyId: Number(bookingData.propertyId),
    requestType: bookingData.requestType || "RENTAL",
    proposedStart: bookingData.proposedStart,
    proposedEnd: bookingData.proposedEnd,
    startTime: bookingData.startTime || null,
    endTime: bookingData.endTime || null,
    teamSize: bookingData.teamSize ? Number(bookingData.teamSize) : null,
    message: bookingData.message || "",
  });

  return response.data?.data || response.data;
};

export const getMyBookingRequests = async (userId) => {
  const response = await API.get(`/requests/my/${userId}`);
  if (response.data && Array.isArray(response.data.data)) {
    return response.data.data;
  }
  if (Array.isArray(response.data)) {
    return response.data;
  }
  return response.data?.data || response.data || [];
};

export const getOwnerBookingRequests = async (ownerId) => {
  const response = await API.get(`/requests/owner/${ownerId}`);
  if (response.data && Array.isArray(response.data.data)) {
    return response.data.data;
  }
  return Array.isArray(response.data) ? response.data : response.data?.data || [];
};

export const getBookingRequestById = async (requestId) => {
  const response = await API.get(`/requests/${requestId}`);
  return response.data?.data || response.data;
};

export const cancelBookingRequest = async (requestId) => {
  const response = await API.put(`/requests/cancel/${requestId}`);
  return response.data?.data || response.data;
};

export const updateBookingRequestStatus = async (requestId, status) => {
  const response = await API.put(
    `/requests/status/${requestId}`,
    null,
    {
      params: {
        status,
      },
    }
  );

  return response.data?.data || response.data;
};