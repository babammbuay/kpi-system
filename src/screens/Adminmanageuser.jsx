import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCookies } from "react-cookie";
import axios from "axios";
import { toast } from "react-toastify";
import {
  FaBell,
  FaTachometerAlt,
  FaBullseye,
  FaUsers,
  FaCog,
  FaSignOutAlt,
  FaPlus,
  FaEye,
  FaEdit,
  FaTrash,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";

import UserdetailModal from "./component/UserdetailModal";
import UsereditModal from "./component/UsereditModal";
import AdduserModal from "./component/AdduserModal";

export default function Adminmanageuser() {
  const navigate = useNavigate();
  const [cookies, , removeCookie] = useCookies(["jwt"]);
  const [user, setUser] = useState(null);

  const [usersList, setUsersList] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [activeTab, setActiveTab] = useState("users");
  const [hoveredTab, setHoveredTab] = useState(null);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  useEffect(() => {
    const verifyUser = async () => {
      try {
        const { data } = await axios.post(
          "https://kpi-isstest.onrender.com/",
          {},
          { withCredentials: true }
        );
        if (!data.status || data.user.role !== "admin") {
          removeCookie("jwt");
          navigate("/login");
        } else {
          setUser(data.user);
          fetchUsers();
        }
      } catch (err) {
        removeCookie("jwt");
        navigate("/login");
      }
    };
    verifyUser();
  }, [navigate, removeCookie]);

  const fetchUsers = async () => {
    try {
      const { data } = await axios.get(
        "https://kpi-isstest.onrender.com/api/admin/users",
        { withCredentials: true }
      );
      setUsersList(data);
    } catch (err) {
      console.error(err);
    }
  };

  const logOut = () => {
    removeCookie("jwt");
    navigate("/login");
  };

  // ดึง notifications
  const fetchNotifications = async () => {
    try {
      const { data } = await axios.get(
        "https://kpi-isstest.onrender.com/notificate/user",
        {
          withCredentials: true,
        }
      );
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.isRead).length);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(() => {
      fetchNotifications();
    }, 10000); // polling ทุก 10 วิ

    return () => clearInterval(interval);
  }, []);

  // mark notification as read
  const markAsRead = async (id) => {
    try {
      await axios.put(
        `https://kpi-isstest.onrender.com/notificate/read/${id}`,
        {},
        { withCredentials: true }
      );

      // อัปเดต state ทันที
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => prev - 1);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleNotif = () => {
    setIsNotifOpen((prev) => {
      if (!prev) {
        // เปิด dropdown → mark all unread notifications as read
        notifications
          .filter((n) => !n.isRead)
          .forEach((n) => markAsRead(n._id));
      }
      return !prev;
    });
  };

  // คลิกนอก dropdown ปิด
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".notif-wrapper")) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Confirm To Delete User?")) return;
    try {
      await axios.delete(`https://kpi-isstest.onrender.com/api/admin/users/${id}`, {
        withCredentials: true,
      });
      toast.success("User deleted successfully!");
      fetchUsers();
    } catch (err) {
      toast.error("Error deleting user");
    }
  };

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      return (
        (search === "" ||
          u.username?.toLowerCase().includes(search.toLowerCase()) ||
          u.email?.toLowerCase().includes(search.toLowerCase())) &&
        (roleFilter === "" || u.role === roleFilter)
      );
    });
  }, [usersList, search, roleFilter]);

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const currentItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredUsers, currentPage]);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const renderMenuItem = (tab, label, Icon, path) => {
    const isActive = activeTab === tab;
    const isHovered = hoveredTab === tab;

    return (
      <li
        onClick={() => {
          setActiveTab(tab);
          navigate(path);
        }}
        onMouseEnter={() => setHoveredTab(tab)}
        onMouseLeave={() => setHoveredTab(null)}
        className={`sidebar-menu-item ${isActive ? "active" : ""}`}
        style={{
          padding: "12px 20px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          borderLeft:
            isActive || isHovered ? "#9236d9ff 8px solid" : "transparent",
          background: isActive || isHovered ? "#eae2eeff" : "transparent",
          color: isActive || isHovered ? "#9236d9ff" : "grey",
          transition: "0.2s",
        }}
      >
        <Icon color={isActive || isHovered ? "#9236d9ff" : "grey"} />
        <span>{label}</span>
      </li>
    );
  };

  return (
    <div
      className="body"
      style={{ display: "flex", minHeight: "100vh", background: "#f6eefb" }}
    >
      {/* Sidebar */}
      <div
        className="sidebar"
        style={{
          width: "220px",
          background: "#f8f8ff",
          display: "flex",
          flexDirection: "column",
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          borderTopRightRadius: "40px",
          borderBottomRightRadius: "40px",
        }}
      >
        <div
          className="sidebar-logo"
          style={{ padding: "30px", textAlign: "center" }}
        >
          <img
            src="/logo.png"
            alt="Logo"
            style={{ width: "100%", maxWidth: "180px", objectFit: "contain" }}
          />
        </div>
        <ul
          className="sidebar-menu"
          style={{ listStyle: "none", padding: 0, marginTop: "20px", flex: 1 }}
        >
          {renderMenuItem(
            "dashboard",
            "Dashboard",
            FaTachometerAlt,
            "/admin-dashboard"
          )}
          {renderMenuItem("kpi", "Manage KPI", FaBullseye, "/admin-managekpi")}
          {renderMenuItem("users", "Manage User", FaUsers, "/admin-manageuser")}
          {renderMenuItem("setting", "Setting", FaCog, "/profilesetting")}
          <li
            onClick={logOut}
            onMouseEnter={() => setHoveredTab("logout")}
            onMouseLeave={() => setHoveredTab(null)}
            className="sidebar-menu-item logout"
            style={{
              padding: "12px 20px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginTop: "50px",
              borderTop: "solid 1px #8863a4ae",
              borderLeft:
                hoveredTab === "logout" ? "#9236d9ff 8px solid" : "transparent",
              color: hoveredTab === "logout" ? "#9236d9ff" : "grey",
              background: hoveredTab === "logout" ? "#eae2eeff" : "transparent",
              transition: "0.2s",
            }}
          >
            <FaSignOutAlt
              color={hoveredTab === "logout" ? "#9236d9ff" : "grey"}
            />
            <span>Log out</span>
          </li>
        </ul>
      </div>

      {/* Main */}
      <div
        className="main-section"
        style={{
          flex: 1,
          marginLeft: "220px",
          padding: "80px 20px 70px", // top padding = navbar, bottom padding = footer
          background: "#f6eefb",
          minHeight: "100vh",
          width: "calc(100vw - 220px)",
          boxSizing: "border-box",
          overflowY: "auto", // เพิ่มตรงนี้
          overflowX: "auto",
        }}
      >
        {/* Navbar */}
        <div
          className="navbar"
          style={{
            height: "60px",
            background: "#f6eefb",
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            padding: "0 20px",
            position: "fixed",
            top: 0,
            left: "220px",
            right: 0,
            zIndex: 999,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              padding: "10px 20px",
              position: "relative",
            }}
          >
            <div
              className="notif-wrapper"
              style={{ position: "relative", cursor: "pointer" }}
            >
              <FaBell size={24} color="grey" onClick={toggleNotif} />
              {unreadCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: -5,
                    right: -5,
                    background: "red",
                    color: "white",
                    borderRadius: "50%",
                    padding: "2px 6px",
                    fontSize: "12px",
                  }}
                >
                  {unreadCount}
                </span>
              )}
              {isNotifOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: 30,
                    right: 0,
                    width: "300px",
                    maxHeight: "400px",
                    overflowY: "auto",
                    background: "white",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                    borderRadius: "8px",
                    zIndex: 1000,
                  }}
                >
                  {notifications.map((n) => (
                    <div
                      key={n._id}
                      onClick={() => markAsRead(n._id)}
                      style={{
                        padding: "10px",
                        borderBottom: "1px solid #eee",
                        background: n.isRead ? "#f9f9f9" : "#e8f0fe",
                        cursor: "pointer",
                        fontSize: "14px",
                      }}
                    >
                      {n.message}
                      <div style={{ fontSize: "10px", color: "#888" }}>
                        {new Date(n.createdAt).toLocaleString("th-TH", {
                          hour12: false,
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {user && (
            <span
              className="navbar-user"
              style={{ fontWeight: "thin", color: "grey" }}
            >
              {user.username || user.email}
            </span>
          )}
        </div>

        <div
          style={{
            background: "#f9f9f9c1",
            borderRadius: "12px",
            padding: "20px",
            boxShadow: "0 6px 18px rgba(34,43,63,0.08)",
            border: "1px solid rgba(146, 54, 217, 0.06)",
            marginTop: "16px",
            overflow: "hidden",
            maxHeight: "600px",
            overflowY: "auto",
            overflowX: "auto",
            maxWidth: "100%",
          }}
        >
          <div className="breadcrumb-container">
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb">
                <li className="breadcrumb-item">
                  <Link
                    style={{ color: "#9236d9ff", textDecoration: "0px " }}
                    to="/admin-dashboard"
                  >
                    Dashboard
                  </Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  Manage User
                </li>
              </ol>
            </nav>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "12px",
            }}
          >
            <h2 style={{ fontWeight: "bold" }}>Manage User</h2>
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                background: "#9236d9",
                color: "white",
                border: "none",
                padding: "8px 12px",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
              }}
            >
              <FaPlus /> Add User
            </button>
            <AdduserModal
              show={showAddModal}
              onHide={() => setShowAddModal(false)}
              refreshUsers={fetchUsers}
            />
          </div>

          {/* Search & Filters */}
          <div
            style={{
              marginTop: "0px",
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <input
              type="text"
              placeholder="Search user..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                padding: "8px 10px",
                flex: "1",
                borderRadius: "8px",
                border: "1px solid #e2dff2",
                outline: "none",
              }}
            />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              style={{
                padding: "8px",
                borderRadius: "8px",
                border: "1px solid #e2dff2",
              }}
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>
          </div>

          {/* Table */}
          <div className="table-responsive mt-3">
            <table
              className="table table-striped table-hover align-middle"
              style={{ minWidth: "100%" }}
            >
              <thead>
                <tr>
                  <th>#</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Created At</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.length > 0 ? (
                  currentItems.map((u, i) => (
                    <tr key={u._id}>
                      <td>{(currentPage - 1) * itemsPerPage + i + 1}</td>
                      <td>{u.username}</td>
                      <td>{u.email}</td>
                      <td>{u.role}</td>
                      <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td className="text-center">
                        <button
                          className="btn btn-sm btn-outline-primary me-1"
                          onClick={() => {
                            setSelectedUser(u);
                            setShowDetailModal(true);
                          }}
                          title="View"
                        >
                          <FaEye />
                        </button>
                        <button
                          className="btn btn-sm btn-outline-warning me-1"
                          onClick={() => {
                            setSelectedUser(u);
                            setShowEditModal(true);
                          }}
                          title="Edit"
                          disabled={u._id === user?._id} // ปิดปุ่ม edit ของตัวเอง
                        >
                          <FaEdit />
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(u._id)}
                          title="Delete"
                          disabled={u._id === user?._id} // ปิดปุ่ม delete ของตัวเอง
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center text-muted">
                      No data found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div
            style={{
              display: "flex",
              gap: "4px",
              marginTop: "10px",
              justifyContent: "flex-end",
            }}
          >
            {currentPage > 1 && (
              <button
                className="arrow btn btn-light"
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                <FaChevronLeft size={15} />
              </button>
            )}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(
              (pageNumber) => (
                <button
                  key={pageNumber}
                  onClick={() => paginate(pageNumber)}
                  className="btn me-1"
                  style={{
                    backgroundColor:
                      pageNumber === currentPage ? "#9236d9ff" : "#f8f9fa",
                    color: pageNumber === currentPage ? "#fff" : "#000",
                    border: "1px solid #9236d9ff",
                  }}
                >
                  {pageNumber}
                </button>
              )
            )}
            {currentPage < totalPages && (
              <button
                className="arrow btn btn-light"
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                <FaChevronRight size={15} />
              </button>
            )}
          </div>

          {selectedUser && (
            <UserdetailModal
              show={showDetailModal}
              onHide={() => setShowDetailModal(false)}
              user={selectedUser}
            />
          )}
          {selectedUser && (
            <UsereditModal
              show={showEditModal}
              onHide={() => setShowEditModal(false)}
              user={selectedUser}
              onSave={fetchUsers}
            />
          )}
        </div>
      </div>

      <footer
        className="footer"
        style={{
          height: "50px",
          background: "#f6eefb",
          color: "grey",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "fixed",
          bottom: 0,
          left: "220px",
          right: 0,
          zIndex: 999,
        }}
      >
        © {new Date().getFullYear()} Kanyarat Bam Kaewsumran | All rights
        reserved
      </footer>
    </div>
  );
}
