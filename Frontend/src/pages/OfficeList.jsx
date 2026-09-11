import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  FiAlertCircle,
  FiBriefcase,
  FiLoader,
  FiSearch,
} from "react-icons/fi";
import OfficeCard from "../components/OfficeCard";
import {
  getApprovedProperties,
  smartSearch,
} from "../services/propertyService";
import "../css/office.css";
import { BsStars } from "react-icons/bs";


function OfficeList() {
  const [searchParams] = useSearchParams();
  const initialType = searchParams.get("type") || "All";
  const initialSearch = searchParams.get("search") || "";

  const [offices, setOffices] = useState([]);
  const [search, setSearch] = useState(initialSearch);
  const [propertyType, setPropertyType] = useState(initialType);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let componentActive = true;

    const loadOffices = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getApprovedProperties();

        if (componentActive) {
          setOffices(response);
        }
      } catch (requestError) {
        console.error(
          "Unable to load properties:",
          requestError
        );

        if (componentActive) {
          if (!requestError.response) {
            setError(
              "Cannot connect to the backend. Make sure Spring Boot is running."
            );
          } else {
            setError(
              requestError.response?.data?.message ||
              "Unable to load rental properties."
            );
          }
        }
      } finally {
        if (componentActive) {
          setLoading(false);
        }
      }
    };

    loadOffices();

    return () => {
      componentActive = false;
    };
  }, []);

  const filteredOffices = offices.filter((office) => {
    return (
      propertyType === "All" ||
      String(office.type || "").toLowerCase() === propertyType.toLowerCase()
    );
  });

  const handleAISearch = async (event) => {
    if (event) {
      event.preventDefault();
    }
    try {
      setLoading(true);
      setError("");

      const response = await smartSearch(search);

      setOffices(response);
    } catch (err) {
      console.error(err);
      setError("Unable to perform AI Search.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <main className="office-page">
      <section className="office-page-header">
        <div className="container">
          <span className="office-header-icon">
            <FiBriefcase />
          </span>

          <h1>Find Your Perfect Rental Property</h1>

          <p>
            Browse verified rental properties across top locations.
          </p>
        </div>
      </section>

      <section className="container office-content">
        <div className="office-filters">
          <form className="filter-search" onSubmit={handleAISearch}>

            <FiSearch className="search-icon" />

            <input
              type="text"
              placeholder="Try: office for rent in Pune under ₹60,000"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            <div className="ai-badge">
              <BsStars />
              <span>AI</span>
            </div>

            <button
              type="submit"
              className="search-button"
            >
              Search
            </button>

          </form>

          <select
            value={propertyType}
            onChange={(event) =>
              setPropertyType(event.target.value)
            }
          >
            <option value="All">
              All Properties
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

        <div className="office-results-heading">
          <div>
            <h2>Available Rental Properties</h2>

            <p>
              {loading
                ? "Loading properties..."
                : `${filteredOffices.length} properties found`}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="no-offices">
            <FiLoader className="loading-icon" />
            <h3>Loading properties...</h3>
            <p>Please wait while we load available properties.</p>
          </div>
        ) : error ? (
          <div className="no-offices">
            <FiAlertCircle />
            <h3>Unable to load properties</h3>
            <p>{error}</p>
          </div>
        ) : filteredOffices.length > 0 ? (
          <div className="office-grid">
            {filteredOffices.map((office) => (
              <OfficeCard
                key={office.id}
                office={office}
              />
            ))}
          </div>
        ) : (
          <div className="no-offices">
            <FiSearch />
            <h3>No properties found</h3>
            <p>
              Try another location or property type.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}

export default OfficeList;