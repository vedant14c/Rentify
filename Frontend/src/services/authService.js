import API from "./api";

export const loginUser = async (loginData) => {
  const response = await API.post("/login", {
    email: String(loginData.email || "")
      .trim()
      .toLowerCase(),
    password: String(loginData.password || ""),
  });

  return response.data;
};

export const registerUser = async (userData) => {
  const response = await API.post("/register", {
    name: String(
      userData.name || userData.fullName || ""
    ).trim(),

    email: String(userData.email || "")
      .trim()
      .toLowerCase(),

    password: String(userData.password || ""),

    role: String(userData.role || "USER").toUpperCase(),

    phone: String(userData.phone || "").trim() || null,
  });

  return response.data;
};

export const logoutUser = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("userId");
  localStorage.removeItem("name");
  localStorage.removeItem("role");
};

export const forgotPassword = async (email) => {
  const response = await API.post("/forgot-password", {
    email,
  });

  return response.data;
};

export const resetPassword = async (token, newPassword) => {
  const response = await API.post("/reset-password", {
    token,
    newPassword,
  });

  return response.data;
};