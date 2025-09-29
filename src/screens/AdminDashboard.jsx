import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCookies } from "react-cookie";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
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
import { Bar, Pie } from "react-chartjs-2";
import "chart.js/auto";
import KPIdetailMD from "./component/KPIdetailMD";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [cookies, , removeCookie] = useCookies(["jwt"]);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [hoveredTab, setHoveredTab] = useState(null);
  const [kpiSummary, setKpiSummary] = useState({
    onTrack: 0,
    atRisk: 0,
    offTrack: 0,
  });
  const [taskSummary, setTaskSummary] = useState({
    notStarted: 0,
    inProgress: 0,
    completed: 0,
  });
  const [kpiList, setKpiList] = useState([]);
  const [filterPeriod, setFilterPeriod] = useState("today"); // today, weekly, monthly, yearly

  const [kpis, setKpis] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [taskStatusFilter, setTaskStatusFilter] = useState("");

  const [selectedKpi, setSelectedKpi] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [currentTime, setCurrentTime] = useState(new Date());

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
          "https://kpi-system-api.onrender.com/",
          {},
          { withCredentials: true }
        );

        if (!data.status || data.user.role !== "admin") {
          removeCookie("jwt");
          navigate("/login");
        } else {
          setUser(data.user);
          // toast logic
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

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // อัปเดตทุก 1 วินาที

    return () => clearInterval(timer); // clear timer เมื่อ component unmount
  }, []);

  // แปลงเวลาเป็น string พร้อม timezone (ตัวอย่างใช้ Bangkok, Thailand)
  const timeString = currentTime.toLocaleString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Asia/Bangkok",
  });

  const logOut = () => {
    removeCookie("jwt");
    navigate("/login");
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

  useEffect(() => {
    fetchKPIs();
  }, []);
  const fetchKPIs = async () => {
    try {
      const { data } = await axios.get(
        "https://kpi-system-api.onrender.com/api/admin/getKpis",
        { withCredentials: true }
      );
      setKpis(data);
    } catch (err) {
      console.error("Error fetching KPIs", err);
    }
  };

  // Filtered KPIs
  const filteredKPIs = useMemo(() => {
    return kpis.filter((k) => {
      return (
        (search === "" ||
          k.title.toLowerCase().includes(search.toLowerCase()) ||
          k.description.toLowerCase().includes(search.toLowerCase())) &&
        (roleFilter === "" ||
          k.assigned_users?.some((u) => u.role === roleFilter)) &&
        (statusFilter === "" || k.status_kpi === statusFilter) &&
        (taskStatusFilter === "" || k.status_task === taskStatusFilter)
      );
    });
  }, [kpis, search, roleFilter, statusFilter, taskStatusFilter]);

  // Pagination logic
  const totalPages = Math.ceil(filteredKPIs.length / itemsPerPage);
  const currentItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredKPIs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredKPIs, currentPage]);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const fetchDashboardData = async () => {
    try {
      const { data } = await axios.get(
        `https://kpi-system-api.onrender.com/api/admin/admin-dashboard?period=${filterPeriod}`,
        { withCredentials: true }
      );

      // สมมติ backend ส่งข้อมูลตามโครงสร้างนี้
      setKpiSummary(data.kpiSummary);
      setTaskSummary(data.taskSummary);
      setKpiList(data.kpis);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [filterPeriod]);

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
            maxHeight: "600px",
            overflowY: "auto",
            overflowX: "auto",
            maxWidth: "100%",
          }}
        >
          <div style={{ padding: "20px" }}>
            {/* Greeting & Time */}
            <p>Hello {user?.username || user?.email || "Loading..."}</p>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
                flexWrap: "wrap",
              }}
            >
              <h2 style={{ fontWeight: "bold" }}>Dashboard</h2>
              <div style={{ fontWeight: "bold", color: "#555" }}>
                {timeString}
              </div>
            </div>

            {/* Filter Period */}
            <div
              style={{
                marginBottom: "20px",
                display: "flex",
                flexWrap: "wrap",
                gap: "10px",
              }}
            >
              <select
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value)}
                style={{
                  padding: "8px",
                  borderRadius: "8px",
                  minWidth: "120px",
                }}
              >
                <option value="today">Today</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            {/* Top Cards */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
              {/* KPI Overview Status */}
              <div
                style={{
                  flex: "1 1 300px",
                  background: "#fff",
                  padding: "20px",
                  borderRadius: "12px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                }}
              >
                <h5>KPI Overview Status</h5>
                <Pie
                  data={{
                    labels: ["On Track", "At Risk", "Off Track"],
                    datasets: [
                      {
                        data: [
                          kpiSummary.onTrack,
                          kpiSummary.atRisk,
                          kpiSummary.offTrack,
                        ],
                        backgroundColor: ["#52c41a", "#faad14", "#ff4d4f"],
                      },
                    ],
                  }}
                />
              </div>

              {/* KPI Status Count */}
              <div
                style={{
                  flex: "1 1 300px",
                  background: "#fff",
                  padding: "20px",
                  borderRadius: "12px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                }}
              >
                <h5>KPI Status Count</h5>
                <Bar
                  data={{
                    labels: ["On Track", "At Risk", "Off Track"],
                    datasets: [
                      {
                        label: "KPI Count",
                        data: [
                          kpiSummary.onTrack,
                          kpiSummary.atRisk,
                          kpiSummary.offTrack,
                        ],
                        backgroundColor: ["#52c41a", "#faad14", "#ff4d4f"],
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    plugins: { legend: { display: false } },
                  }}
                />
              </div>

              {/* Task Status Count */}
              <div
                style={{
                  flex: "1 1 300px",
                  background: "#fff",
                  padding: "20px",
                  borderRadius: "12px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                }}
              >
                <h5>Task Status Count</h5>
                <Bar
                  data={{
                    labels: ["Not Started", "In Progress", "Completed"],
                    datasets: [
                      {
                        label: "Task Count",
                        data: [
                          taskSummary.notStarted,
                          taskSummary.inProgress,
                          taskSummary.completed,
                        ],
                        backgroundColor: ["#074985ff", "#019d90ff", "#52c41a"],
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    plugins: { legend: { display: false } },
                  }}
                />
              </div>
            </div>

            {/* Table */}
            <div
              style={{
                marginTop: "16px",
                background: "#f9f9f9c1",
                borderRadius: "12px",
                padding: "20px",
                overflowX: "auto",
                maxWidth: "100%",
              }}
            >
              {/* Filters */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "10px",
                  marginBottom: "12px",
                }}
              >
                <input
                  type="text"
                  placeholder="Search KPI..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    flex: "1 1 200px",
                    padding: "8px",
                    borderRadius: "8px",
                  }}
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{
                    flex: "1 1 150px",
                    padding: "8px",
                    borderRadius: "8px",
                  }}
                >
                  <option value="">All Status KPI</option>
                  <option value="On Track">On Track</option>
                  <option value="At Risk">At Risk</option>
                  <option value="Off Track">Off Track</option>
                </select>
                <select
                  value={taskStatusFilter}
                  onChange={(e) => setTaskStatusFilter(e.target.value)}
                  style={{
                    flex: "1 1 150px",
                    padding: "8px",
                    borderRadius: "8px",
                  }}
                >
                  <option value="">All Task Status</option>
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <table className="table table-striped table-hover align-middle">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Title</th>
                    <th>Description</th>
                    <th>Target</th>
                    <th>Actual</th>
                    <th>Unit</th>
                    <th>Status KPI</th>
                    <th>Task Status</th>
                    <th>Assigned Users</th>
                    <th>Created By</th>
                    <th>Start - End</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.length > 0 ? (
                    currentItems.map((kpi, i) => (
                      <tr key={kpi._id}>
                        <td>{(currentPage - 1) * itemsPerPage + i + 1}</td>
                        <td>{kpi.title}</td>
                        <td>{kpi.description}</td>
                        <td>{kpi.target_value}</td>
                        <td>{kpi.actual_value ?? "-"}</td>
                        <td>{kpi.unit}</td>
                        <td>{kpi.status_kpi}</td>
                        <td>{kpi.status_task}</td>
                        <td>
                          {kpi.assigned_users?.map((u) => u.email).join(", ")}
                        </td>
                        <td>
                          {kpi.created_by?.username ?? kpi.created_by?.email}
                        </td>
                        <td>
                          {new Date(kpi.start_date).toLocaleDateString()} -{" "}
                          {new Date(kpi.end_date).toLocaleDateString()}
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-outline-primary me-1"
                            onClick={() => {
                              setSelectedKpi(kpi);
                              setShowDetailModal(true);
                            }}
                            title="ดู"
                          >
                            <FaEye />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="12" className="text-center text-muted">
                        ไม่พบข้อมูล
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Pagination */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "4px",
                  marginTop: "10px",
                  flexWrap: "wrap",
                }}
              >
                {currentPage > 1 && (
                  <button
                    className="btn btn-light"
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    <FaChevronLeft />
                  </button>
                )}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (pageNumber) => (
                    <button
                      key={pageNumber}
                      onClick={() => paginate(pageNumber)}
                      className="btn"
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
                    className="btn btn-light"
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    <FaChevronRight />
                  </button>
                )}
              </div>
              {/* Detail Modal */}
              {selectedKpi && (
                <KPIdetailMD
                  show={showDetailModal}
                  onHide={() => setShowDetailModal(false)}
                  kpi={selectedKpi}
                />
              )}
            </div>
          </div>
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
