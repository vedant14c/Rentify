import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link } from "react-router-dom";
import {
  FiArrowLeft,
  FiBriefcase,
  FiCheckCircle,
  FiEye,
  FiMail,
  FiPhone,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiUser,
  FiUsers,
  FiXCircle,
} from "react-icons/fi";
import {
  getAllUsersForAdmin,
  updateUserRole,
  updateUserStatus,
} from "../services/adminService";
import UserDetailsModal from "../components/UserDetailsModal";
import "../css/adminUsers.css";

function getUserId(user) {
  return user.userId ?? user.id;
}

function getUserRole(user) {
  return String(user.role || "USER").toUpperCase();
}

function getIsActive(user) {
  return user.isActive !== false;
}

function getInitials(name = "User") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function getErrorMessage(error) {
  const responseData = error.response?.data;

  if (typeof responseData === "string") {
    return responseData;
  }

  if (responseData?.message) {
    return responseData.message;
  }

  if (!error.response) {
    return "Cannot connect to the backend. Make sure Spring Boot is running.";
  }

  return "Unable to complete the request. Please try again.";
}

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] =
    useState("ALL");
  const [statusFilter, setStatusFilter] =
    useState("ALL");

  const [loading, setLoading] = useState(true);
  const [statusActionId, setStatusActionId] =
    useState(null);
  const [roleActionId, setRoleActionId] =
    useState(null);

  const [selectedUser, setSelectedUser] = useState(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] =
    useState("");

  const currentUserId = Number(
    localStorage.getItem("userId")
  );

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getAllUsersForAdmin();

      setUsers(
        Array.isArray(response) ? response : []
      );
    } catch (requestError) {
      console.error(
        "Admin users loading error:",
        requestError
      );

      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const displayableUsers = useMemo(() => {
    return users.filter(
      (user) => getUserRole(user) !== "ADMIN"
    );
  }, [users]);

  const statistics = useMemo(() => {
    return {
      total: displayableUsers.length,

      users: displayableUsers.filter(
        (user) => getUserRole(user) === "USER"
      ).length,

      owners: displayableUsers.filter(
        (user) => getUserRole(user) === "OWNER"
      ).length,

      active: displayableUsers.filter(getIsActive).length,

      inactive: displayableUsers.filter(
        (user) => !getIsActive(user)
      ).length,
    };
  }, [displayableUsers]);

  const filteredUsers = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return displayableUsers.filter((user) => {
      const role = getUserRole(user);
      const active = getIsActive(user);

      const matchesRole =
        roleFilter === "ALL" ||
        role === roleFilter;

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && active) ||
        (statusFilter === "INACTIVE" && !active);

      const matchesSearch =
        !searchText ||
        String(user.name || "")
          .toLowerCase()
          .includes(searchText) ||
        String(user.email || "")
          .toLowerCase()
          .includes(searchText) ||
        String(user.phone || "")
          .toLowerCase()
          .includes(searchText) ||
        String(getUserId(user)).includes(searchText);

      return (
        matchesRole &&
        matchesStatus &&
        matchesSearch
      );
    });
  }, [
    displayableUsers,
    search,
    roleFilter,
    statusFilter,
  ]);

  const handleStatusChange = async (user) => {
    const userId = getUserId(user);
    const currentlyActive = getIsActive(user);
    const newStatus = !currentlyActive;

    if (
      userId === currentUserId &&
      !newStatus
    ) {
      setError(
        "You cannot deactivate your own admin account."
      );
      return;
    }

    const confirmed = window.confirm(
      newStatus
        ? `Activate ${user.name}'s account?`
        : `Deactivate ${user.name}'s account?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setStatusActionId(userId);
      setError("");
      setSuccessMessage("");

      const updatedUser = await updateUserStatus(
        userId,
        newStatus
      );

      setUsers((previousUsers) =>
        previousUsers.map((item) =>
          getUserId(item) === userId
            ? {
                ...item,
                ...updatedUser,
                isActive: newStatus,
              }
            : item
        )
      );

      setSuccessMessage(
        newStatus
          ? `${user.name}'s account was activated successfully.`
          : `${user.name}'s account was deactivated successfully.`
      );
    } catch (requestError) {
      console.error(
        "User status update error:",
        requestError
      );

      setError(getErrorMessage(requestError));
    } finally {
      setStatusActionId(null);
    }
  };

  const handleRoleChange = async (
    user,
    newRole
  ) => {
    const userId = getUserId(user);
    const currentRole = getUserRole(user);

    if (newRole === currentRole) {
      return;
    }

    if (
      userId === currentUserId &&
      newRole !== "ADMIN"
    ) {
      setError(
        "You cannot remove your own ADMIN role."
      );
      return;
    }

    const confirmed = window.confirm(
      `Change ${user.name}'s role from ${currentRole} to ${newRole}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setRoleActionId(userId);
      setError("");
      setSuccessMessage("");

      const updatedUser = await updateUserRole(
        userId,
        newRole
      );

      setUsers((previousUsers) =>
        previousUsers.map((item) =>
          getUserId(item) === userId
            ? {
                ...item,
                ...updatedUser,
                role: newRole,
              }
            : item
        )
      );

      setSuccessMessage(
        `${user.name}'s role was changed to ${newRole}.`
      );
    } catch (requestError) {
      console.error(
        "User role update error:",
        requestError
      );

      setError(getErrorMessage(requestError));
    } finally {
      setRoleActionId(null);
    }
  };

  return (
    <main className="admin-users-page">
      <section className="admin-users-hero">
        <div className="container admin-users-hero-content">
          <div>
            <Link
              to="/admin-dashboard"
              className="admin-users-back-link"
            >
              <FiArrowLeft />
              Property Management
            </Link>

            <span className="admin-users-label">
              <FiShield />
              ADMIN CONTROL PANEL
            </span>

            <h1>User Management</h1>

            <p>
              Manage user roles and account access.
            </p>
          </div>

          <button
            type="button"
            className="admin-users-refresh-button"
            onClick={loadUsers}
            disabled={loading}
          >
            <FiRefreshCw />
            Refresh Users
          </button>
        </div>
      </section>

      <section className="container admin-users-content">
        <div className="admin-users-statistics">
          <article>
            <span className="admin-users-stat-icon total">
              <FiUsers />
            </span>

            <div>
              <p>Total Accounts</p>
              <strong>{statistics.total}</strong>
            </div>
          </article>

          <article>
            <span className="admin-users-stat-icon users">
              <FiUser />
            </span>

            <div>
              <p>Users (Tenants)</p>
              <strong>{statistics.users}</strong>
            </div>
          </article>

          <article>
            <span className="admin-users-stat-icon owners">
              <FiBriefcase />
            </span>

            <div>
              <p>Owners</p>
              <strong>{statistics.owners}</strong>
            </div>
          </article>
        </div>

        <div className="admin-account-status-summary">
          <span>
            <FiCheckCircle />
            Active accounts:
            <strong>{statistics.active}</strong>
          </span>

          <span>
            <FiXCircle />
            Inactive accounts:
            <strong>{statistics.inactive}</strong>
          </span>
        </div>

        {error && (
          <div className="admin-users-error">
            <FiXCircle />
            {error}
          </div>
        )}

        {successMessage && (
          <div className="admin-users-success">
            <FiCheckCircle />
            {successMessage}
          </div>
        )}

        <div className="admin-users-panel">
          <div className="admin-users-heading">
            <div>
              <h2>Registered Accounts</h2>

              <p>
                {filteredUsers.length} accounts found
              </p>
            </div>
          </div>

          <div className="admin-users-toolbar">
            <div className="admin-users-search">
              <FiSearch />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search name, email, phone or ID..."
              />
            </div>

            <select
              value={roleFilter}
              onChange={(event) =>
                setRoleFilter(event.target.value)
              }
            >
              <option value="ALL">All roles</option>
              <option value="USER">Users</option>
              <option value="OWNER">Owners</option>
            </select>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
            >
              <option value="ALL">All statuses</option>
              <option value="ACTIVE">
                Active accounts
              </option>
              <option value="INACTIVE">
                Inactive accounts
              </option>
            </select>
          </div>

          {loading ? (
            <div className="admin-users-empty">
              <FiRefreshCw className="admin-users-loading-icon" />

              <h2>Loading users...</h2>

              <p>
                Please wait while users are loading.
              </p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="admin-users-empty">
              <FiUsers />

              <h2>No users found</h2>

              <p>
                Try another search or filter.
              </p>
            </div>
          ) : (
            <div className="admin-users-table-wrapper">
              <table className="admin-users-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Contact Information</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>User ID</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredUsers.map((user) => {
                    const userId = getUserId(user);
                    const role = getUserRole(user);
                    const active = getIsActive(user);

                    const isCurrentAccount =
                      userId === currentUserId;

                    const updatingStatus =
                      statusActionId === userId;

                    const updatingRole =
                      roleActionId === userId;

                    return (
                      <tr key={userId}>
                        <td>
                          <div
                            className="admin-user-identity"
                            style={{ cursor: "pointer" }}
                            onClick={() => setSelectedUser(user)}
                          >
                            <span
                              className={`admin-user-avatar ${role.toLowerCase()}`}
                            >
                              {getInitials(user.name)}
                            </span>

                            <div>
                              <strong className="user-name-link">
                                {user.name ||
                                  "Unnamed user"}
                              </strong>

                              <small>
                                {isCurrentAccount
                                  ? "Your account"
                                  : "Registered account"}
                              </small>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div className="admin-user-contact">
                            <span>
                              <FiMail />
                              {user.email ||
                                "Email unavailable"}
                            </span>

                            <span>
                              <FiPhone />
                              {user.phone ||
                                "Phone not provided"}
                            </span>
                          </div>
                        </td>

                        <td>
                            <select
                              className={`admin-role-select ${role.toLowerCase()}`}
                              value={role}
                              onChange={(event) =>
                                handleRoleChange(
                                  user,
                                  event.target.value
                                )
                              }
                              disabled={updatingRole}
                            >
                              <option value="USER">
                                USER
                              </option>

                              <option value="OWNER">
                                OWNER
                              </option>
                            </select>
                        </td>

                        <td>
                          <span
                            className={`admin-user-status ${
                              active
                                ? "active"
                                : "inactive"
                            }`}
                          >
                            {active ? (
                              <FiCheckCircle />
                            ) : (
                              <FiXCircle />
                            )}

                            {active
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </td>

                        <td>
                          <span className="admin-user-id">
                            #{userId}
                          </span>
                        </td>

                        <td>
                          <div className="admin-user-actions-cell">
                            <button
                              type="button"
                              className="admin-user-action-button activate"
                              onClick={() => setSelectedUser(user)}
                              title="View Account Details"
                            >
                              <FiEye style={{ marginRight: "4px" }} />
                              View Details
                            </button>

                            {isCurrentAccount ? (
                              <button
                                type="button"
                                className="admin-user-action-button current"
                                disabled
                              >
                                Current Account
                              </button>
                            ) : (
                              <button
                                type="button"
                                className={`admin-user-action-button ${
                                  active
                                    ? "deactivate"
                                    : "activate"
                                }`}
                                onClick={() =>
                                  handleStatusChange(user)
                                }
                                disabled={
                                  updatingStatus ||
                                  updatingRole
                                }
                              >
                                {updatingStatus
                                  ? "Updating..."
                                  : active
                                    ? "Deactivate"
                                    : "Activate"}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onStatusChange={handleStatusChange}
          onRoleChange={handleRoleChange}
          currentUserId={currentUserId}
        />
      )}
    </main>
  );
}

export default AdminUsers;