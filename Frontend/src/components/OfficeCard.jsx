import {
  useEffect,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  FiArrowRight,
  FiHeart,
  FiMapPin,
  FiMaximize2,
  FiStar,
  FiUsers,
} from "react-icons/fi";
import { getReviewsByPropertyId } from "../services/reviewService";
import "../css/office.css";

const FAVORITES_KEY = "officeFavorites";

function getSavedFavorites() {
  try {
    const savedFavorites = JSON.parse(
      localStorage.getItem(FAVORITES_KEY)
    );

    return Array.isArray(savedFavorites)
      ? savedFavorites
      : [];
  } catch {
    return [];
  }
}

function OfficeCard({ office }) {
  const navigate = useNavigate();

  const propertyId = Number(
    office.propertyId ?? office.id
  );

  const [isFavorite, setIsFavorite] =
    useState(() => {
      return getSavedFavorites().some(
        (favoriteId) =>
          Number(favoriteId) === propertyId
      );
    });

  const [ratingSummary, setRatingSummary] =
    useState({
      average: 0,
      count: 0,
    });

  useEffect(() => {
    let componentActive = true;

    const loadRating = async () => {
      try {
        const response =
          await getReviewsByPropertyId(
            propertyId
          );

        const reviews = Array.isArray(response)
          ? response
          : [];

        const totalRating = reviews.reduce(
          (total, review) =>
            total +
            Number(review.rating || 0),
          0
        );

        const average =
          reviews.length > 0
            ? totalRating / reviews.length
            : 0;

        if (componentActive) {
          setRatingSummary({
            average,
            count: reviews.length,
          });
        }
      } catch {
        if (componentActive) {
          setRatingSummary({
            average: 0,
            count: 0,
          });
        }
      }
    };

    if (
      Number.isFinite(propertyId) &&
      propertyId > 0
    ) {
      loadRating();
    }

    return () => {
      componentActive = false;
    };
  }, [propertyId]);

  const toggleFavorite = () => {
    const savedFavorites =
      getSavedFavorites().map(Number);

    let updatedFavorites;

    if (savedFavorites.includes(propertyId)) {
      updatedFavorites =
        savedFavorites.filter(
          (favoriteId) =>
            favoriteId !== propertyId
        );

      setIsFavorite(false);
    } else {
      updatedFavorites = [
        ...savedFavorites,
        propertyId,
      ];

      setIsFavorite(true);
    }

    localStorage.setItem(
      FAVORITES_KEY,
      JSON.stringify(updatedFavorites)
    );

    window.dispatchEvent(
      new Event("favoritesUpdated")
    );
  };

  const handleViewDetails = () => {
    if (
      !Number.isFinite(propertyId) ||
      propertyId <= 0
    ) {
      console.error(
        "Invalid property ID:",
        office
      );

      return;
    }

    navigate(
      `/office-details/${propertyId}`
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const rawType = String(office.type || office.propertyType || "Property").trim();
  const lowerType = rawType.toLowerCase();

  let primaryType = rawType;

  if (lowerType === "office") primaryType = "Office";
  else if (lowerType === "house") primaryType = "House";
  else if (lowerType === "apartment") primaryType = "Apartment";
  else if (lowerType === "villa") primaryType = "Villa";

  const badgeText = primaryType;

  const formattedPrice = Number(
    office.price || 0
  ).toLocaleString("en-IN");

  return (
    <article className="office-card">
      <div className="office-image-container">
        <img
          src={office.image}
          alt={office.name}
          className="office-image"
        />

        <span className="office-type">
          {badgeText}
        </span>

        <button
          type="button"
          className={`favorite-button ${
            isFavorite
              ? "favorite-active"
              : ""
          }`}
          onClick={toggleFavorite}
          aria-label={
            isFavorite
              ? "Remove from favourites"
              : "Add to favourites"
          }
        >
          <FiHeart />
        </button>
      </div>

      <div className="office-card-content">
        <div className="office-location">
          <FiMapPin />
          <span>{office.city}</span>
        </div>

        <h3>{office.name}</h3>

        <div className="office-card-rating">
          <span className="office-rating-stars">
            {[1, 2, 3, 4, 5].map(
              (star) => (
                <FiStar
                  key={star}
                  className={
                    star <=
                    Math.round(
                      ratingSummary.average
                    )
                      ? "active"
                      : ""
                  }
                />
              )
            )}
          </span>

          <strong>
            {ratingSummary.count > 0
              ? ratingSummary.average.toFixed(
                  1
                )
              : "New"}
          </strong>

          <small>
            ({ratingSummary.count}{" "}
            {ratingSummary.count === 1
              ? "review"
              : "reviews"}
            )
          </small>
        </div>

        <div className="office-information">
          <span>
            <FiMaximize2 />
            {office.area || 0} sq.ft.
          </span>

          <span>
            <FiUsers />
            {office.capacity || 1} people
          </span>
        </div>

        <div className="office-card-footer">
          <div className="office-price">
            <strong>
              ₹{formattedPrice}
            </strong>

            <span>/{String(office.priceUnit || "MONTH").toLowerCase()}</span>
          </div>

          <button
            type="button"
            className="view-details-button"
            onClick={handleViewDetails}
          >
            View Details
            <FiArrowRight />
          </button>
        </div>
      </div>
    </article>
  );
}

export default OfficeCard;