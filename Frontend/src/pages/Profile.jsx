import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiCalendar,
  FiCheck,
  FiDollarSign,
  FiEdit3,
  FiLogOut,
  FiMail,
  FiMapPin,
  FiPhone,
  FiSave,
  FiShield,
  FiUser,
  FiX,
  FiHome,
  FiList,
} from "react-icons/fi";
import { getMyProfile, updateMyProfile } from "../services/userService";
import "../css/profile.css";

function getLoggedInUser() {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
}

function Profile() {
  const navigate = useNavigate();
  const storedUser = getLoggedInUser();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    preferredCity: "",
    preferredPropertyType: "",
    preferredListingType: "",
    maxBudget: "",
  });

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      try {
        setLoading(true);
        const data = await getMyProfile();
        if (active) {
          setProfile(data);
          setFormData({
            name: data.name || "",
            phone: data.phone || "",
            preferredCity: data.preferredCity || "",
            preferredPropertyType: data.preferredPropertyType || "",
            preferredListingType: data.preferredListingType || "",
            maxBudget: data.maxBudget ?? "",
          });
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
        if (active) {
          // Fall back to localStorage data
          if (storedUser) {
            setProfile({
              id: storedUser.userId || storedUser.id,
              name: storedUser.name,
              email: storedUser.email,
              phone: storedUser.phone || "",
              role: storedUser.role || "USER",
              preferredCity: "",
              preferredPropertyType: "",
              preferredListingType: "",
              maxBudget: null,
            });
            setFormData({
              name: storedUser.name || "",
              phone: storedUser.phone || "",
              preferredCity: "",
              preferredPropertyType: "",
              preferredListingType: "",
              maxBudget: "",
            });
          }
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadProfile();
    return () => { active = false; };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
    setSuccessMessage("");
  };

  const handleEditClick = () => {
    setEditing(true);
    setSuccessMessage("");
    setError("");
  };

  const handleCancel = () => {
    setEditing(false);
    setError("");
    setFormData({
      name: profile?.name || "",
      phone: profile?.phone || "",
      preferredCity: profile?.preferredCity || "",
      preferredPropertyType: profile?.preferredPropertyType || "",
      preferredListingType: profile?.preferredListingType || "",
      maxBudget: profile?.maxBudget ?? "",
    });
  };

  const handleSave = async (event) => {
    event.preventDefault();

    if (!formData.name.trim()) {
      setError("Name cannot be empty.");
      return;
    }

    if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
      setError("Phone number must be exactly 10 digits.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        name: formData.name.trim(),
        phone: formData.phone.trim() || null,
        preferredCity: formData.preferredCity.trim() || null,
        preferredPropertyType: formData.preferredPropertyType || null,
        preferredListingType: formData.preferredListingType || null,
        maxBudget: formData.maxBudget ? Number(formData.maxBudget) : null,
      };

      const updatedProfile = await updateMyProfile(payload);

      setProfile(updatedProfile);
      setFormData({
        name: updatedProfile.name || "",
        phone: updatedProfile.phone || "",
        preferredCity: updatedProfile.preferredCity || "",
        preferredPropertyType: updatedProfile.preferredPropertyType || "",
        preferredListingType: updatedProfile.preferredListingType || "",
        maxBudget: updatedProfile.maxBudget ?? "",
      });

      // Sync localStorage so Navbar and other components reflect changes
      const currentUser = getLoggedInUser();
      if (currentUser) {
        const synced = {
          ...currentUser,
          name: updatedProfile.name,
          phone: updatedProfile.phone,
        };
        localStorage.setItem("user", JSON.stringify(synced));
      }

      setEditing(false);
      setSuccessMessage("Profile updated successfully!");
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err) {
      console.error("Profile update error:", err);
      const msg = err.response?.data?.message || err.response?.data;
      setError(typeof msg === "string" ? msg : "Unable to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!storedUser && !profile) {
    return (
      <main className="profile-login-required">
        <div>
          <span className="profile-login-icon">
            <FiUser />
          </span>
          <h1>Please sign in</h1>
          <p>You need to sign in to view your profile.</p>
          <Link to="/login" className="primary-btn">
            Go to Login
          </Link>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="profile-page">
        <section className="profile-header">
          <div className="container">
            <p>MY ACCOUNT</p>
            <h1>Profile</h1>
            <span>Loading your profile...</span>
          </div>
        </section>
        <section className="container profile-content">
          <div className="profile-card" style={{ textAlign: "center", padding: "60px 35px" }}>
            <p style={{ color: "#64748b" }}>Loading profile information...</p>
          </div>
        </section>
      </main>
    );
  }

  const displayUser = profile || storedUser;
  const firstLetter = displayUser?.name?.charAt(0).toUpperCase() || "U";

  return (
    <main className="profile-page">
      <section className="profile-header">
        <div className="container">
          <p>MY ACCOUNT</p>
          <h1>Profile</h1>
          <span>{editing ? "Edit your personal information and preferences." : "View and manage your personal information."}</span>
        </div>
      </section>

      <section className="container profile-content">
        <div className="profile-card">

          {/* Success / Error Messages */}
          {successMessage && (
            <div className="profile-success-message">
              <FiCheck />
              {successMessage}
            </div>
          )}
          {error && (
            <div className="profile-error-message">
              {error}
            </div>
          )}

          {/* Profile Summary - always visible */}
          <div className="profile-summary">
            <div className="profile-avatar">
              {firstLetter}
            </div>

            <div>
              <span className="profile-role">
                {displayUser.role || "USER"}
              </span>
              <h2>{displayUser.name || "SpacesHub User"}</h2>
              <p>SpacesHub member</p>
            </div>

            {!editing && (
              <button
                type="button"
                className="profile-edit-button"
                onClick={handleEditClick}
              >
                <FiEdit3 />
                Edit Profile
              </button>
            )}
          </div>

          {editing ? (
            /* ────────── EDIT MODE ────────── */
            <form className="profile-edit-form" onSubmit={handleSave}>
              <div className="profile-form-section">
                <h3>
                  <FiUser />
                  Personal Information
                </h3>

                <div className="profile-form-grid">
                  <label className="profile-form-field">
                    <small>Full Name</small>
                    <div className="profile-input-wrap">
                      <FiUser />
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter your full name"
                        required
                      />
                    </div>
                  </label>

                  <label className="profile-form-field">
                    <small>Phone Number</small>
                    <div className="profile-input-wrap">
                      <FiPhone />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="10-digit phone number"
                        pattern="[0-9]{10}"
                        maxLength="10"
                      />
                    </div>
                  </label>

                  <label className="profile-form-field profile-field-readonly">
                    <small>Email Address</small>
                    <div className="profile-input-wrap">
                      <FiMail />
                      <input
                        type="email"
                        value={displayUser.email}
                        disabled
                      />
                    </div>
                  </label>

                  <label className="profile-form-field profile-field-readonly">
                    <small>Account Role</small>
                    <div className="profile-input-wrap">
                      <FiShield />
                      <input
                        type="text"
                        value={displayUser.role || "USER"}
                        disabled
                      />
                    </div>
                  </label>
                </div>
              </div>

              <div className="profile-form-section">
                <h3>
                  <FiMapPin />
                  Search Preferences
                </h3>
                <p className="profile-form-hint">These preferences help us show you more relevant properties.</p>

                <div className="profile-form-grid">
                  <label className="profile-form-field">
                    <small>Preferred City</small>
                    <div className="profile-input-wrap">
                      <FiMapPin />
                      <input
                        type="text"
                        name="preferredCity"
                        value={formData.preferredCity}
                        onChange={handleChange}
                        placeholder="e.g. Pune, Mumbai"
                      />
                    </div>
                  </label>

                  <label className="profile-form-field">
                    <small>Preferred Property Type</small>
                    <div className="profile-input-wrap">
                      <FiHome />
                      <select
                        name="preferredPropertyType"
                        value={formData.preferredPropertyType}
                        onChange={handleChange}
                      >
                        <option value="">No preference</option>
                        <option value="Office">Office</option>
                        <option value="House">House</option>
                        <option value="Apartment">Apartment</option>
                        <option value="Villa">Villa</option>
                      </select>
                    </div>
                  </label>

                  <label className="profile-form-field">
                    <small>Preferred Listing Type</small>
                    <div className="profile-input-wrap">
                      <FiList />
                      <select
                        name="preferredListingType"
                        value={formData.preferredListingType}
                        onChange={handleChange}
                      >
                        <option value="">No preference</option>
                        <option value="RENT">Rent</option>
                        <option value="LEASE">Lease</option>
                      </select>
                    </div>
                  </label>

                  <label className="profile-form-field">
                    <small>Maximum Budget (₹)</small>
                    <div className="profile-input-wrap">
                      <FiDollarSign />
                      <input
                        type="number"
                        name="maxBudget"
                        value={formData.maxBudget}
                        onChange={handleChange}
                        placeholder="e.g. 50000"
                        min="0"
                      />
                    </div>
                  </label>
                </div>
              </div>

              <div className="profile-form-actions">
                <button
                  type="submit"
                  className="profile-save-button"
                  disabled={saving}
                >
                  <FiSave />
                  {saving ? "Saving..." : "Save Changes"}
                </button>

                <button
                  type="button"
                  className="profile-cancel-button"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  <FiX />
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            /* ────────── VIEW MODE ────────── */
            <>
              <div className="profile-information">
                <article>
                  <span><FiMail /></span>
                  <div>
                    <small>Email address</small>
                    <strong>{displayUser.email}</strong>
                  </div>
                </article>

                <article>
                  <span><FiPhone /></span>
                  <div>
                    <small>Phone number</small>
                    <strong>{displayUser.phone || "Not added"}</strong>
                  </div>
                </article>

                <article>
                  <span><FiShield /></span>
                  <div>
                    <small>Account role</small>
                    <strong>{displayUser.role || "USER"}</strong>
                  </div>
                </article>

                <article>
                  <span><FiUser /></span>
                  <div>
                    <small>User ID</small>
                    <strong>{displayUser.id || displayUser.userId || "N/A"}</strong>
                  </div>
                </article>
              </div>

              {/* Preferences Section */}
              {(displayUser.preferredCity || displayUser.preferredPropertyType || displayUser.preferredListingType || displayUser.maxBudget) && (
                <div className="profile-preferences-section">
                  <h3>
                    <FiMapPin />
                    Search Preferences
                  </h3>

                  <div className="profile-information">
                    {displayUser.preferredCity && (
                      <article>
                        <span><FiMapPin /></span>
                        <div>
                          <small>Preferred City</small>
                          <strong>{displayUser.preferredCity}</strong>
                        </div>
                      </article>
                    )}

                    {displayUser.preferredPropertyType && (
                      <article>
                        <span><FiHome /></span>
                        <div>
                          <small>Property Type</small>
                          <strong>{displayUser.preferredPropertyType}</strong>
                        </div>
                      </article>
                    )}

                    {displayUser.preferredListingType && (
                      <article>
                        <span><FiList /></span>
                        <div>
                          <small>Listing Type</small>
                          <strong>{displayUser.preferredListingType}</strong>
                        </div>
                      </article>
                    )}

                    {displayUser.maxBudget && (
                      <article>
                        <span><FiDollarSign /></span>
                        <div>
                          <small>Max Budget</small>
                          <strong>₹{Number(displayUser.maxBudget).toLocaleString("en-IN")}</strong>
                        </div>
                      </article>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          <div className="profile-actions">
            <Link
              to="/my-bookings"
              className="profile-bookings-button"
            >
              <FiCalendar />
              View My Bookings
            </Link>

            <button
              type="button"
              className="profile-logout-button"
              onClick={handleLogout}
            >
              <FiLogOut />
              Logout
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Profile;