import React, { useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
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

import KPIdetailMD from "./component/KPIdetailMD";
import AdminKPIEditMD from "./component/AdminKPIEditMD";
import AddKpiModal from "./component/AddKpiModal";

export default function UserUpdateKPI() {
  const location = useLocation();
  const navigate = useNavigate();
  const [cookies, , removeCookie] = useCookies(["jwt"]);
  const [user, setUser] = useState(null);

  const [kpis, setKpis] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [taskStatusFilter, setTaskStatusFilter] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedKpi, setSelectedKpi] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [activeTab, setActiveTab] = useState("kpi");
  const [hoveredTab, setHoveredTab] = useState(null);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const [taskStatusUpdates, setTaskStatusUpdates] = useState({});
  const [actualValues, setActualValues] = useState({});
  const [comments, setComments] = useState({});

  const { kpi } = location.state || {};

  useEffect(() => {
    const verifyUser = async () => {
      try {
        const { data } = await axios.post(
          "http://localhost:5000/",
          {},
          { withCredentials: true }
        );
        if (!data.status || data.user.role !== "user") {
          removeCookie("jwt");
          navigate("/login");
        } else {
          setUser(data.user);
          fetchKPIs();
        }
      } catch (err) {
        removeCookie("jwt");
        navigate("/login");
      }
    };
    verifyUser();
  }, [navigate, removeCookie]);

  // ดึง notifications
  const fetchNotifications = async () => {
    try {
      const { data } = await axios.get(
        "http://localhost:5000/notificate/user",
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
        `http://localhost:5000/notificate/read/${id}`,
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

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // อัปเดตทุก 1 วินาที

    return () => clearInterval(timer); // clear timer เมื่อ component unmount
  }, []);

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

  const fetchKPIs = async () => {
    try {
      const { data } = await axios.get("http://localhost:5000/user/kpis", {
        withCredentials: true,
      });
      setKpis(data);
    } catch (err) {
      console.error("Error fetching KPIs", err);
    }
  };

  const logOut = () => {
    removeCookie("jwt");
    navigate("/login");
  };

  useEffect(() => {
    if (!kpi) {
      // ถ้าเข้ามาหน้านี้โดยไม่กดจากหน้าเดิม → กลับไป
      navigate("/user-managekpi");
    }
  }, [kpi, navigate]);

  const handleUpdateKPI = async (kpi) => {
    try {
      const updatedTaskStatus = taskStatusUpdates[kpi._id] || kpi.status_task;
      const updatedActualValue = actualValues[kpi._id] ?? kpi.actual_value;
      const comment = comments[kpi._id] || "";

      // คำนวณ Status KPI
      const statusKPI =
        updatedActualValue >= kpi.target_value
          ? "On Track"
          : updatedActualValue >= kpi.target_value * 0.75
          ? "At Risk"
          : "Off Track";

      // ส่งไป backend
      await axios.post(
        "http://localhost:5000/user/kpi/update",
        {
          kpi_id: kpi._id,
          status_task: updatedTaskStatus,
          actual_value: updatedActualValue,
          status_kpi: statusKPI,
          comment,
        },
        { withCredentials: true }
      );

      toast.success("KPI updated successfully!");

      if (statusKPI === "At Risk") {
        toast.warning(`KPI "${kpi.title}" is At Risk!`);
      }

      // กลับไปหน้าก่อนหน้า
      navigate("/user-managekpi");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update KPI");
    }
  };

  const renderMenuItem = (tab, label, Icon, path) => {
    const isActive = activeTab === tab;
    const isHovered = hoveredTab === tab;

    return (
      <li
        onClick={() => {
          setActiveTab(tab);
          navigate(path); // 👈 ไปยังเส้นทางที่กำหนด
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
            "/user-dashboard"
          )}
          {renderMenuItem("kpi", "Manage KPI", FaBullseye, "/user-managekpi")}
          {renderMenuItem("setting", "Setting", FaCog, "/user-profile")}
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
                    to="/user-dashboard"
                  >
                    Dashboard
                  </Link>
                </li>
                <li className="breadcrumb-item">
                  <Link
                    style={{ color: "#9236d9ff", textDecoration: "0px " }}
                    to="/user-managekpi"
                  >
                    Manage KPI
                  </Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  Progress KPI
                </li>
              </ol>
            </nav>
          </div>

          <h2 style={{ fontWeight: "bold", marginBottom: "12px" }}>
            Progress KPI
          </h2>
          <div style={{ marginTop: "20px" }}>
            {kpi && (
              <form>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">KPI Title</label>
                    <input
                      type="text"
                      className="form-control"
                      value={kpi.title}
                      disabled
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">Assigned By (Admin)</label>
                    <input
                      type="text"
                      className="form-control"
                      value={kpi.created_by?.username || "N/A"}
                      disabled
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={kpi.description}
                    disabled
                  ></textarea>
                </div>

                <div className="row">
                  <div className="col-md-4 mb-3">
                    <label className="form-label">Target Value</label>
                    <input
                      type="number"
                      className="form-control"
                      value={kpi.target_value}
                      disabled
                    />
                  </div>

                  <div className="col-md-4 mb-3">
                    <label className="form-label">Unit</label>
                    <input
                      type="text"
                      className="form-control"
                      value={kpi.unit || "N/A"}
                      disabled
                    />
                  </div>

                  <div className="col-md-4 mb-3">
                    <label className="form-label">Status KPI</label>
                    <input
                      type="text"
                      className="form-control"
                      value={kpi.status_kpi}
                      disabled
                    />
                  </div>
                </div>

                <hr />

                <div className="row">
                  <div className="col-md-4 mb-3">
                    <label className="form-label">Task Status</label>
                    <select
                      className="form-select"
                      value={taskStatusUpdates[kpi._id] || kpi.status_task}
                      onChange={(e) =>
                        setTaskStatusUpdates((prev) => ({
                          ...prev,
                          [kpi._id]: e.target.value,
                        }))
                      }
                    >
                      <option value="Not Started">Not Started</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>

                  <div className="col-md-4 mb-3">
                    <label className="form-label">Actual Value</label>
                    <input
                      type="number"
                      className="form-control"
                      value={actualValues[kpi._id] ?? kpi.actual_value}
                      onChange={(e) =>
                        setActualValues((prev) => ({
                          ...prev,
                          [kpi._id]: Number(e.target.value),
                        }))
                      }
                    />
                  </div>

                  <div className="col-md-4 mb-3">
                    <label className="form-label">Comment</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Add comment..."
                      value={comments[kpi._id] || ""}
                      onChange={(e) =>
                        setComments((prev) => ({
                          ...prev,
                          [kpi._id]: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end", // ดันปุ่มไปด้านขวา
                    gap: "10px",
                    marginTop: "20px",
                  }}
                >
                  <button
                    type="button"
                    style={{
                      backgroundColor: "#9236d9ff",
                      borderColor: "#9236d9ff",
                      color: "white",
                      padding: "8px 16px",
                      borderRadius: "6px",
                      fontWeight: "500",
                      border: "1px solid #9236d9ff",
                    }}
                    onClick={() => handleUpdateKPI(kpi)}
                  >
                    Update KPI
                  </button>

                  <button
                    type="button"
                    style={{
                      color: "#9236d9ff",
                      border: "1px solid #9236d9ff",
                      padding: "8px 16px",
                      borderRadius: "6px",
                      fontWeight: "500",
                      backgroundColor: "white",
                    }}
                    onClick={() => navigate("/user-managekpi")}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
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
