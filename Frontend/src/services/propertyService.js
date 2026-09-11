import API from "./api";

const fallbackImage =
  "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80";

export const getFullImageUrl = (
  imageUrl
) => {
  if (!imageUrl) {
    return fallbackImage;
  }

  if (
    imageUrl.startsWith("http://") ||
    imageUrl.startsWith("https://") ||
    imageUrl.startsWith("data:")
  ) {
    return imageUrl;
  }

  // Return relative path as-is — browser/Vercel resolves it
  return imageUrl.startsWith("/")
    ? imageUrl
    : `/${imageUrl}`;
};

export const getPropertyImages = async (
  propertyId
) => {
  if (!propertyId) {
    return [];
  }

  try {
    const response = await API.get(
      `/properties/images/${propertyId}`
    );

    return Array.isArray(response.data)
      ? response.data
      : [];
  } catch (error) {
    console.error(
      `Unable to load images for property ${propertyId}:`,
      error
    );

    return [];
  }
};

export const normalizeProperty = async (
  property
) => {
  if (!property) {
    return null;
  }

  const propertyId = Number(
    property.propertyId ?? property.id
  );

  const images =
    await getPropertyImages(propertyId);

  const firstImageRecord =
    images.find(
      (image) =>
        image?.imageUrl ||
        image?.imagePath ||
        image?.url
    );

  const firstImageUrl =
    firstImageRecord?.imageUrl ??
    firstImageRecord?.imagePath ??
    firstImageRecord?.url;

  const area = Number(
    property.areaSqft ??
    property.area ??
    0
  );

  const normalizedImages = images.map(
    (image) => ({
      ...image,

      imageUrl: getFullImageUrl(
        image.imageUrl ??
        image.imagePath ??
        image.url
      ),
    })
  );

  return {
    ...property,

    id: propertyId,
    propertyId,

    name:
      property.title ??
      property.name ??
      "Rental Property",

    type:
      property.propertyType ??
      property.type ??
      "Property",

    price: Number(property.price ?? 0),

    area,

    capacity:
      property.capacity ??
      Math.max(
        1,
        Math.round(area / 100)
      ),

    city:
      property.city ??
      "Location unavailable",

    address:
      property.address ??
      property.city ??
      "",

    state: property.state ?? "",

    description:
      property.description ?? "",

    image: getFullImageUrl(
      firstImageUrl
    ),

    images: normalizedImages,
  };
};

export const normalizeProperties = async (
  properties
) => {
  console.log("[FRONTEND LOG] propertyService.normalizeProperties raw input:", properties);
  const propertyList =
    Array.isArray(properties)
      ? properties
      : [];

  const normalizedProperties =
    await Promise.all(
      propertyList.map(
        (property) =>
          normalizeProperty(property)
      )
    );

  const result = normalizedProperties.filter(Boolean);
  console.log("[FRONTEND LOG] propertyService.normalizeProperties output:", result);
  return result;
};

/* Public properties */

export const getApprovedProperties =
  async () => {

    const response = await API.get(
      "/properties/approved"
    );

    return normalizeProperties(
      response.data
    );
  };

export const getAllProperties =
  async () => {

    const response = await API.get(
      "/properties"
    );

    return normalizeProperties(
      response.data
    );
  };

export const getPropertyById = async (
  propertyId
) => {
  const response = await API.get(
    `/properties/${propertyId}`
  );

  return normalizeProperty(
    response.data
  );
};

/* Owner properties */

export const getOwnerProperties = async (
  ownerId
) => {
  const response = await API.get(
    `/properties/owner/${ownerId}`
  );

  return normalizeProperties(
    response.data
  );
};

export const createProperty = async (
  propertyData
) => {
  const response = await API.post(
    "/properties",
    propertyData
  );

  return response.data;
};

export const updateProperty = async (
  propertyId,
  propertyData
) => {
  const response = await API.put(
    `/properties/${propertyId}`,
    propertyData
  );

  return response.data;
};

export const deleteProperty = async (
  propertyId
) => {
  const response = await API.delete(
    `/properties/${propertyId}`
  );

  return response.data;
};

/* Property images */

export const uploadPropertyImages = async (
  propertyId,
  files
) => {
  const formData = new FormData();

  Array.from(files).forEach((file) => {
    formData.append("files", file);
  });

  const response = await API.post(
    `/properties/images/${propertyId}`,
    formData,
    {
      headers: {
        "Content-Type":
          "multipart/form-data",
      },
    }
  );

  return response.data;
};

export const smartSearch = async (query) => {
  console.log("SMART SEARCH CALLED");
  console.log("Query =", query);

  const response = await API.post("/search/smart", {
    query,
  });

  console.log("Backend Response =", response.data);

  return normalizeProperties(response.data);
};