import API from "./api";
import {
  getAllProperties,
} from "./propertyService";

/* =========================
   PROPERTY MANAGEMENT
========================= */

export const getAllPropertiesForAdmin =
  async () => {
    /*
     * getAllProperties also loads the
     * correct image for every property.
     */
    return getAllProperties();
  };

export const approveProperty = async (
  propertyId
) => {
  const response = await API.put(
    `/properties/approve/${propertyId}`
  );

  return response.data;
};

export const rejectProperty = async (
  propertyId
) => {
  const response = await API.put(
    `/properties/reject/${propertyId}`
  );

  return response.data;
};

export const deletePropertyAsAdmin = async (
  propertyId
) => {
  const response = await API.delete(
    `/properties/${propertyId}`
  );

  return response.data;
};

/* =========================
   USER MANAGEMENT
========================= */

export const getAllUsersForAdmin =
  async () => {
    const response = await API.get(
      "/users"
    );

    return response.data;
  };

export const updateUserStatus = async (
  userId,
  active
) => {
  const endpoint = active
    ? `/users/activate/${userId}`
    : `/users/deactivate/${userId}`;

  const response = await API.put(endpoint);

  return response.data;
};

export const updateUserRole = async (
  userId,
  role
) => {
  const response = await API.put(
    `/users/${userId}/role`,
    null,
    {
      params: {
        role,
      },
    }
  );

  return response.data;
};

/* =========================
   BOOKING MANAGEMENT
========================= */

export const getAllBookingRequestsForAdmin =
  async (requestType = "RENTAL") => {
    const response = await API.get(
      "/requests",
      {
        params: {
          type: requestType,
        },
      }
    );

    return response.data;
  };

export const updateBookingStatusAsAdmin =
  async (
    requestId,
    status
  ) => {
    const response = await API.put(
      `/requests/status/${requestId}`,
      null,
      {
        params: {
          status,
        },
      }
    );

    return response.data;
  };