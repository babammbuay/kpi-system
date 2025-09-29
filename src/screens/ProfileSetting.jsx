import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FaBell,
  FaTachometerAlt,
  FaBullseye,
  FaUsers,
  FaCog,
  FaSignOutAlt,
} from "react-icons/fa";

export default function ProfileSetting() {
  const navigate = useNavigate();
  const [cookies, , removeCookie] = useCookies(["jwt"]);
  const [user, setUser] = useState(null);

  const [editMode, setEditMode] = useState(false);

  // Password & Delete Modals
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [activeTab, setActiveTab] = useState("setting");
  const [hoveredTab, setHoveredTab] = useState(null);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  useEffect(() => {
    const verifyUser = async () => {
      try {
        const { data } = await axios.post(
          "https://kpi-system-api.onrender.com/",
          {},
          { withCredentials: true }
        );
        if (!data.status) {
          removeCookie("jwt");
          navigate("/login");
        } else {
          setUser(data.user);
        }
      } catch (err) {
        removeCookie("jwt");
        navigate("/login");
      }
    };
    verifyUser();
  }, [navigate, removeCookie]);

  const logOut = () => {
    removeCookie("jwt");
    navigate("/login");
  };

  // ดึง notifications
  const fetchNotifications = async () => {
    try {
      const { data } = await axios.get(
        "https://kpi-system-api.onrender.com/notificate/user",
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
        `https://kpi-system-api.onrender.com/notificate/read/${id}`,
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

  const handleSave = async () => {
    try {
      const { data } = await axios.put(
        `https://kpi-system-api.onrender.com/profile/${user._id}`,
        {
          username: user.username,
          email: user.email,
          role: user.role,
        },
        { withCredentials: true }
      );
      toast.success(data.message);
      setEditMode(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    }
  };

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
    <div style={{ display: "flex", minHeight: "100vh", background: "#f6eefb" }}>
      <ToastContainer />

      {/* Sidebar */}
      <div
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
        <div style={{ padding: "30px", textAlign: "center" }}>
          <img
            src="/logo.png"
            alt="Logo"
            style={{ width: "100%", maxWidth: "180px", objectFit: "contain" }}
          />
        </div>
        <ul
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
        style={{
          flex: 1,
          marginLeft: "220px",
          padding: "80px 20px 70px",
          background: "#f6eefb",
          minHeight: "100vh",
          width: "calc(100vw - 220px)",
          boxSizing: "border-box",
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

        {/* Profile Section */}
        <div
          style={{
            background: "#f9f9f9c1",
            borderRadius: "12px",
            padding: "20px",
            boxShadow: "0 6px 18px rgba(34,43,63,0.08)",
            marginTop: "16px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "12px",
            }}
          >
            <h2 style={{ fontWeight: "bold" }}>Profile Setting</h2>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center", // ✅ ทำให้ Username–Delete อยู่ตรงกลาง
              gap: "12px",
            }}
          >
            <label>
              Username:
              <input
                type="text"
                value={user?.username || ""}
                disabled={!editMode}
                onChange={(e) => setUser({ ...user, username: e.target.value })}
                style={{ padding: "6px", width: "300px", borderRadius: "6px" }}
              />
            </label>

            <label>
              Email:
              <input
                type="email"
                value={user?.email || ""}
                disabled={!editMode}
                onChange={(e) => setUser({ ...user, email: e.target.value })}
                style={{ padding: "6px", width: "300px", borderRadius: "6px" }}
              />
            </label>

            {user?.role === "admin" && (
              <label>
                Role:
                <select
                  value={user?.role || ""}
                  disabled={!editMode}
                  onChange={(e) => setUser({ ...user, role: e.target.value })}
                  style={{
                    padding: "6px",
                    width: "320px",
                    borderRadius: "6px",
                  }}
                >
                  <option value="admin">Admin</option>
                  <option value="user">User</option>
                </select>
              </label>
            )}
          </div>
          <span
            style={{
              color: "#9236d9",
              cursor: "pointer",
              textDecoration: "underline",
              display: "block",
              textAlign: "center",
              marginTop: "10px",
            }}
            onClick={() => setShowPasswordModal(true)}
          >
            Change Password
          </span>
          <div
            style={{
              marginTop: "20px",
              display: "flex",
              justifyContent: "center",
              gap: "10px",
            }}
          >
            {!editMode ? (
              <button
                onClick={() => setEditMode(true)}
                style={{
                  background: "#9236d9",
                  color: "white",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  border: "none",
                }}
              >
                Edit
              </button>
            ) : (
              <button
                onClick={handleSave}
                style={{
                  background: "#9236d9",
                  color: "white",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  border: "none",
                }}
              >
                Save
              </button>
            )}

            <button
              onClick={() => setShowDeleteModal(true)}
              style={{
                background: "#FF4C4C",
                color: "white",
                padding: "10px 20px",
                borderRadius: "8px",
                border: "none",
              }}
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer
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
        }}
      >
        © {new Date().getFullYear()} Kanyarat Bam Kaewsumran | All rights
        reserved
      </footer>

      {/* Password Modal */}
      {showPasswordModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "white",
              padding: "20px",
              borderRadius: "12px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              width: "320px",
            }}
          >
            <h3 style={{ textAlign: "center", marginBottom: "10px" }}>
              Change Password
            </h3>

            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <input
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button
                onClick={async () => {
                  if (!newPassword || !confirmPassword) {
                    toast.error("Please fill in all fields");
                    return;
                  }

                  if (newPassword !== confirmPassword) {
                    toast.error("New passwords do not match");
                    return;
                  }

                  try {
                    const { data } = await axios.put(
                      "https://kpi-system-api.onrender.com/change-password",
                      { newPassword, confirmPassword }, // ส่งรหัสใหม่
                      { withCredentials: true }
                    );

                    // ✅ แจ้ง success
                    toast.success(data.message);

                    // ✅ Reset input
                    setNewPassword("");
                    setConfirmPassword("");

                    // ✅ ปิด modal
                    setShowPasswordModal(false);

                    // ✅ ถ้าต้องการอัปเดต user state (แม้รหัสผ่านไม่แสดง)
                    setUser((prev) => ({ ...prev })); // placeholder update, รหัสผ่านไม่ถูกเก็บใน state
                  } catch (err) {
                    console.log(err.response?.data);
                    toast.error(
                      err.response?.data?.message || "Password change failed"
                    );
                  }
                }}
                style={{
                  background: "#9236d9",
                  color: "white",
                  border: "none",
                  padding: "6px 12px",
                  borderRadius: "6px",
                }}
              >
                Submit
              </button>

              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setOldPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "white",
              padding: "20px",
              borderRadius: "12px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              width: "300px",
            }}
          >
            <h3>Confirm Delete Account</h3>
            <input
              type="password"
              placeholder="Enter your password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
            />
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button
                onClick={async () => {
                  try {
                    const { data } = await axios.delete(
                      "https://kpi-system-api.onrender.com/delete-account",
                      {
                        data: { password: deletePassword },
                        withCredentials: true,
                      }
                    );
                    toast.success(data.message);
                    removeCookie("jwt");
                    navigate("/login");
                  } catch (err) {
                    toast.error(err.response?.data?.message || "Delete failed");
                  }
                }}
                style={{
                  background: "#FF4C4C",
                  color: "white",
                  border: "none",
                  padding: "6px 12px",
                }}
              >
                Delete
              </button>
              <button onClick={() => setShowDeleteModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
