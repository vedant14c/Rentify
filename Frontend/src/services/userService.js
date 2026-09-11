import API from "./api";

export async function getMyProfile() {
  const response = await API.get("/users/me");
  return response.data;
}

export async function updateMyProfile(profileData) {
  const response = await API.put("/users/me/preferences", profileData);
  return response.data;
}
