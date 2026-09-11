const CITY_COORDINATES = {
  pune: [18.5204, 73.8567],
  mumbai: [19.076, 72.8777],
  bengaluru: [12.9716, 77.5946],
  bangalore: [12.9716, 77.5946],
  delhi: [28.6139, 77.209],
  newdelhi: [28.6139, 77.209],
  hyderabad: [17.385, 78.4867],
  chennai: [13.0827, 80.2707],
  kolkata: [22.5726, 88.3639],
  ahmedabad: [23.0225, 72.5714],
  jaipur: [26.9124, 75.7873],
};

export const getCityFallbackCoordinates = (cityName = "") => {
  const normalizedCity = String(cityName)
    .toLowerCase()
    .replaceAll(/[^a-z]/g, "");

  for (const [key, coords] of Object.entries(CITY_COORDINATES)) {
    if (normalizedCity.includes(key)) {
      return coords;
    }
  }

  return [18.5204, 73.8567]; // Default to Pune center if city not found
};

export const geocodeAddress = async ({ address, city, state, zipCode }) => {
  const parts = [address, city, state, zipCode, "India"]
    .filter(Boolean)
    .join(", ");

  if (!parts.trim()) {
    return null;
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      parts
    )}&limit=1`;

    const response = await fetch(url, {
      headers: {
        "Accept-Language": "en",
        "User-Agent": "SpacesHub-PropertyRentalPlatform/1.0",
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (Array.isArray(data) && data.length > 0) {
      const lat = parseFloat(data[0].lat);
      const lon = parseFloat(data[0].lon);

      if (Number.isFinite(lat) && Number.isFinite(lon)) {
        return { lat, lng: lon };
      }
    }

    // Try geocoding city + state if full address returned no results
    const fallbackQuery = [city, state, "India"].filter(Boolean).join(", ");
    if (fallbackQuery.trim() && fallbackQuery !== parts) {
      const fallbackUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        fallbackQuery
      )}&limit=1`;

      const fallbackResponse = await fetch(fallbackUrl, {
        headers: {
          "Accept-Language": "en",
          "User-Agent": "SpacesHub-PropertyRentalPlatform/1.0",
        },
      });

      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        if (Array.isArray(fallbackData) && fallbackData.length > 0) {
          const lat = parseFloat(fallbackData[0].lat);
          const lon = parseFloat(fallbackData[0].lon);

          if (Number.isFinite(lat) && Number.isFinite(lon)) {
            return { lat, lng: lon };
          }
        }
      }
    }
  } catch (error) {
    console.warn("Geocoding service unavailable:", error);
  }

  return null;
};
