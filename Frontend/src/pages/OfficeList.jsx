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
  const [searchParams, setSearchParams] = useSearchParams();
  const initialIntent = (searchParams.get("intent") || "ALL").toUpperCase();
  const initialType = searchParams.get("type") || "All";
  const initialCity = searchParams.get("city") || "All";
  const initialBudget = searchParams.get("budget") || "All";
  const initialSearch = searchParams.get("search") || "";

  const [offices, setOffices] = useState([]);
  const [search, setSearch] = useState(initialSearch);
  const [listingIntent, setListingIntent] = useState(initialIntent);
  const [propertyType, setPropertyType] = useState(initialType);
  const [selectedCity, setSelectedCity] = useState(initialCity);
  const [selectedBudget, setSelectedBudget] = useState(initialBudget);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const urlIntent = (searchParams.get("intent") || "ALL").toUpperCase();
    setListingIntent(urlIntent);
    const urlType = searchParams.get("type") || "All";
    setPropertyType(urlType);
    const urlCity = searchParams.get("city") || "All";
    setSelectedCity(urlCity);
    const urlBudget = searchParams.get("budget") || "All";
    setSelectedBudget(urlBudget);
    const urlSearch = searchParams.get("search") || "";
    setSearch(urlSearch);
  }, [searchParams]);

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
              "Unable to load properties."
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

  const handleIntentChange = (newIntent) => {
    setListingIntent(newIntent);
    setSelectedBudget("All");
    const nextParams = new URLSearchParams(searchParams);
    if (newIntent === "ALL") {
      nextParams.delete("intent");
    } else {
      nextParams.set("intent", newIntent);
    }
    nextParams.delete("budget");
    setSearchParams(nextParams);
  };

  const handleTypeChange = (newType) => {
    setPropertyType(newType);
    const nextParams = new URLSearchParams(searchParams);
    if (newType === "All") {
      nextParams.delete("type");
    } else {
      nextParams.set("type", newType);
    }
    setSearchParams(nextParams);
  };

  const handleCityChange = (newCity) => {
    setSelectedCity(newCity);
    const nextParams = new URLSearchParams(searchParams);
    if (newCity === "All") {
      nextParams.delete("city");
    } else {
      nextParams.set("city", newCity);
    }
    setSearchParams(nextParams);
  };

  const handleBudgetChange = (newBudget) => {
    setSelectedBudget(newBudget);
    const nextParams = new URLSearchParams(searchParams);
    if (newBudget === "All") {
      nextParams.delete("budget");
    } else {
      nextParams.set("budget", newBudget);
    }
    setSearchParams(nextParams);
  };

  const availableCities = Array.from(
    new Set(offices.map((o) => o.city?.trim()).filter(Boolean))
  ).sort();

  const isRent = listingIntent === "RENT";
  const isBuy = listingIntent === "BUY" || listingIntent === "SALE";

  const filteredOffices = offices.filter((office) => {
    const rawListingType = String(office.listingType || "RENT").toUpperCase();
    if (listingIntent === "RENT" && rawListingType !== "RENT") {
      return false;
    }
    if (
      (listingIntent === "BUY" || listingIntent === "SALE") &&
      rawListingType !== "SALE" &&
      rawListingType !== "BUY"
    ) {
      return false;
    }

    const officeType = office.propertyType || office.type || "";
    if (
      propertyType !== "All" &&
      String(officeType).toLowerCase() !== propertyType.toLowerCase()
    ) {
      return false;
    }

    if (selectedCity !== "All") {
      const officeCity = String(office.city || "").trim().toLowerCase();
      if (officeCity !== selectedCity.trim().toLowerCase()) {
        return false;
      }
    }

    if (selectedBudget !== "All") {
      const p = Number(office.price || 0);
      if (selectedBudget === "under-25k" && p > 25000) return false;
      if (selectedBudget === "25k-50k" && (p < 25000 || p > 50000)) return false;
      if (selectedBudget === "50k-100k" && (p < 50000 || p > 100000)) return false;
      if (selectedBudget === "above-100k" && p < 100000) return false;

      if (selectedBudget === "under-50l" && p > 5000000) return false;
      if (selectedBudget === "50l-150l" && (p < 5000000 || p > 15000000)) return false;
      if (selectedBudget === "150l-300l" && (p < 15000000 || p > 30000000)) return false;
      if (selectedBudget === "above-300l" && p < 30000000) return false;

      if (selectedBudget === "under-1cr" && p > 10000000) return false;
      if (selectedBudget === "above-1cr" && p < 10000000) return false;
    }

    return true;
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

          <h1>
            {isRent
              ? "Find Your Perfect Rental Property"
              : isBuy
              ? "Properties for Sale & Investment"
              : "Explore Verified Properties"}
          </h1>

          <p>
            {isRent
              ? "Browse verified residential and commercial properties available for rent."
              : isBuy
              ? "Discover verified houses, apartments, villas and offices available for purchase."
              : "Browse verified offices, houses, apartments and villas to rent or buy."}
          </p>
        </div>
      </section>

      <section className="container office-content">
        <div className="office-filters">
          <div className="office-filters-top">
            <div className="listing-intent-pills">
              <button
                type="button"
                className={`intent-pill ${listingIntent === "ALL" ? "active" : ""}`}
                onClick={() => handleIntentChange("ALL")}
              >
                All Listings
              </button>
              <button
                type="button"
                className={`intent-pill ${listingIntent === "RENT" ? "active" : ""}`}
                onClick={() => handleIntentChange("RENT")}
              >
                For Rent
              </button>
              <button
                type="button"
                className={`intent-pill ${isBuy ? "active" : ""}`}
                onClick={() => handleIntentChange("BUY")}
              >
                For Sale (Buy)
              </button>
            </div>
          </div>

          <div className="office-filters-bottom">
            <form className="filter-search" onSubmit={handleAISearch}>
              <FiSearch className="search-icon" />

              <input
                type="text"
                placeholder={
                  isBuy
                    ? "Try: 3 BHK apartment for sale in Mumbai under ₹1.5 Cr"
                    : "Try: office for rent in Pune under ₹60,000"
                }
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

            <div className="office-selects-row">
              <select
                value={selectedCity}
                onChange={(event) => handleCityChange(event.target.value)}
                className="filter-select"
                aria-label="Filter by City"
              >
                <option value="All">All Cities</option>
                {availableCities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>

              <select
                value={propertyType}
                onChange={(event) => handleTypeChange(event.target.value)}
                className="filter-select"
                aria-label="Filter by Property Type"
              >
                <option value="All">
                  All Property Types
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

              <select
                value={selectedBudget}
                onChange={(event) => handleBudgetChange(event.target.value)}
                className="filter-select"
                aria-label="Filter by Budget"
              >
                <option value="All">All Budgets</option>
                {isRent && (
                  <>
                    <option value="under-25k">Under ₹25,000</option>
                    <option value="25k-50k">₹25,000 - ₹50,000</option>
                    <option value="50k-100k">₹50,000 - ₹1,00,000</option>
                    <option value="above-100k">Above ₹1,00,000</option>
                  </>
                )}
                {isBuy && (
                  <>
                    <option value="under-50l">Under ₹50 Lakhs</option>
                    <option value="50l-150l">₹50L - ₹1.5 Crores</option>
                    <option value="150l-300l">₹1.5 Cr - ₹3 Crores</option>
                    <option value="above-300l">Above ₹3 Crores</option>
                  </>
                )}
                {!isRent && !isBuy && (
                  <>
                    <option value="under-25k">Under ₹25,000 (Rent)</option>
                    <option value="25k-50k">₹25,000 - ₹50,000 (Rent)</option>
                    <option value="under-1cr">Under ₹1 Crore (Buy)</option>
                    <option value="above-1cr">Above ₹1 Crore (Buy)</option>
                  </>
                )}
              </select>
            </div>
          </div>
        </div>

        <div className="office-results-heading">
          <div>
            <h2>
              {isRent
                ? "Available Properties for Rent"
                : isBuy
                ? "Properties Available for Purchase"
                : "All Available Properties"}
            </h2>

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