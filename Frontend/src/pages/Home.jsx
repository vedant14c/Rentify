import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiArrowRight,
  FiBriefcase,
  FiCheckCircle,
  FiClock,
  FiMapPin,
  FiSearch,
  FiShield,
} from "react-icons/fi";
import "../css/home.css";

function Home() {
  const navigate = useNavigate();
  const [location, setLocation] = useState("");
  const [propertyType, setPropertyType] = useState("");

  const handleSearch = (event) => {
    event.preventDefault();

    const searchParameters = new URLSearchParams();

    if (location.trim()) {
      searchParameters.set(
        "search",
        location.trim()
      );
    }

    if (propertyType) {
      searchParameters.set(
        "type",
        propertyType
      );
    }

    const queryString = searchParameters.toString();

    navigate(
      queryString
        ? `/offices?${queryString}`
        : "/offices"
    );
  };

  return (
    <main>
      <section className="hero-section">
        <div className="hero-background hero-shape-one"></div>
        <div className="hero-background hero-shape-two"></div>

        <div className="container hero-container">
          <div className="hero-content">
            <div className="hero-badge">
              <FiCheckCircle />
              Premium property rental platform
            </div>

            <h1>
              Find your ideal rental property
              <span> hassle-free.</span>
            </h1>

            <p className="hero-description">
              Discover verified offices, houses, apartments and villas
              available for rent in top locations—all in one place.
            </p>

            <div className="hero-buttons">
              <Link
                to="/offices"
                className="primary-btn"
              >
                Explore Rental Properties
                <FiArrowRight />
              </Link>

              <Link
                to="/list-property"
                className="hero-secondary-btn"
              >
                List Your Rental Property
              </Link>
            </div>

            <div className="hero-trust">
              <div>
                <strong>500+</strong>
                <span>Rental properties</span>
              </div>

              <div>
                <strong>25+</strong>
                <span>Prime locations</span>
              </div>

              <div>
                <strong>1,000+</strong>
                <span>Happy tenants</span>
              </div>
            </div>
          </div>

          <div className="search-card">
            <div className="search-card-heading">
              <span className="search-heading-icon">
                <FiSearch />
              </span>

              <div>
                <h2>Find your perfect rental</h2>

                <p>
                  Search by location and property type
                </p>
              </div>
            </div>

            <form
              onSubmit={handleSearch}
              className="search-form"
            >
              <label>
                Location

                <div className="search-input">
                  <FiMapPin />

                  <input
                    type="text"
                    value={location}
                    onChange={(event) =>
                      setLocation(event.target.value)
                    }
                    placeholder="Enter city or location"
                  />
                </div>
              </label>

              <label>
                Property type

                <div className="search-input">
                  <FiBriefcase />

                  <select
                    value={propertyType}
                    onChange={(event) =>
                      setPropertyType(
                        event.target.value
                      )
                    }
                  >
                    <option value="">
                      All property types
                    </option>

                    <option value="Office">
                      Office
                    </option>

                    <option value="House">
                      House
                    </option>

                    <option value="Apartment">
                      Apartment
                    </option>

                    <option value="Villa">
                      Villa
                    </option>
                  </select>
                </div>
              </label>

              <button
                type="submit"
                className="search-button"
              >
                <FiSearch />
                Search Rentals
              </button>
            </form>

            <p className="popular-searches">
              <strong>Popular:</strong> Pune, Mumbai,
              Bengaluru
            </p>
          </div>
        </div>
      </section>

      <section className="features-section">
        <div className="container">
          <p className="section-label">
            WHY CHOOSE US?
          </p>

          <h2 className="section-heading">
            Everything you need for property rental
          </h2>

          <p className="section-description">
            SpacesHub makes searching, comparing and
            applying for property rentals simple and secure.
          </p>

          <div className="features-grid">
            <article className="feature-card">
              <div className="feature-icon blue-icon">
                <FiSearch />
              </div>

              <h3>Easy Search</h3>

              <p>
                Find suitable rental properties using location,
                type and budget filters.
              </p>
            </article>

            <article className="feature-card">
              <div className="feature-icon purple-icon">
                <FiShield />
              </div>

              <h3>Verified Listings</h3>

              <p>
                Browse trusted rental listings with accurate
                property details and transparent pricing.
              </p>
            </article>

            <article className="feature-card">
              <div className="feature-icon orange-icon">
                <FiClock />
              </div>

              <h3>Quick Application</h3>

              <p>
                Send your rental application in a few simple
                steps and connect with owners directly.
              </p>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Home;