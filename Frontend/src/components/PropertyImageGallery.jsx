import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  FiChevronLeft,
  FiChevronRight,
  FiImage,
} from "react-icons/fi";
import "../css/propertyGallery.css";

function getImageUrl(image) {
  if (typeof image === "string") {
    return image;
  }

  return (
    image?.imageUrl ||
    image?.image ||
    image?.url ||
    ""
  );
}

function PropertyImageGallery({
  images = [],
  mainImage = "",
  title = "Office workspace",
}) {
  const [activeIndex, setActiveIndex] =
    useState(0);

  const galleryImages = useMemo(() => {
    const imageUrls = [
      mainImage,
      ...images.map(getImageUrl),
    ].filter(Boolean);

    return [...new Set(imageUrls)];
  }, [images, mainImage]);

  useEffect(() => {
    setActiveIndex(0);
  }, [galleryImages.length]);

  const showPreviousImage = () => {
    setActiveIndex((currentIndex) =>
      currentIndex === 0
        ? galleryImages.length - 1
        : currentIndex - 1
    );
  };

  const showNextImage = () => {
    setActiveIndex((currentIndex) =>
      currentIndex ===
      galleryImages.length - 1
        ? 0
        : currentIndex + 1
    );
  };

  if (galleryImages.length === 0) {
    return (
      <section className="property-gallery-empty">
        <FiImage />
        <p>No property images available</p>
      </section>
    );
  }

  return (
    <section className="property-gallery">
      <div className="property-main-image">
        <img
          src={galleryImages[activeIndex]}
          alt={`${title} ${activeIndex + 1}`}
        />

        <span className="property-image-count">
          {activeIndex + 1} /{" "}
          {galleryImages.length}
        </span>

        {galleryImages.length > 1 && (
          <>
            <button
              type="button"
              className="gallery-arrow gallery-previous"
              onClick={showPreviousImage}
              aria-label="Previous image"
            >
              <FiChevronLeft />
            </button>

            <button
              type="button"
              className="gallery-arrow gallery-next"
              onClick={showNextImage}
              aria-label="Next image"
            >
              <FiChevronRight />
            </button>
          </>
        )}
      </div>

      {galleryImages.length > 1 && (
        <div className="property-thumbnails">
          {galleryImages.map(
            (imageUrl, index) => (
              <button
                type="button"
                key={`${imageUrl}-${index}`}
                className={
                  activeIndex === index
                    ? "property-thumbnail active"
                    : "property-thumbnail"
                }
                onClick={() =>
                  setActiveIndex(index)
                }
              >
                <img
                  src={imageUrl}
                  alt={`${title} thumbnail ${
                    index + 1
                  }`}
                />
              </button>
            )
          )}
        </div>
      )}
    </section>
  );
}

export default PropertyImageGallery;