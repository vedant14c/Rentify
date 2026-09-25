import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiHeart,
  FiLoader,
  FiTrash2,
} from "react-icons/fi";
import OfficeCard from "../components/OfficeCard";
import fallbackOffices from "../data/offices";
import { getApprovedProperties } from "../services/propertyService";
import "../css/favorites.css";

const FAVORITES_KEY = "officeFavorites";

function getFavoriteIds() {
  try {
    return (
      JSON.parse(
        localStorage.getItem(FAVORITES_KEY)
      ) || []
    );
  } catch {
    return [];
  }
}

function Favorites() {
  const [favoriteIds, setFavoriteIds] = useState(getFavoriteIds);
  const [allProperties, setAllProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadProperties = async () => {
      try {
        setLoading(true);
        const backendProps = await getApprovedProperties();
        if (active) {
          if (Array.isArray(backendProps) && backendProps.length > 0) {
            setAllProperties(backendProps);
          } else {
            setAllProperties(fallbackOffices);
          }
        }
      } catch {
        if (active) {
          setAllProperties(fallbackOffices);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadProperties();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const updateFavorites = () => {
      setFavoriteIds(getFavoriteIds());
    };

    window.addEventListener(
      "favoritesUpdated",
      updateFavorites
    );

    window.addEventListener(
      "storage",
      updateFavorites
    );

    return () => {
      window.removeEventListener(
        "favoritesUpdated",
        updateFavorites
      );

      window.removeEventListener(
        "storage",
        updateFavorites
      );
    };
  }, []);

  const favoriteOffices = allProperties.filter((office) => {
    if (!office) return false;
    const id = Number(office.propertyId ?? office.id);
    return favoriteIds.some((favId) => Number(favId) === id);
  });

  const clearAllFavorites = () => {
    const confirmed = window.confirm(
      "Remove all properties from favourites?"
    );

    if (!confirmed) {
      return;
    }

    localStorage.removeItem(FAVORITES_KEY);
    setFavoriteIds([]);

    window.dispatchEvent(
      new Event("favoritesUpdated")
    );
  };

  return (
    <main className="favorites-page">
      <section className="favorites-header">
        <div className="container">
          <span className="favorites-header-icon">
            <FiHeart />
          </span>

          <p>YOUR SAVED PROPERTIES</p>

          <h1>Favourite Properties</h1>

          <span>
            Keep your preferred properties in one place.
          </span>
        </div>
      </section>

      <section className="container favorites-content">
        {loading ? (
          <div className="empty-favorites" style={{ minHeight: "240px" }}>
            <span className="office-spinner" style={{ display: "inline-block", fontSize: "2rem" }}>
              <FiLoader className="spin" />
            </span>
            <p>Loading your saved properties...</p>
          </div>
        ) : favoriteOffices.length > 0 ? (
          <>
            <div className="favorites-toolbar">
              <div>
                <h2>Saved Properties</h2>

                <p>
                  {favoriteOffices.length}{" "}
                  {favoriteOffices.length === 1
                    ? "property"
                    : "properties"}{" "}
                  saved
                </p>
              </div>

              <button
                type="button"
                className="clear-favorites-button"
                onClick={clearAllFavorites}
              >
                <FiTrash2 />
                Clear All
              </button>
            </div>

            <div className="office-grid">
              {favoriteOffices.map((office) => {
                const propId = Number(office.propertyId ?? office.id);
                return (
                  <OfficeCard
                    key={propId}
                    office={office}
                  />
                );
              })}
            </div>
          </>
        ) : (
          <div className="empty-favorites">
            <span>
              <FiHeart />
            </span>

            <h2>No favourite properties yet</h2>

            <p>
              Select the heart button on a property card to
              save it here.
            </p>

            <Link
              to="/properties"
              className="primary-btn"
            >
              Explore Properties
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}

export default Favorites;