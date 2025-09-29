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

import KPIdetailMD from "./component/KPIdetailMD";
import AdminKPIEditMD from "./component/AdminKPIEditMD";
import AddKpiModal from "./component/AddKpiModal";

export default function UserManagekpi() {
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

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

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



  // Filtered KPIs
  const filteredKPIs = useMemo(() => {
    return kpis.filter((k) => {
      return (
        (search === "" ||
          k.title.toLowerCase().includes(search.toLowerCase()) ||
          k.description.toLowerCase().includes(search.toLowerCase())) &&
        (statusFilter === "" || k.status_kpi === statusFilter) &&
        (taskStatusFilter === "" || k.status_task === taskStatusFilter)
      );
    });
  }, [kpis, search, statusFilter, taskStatusFilter]);

  // Pagination logic
  const totalPages = Math.ceil(filteredKPIs.length / itemsPerPage);
  const currentItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredKPIs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredKPIs, currentPage]);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

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
                <li className="breadcrumb-item active" aria-current="page">
                  Manage KPI
                </li>
              </ol>
            </nav>
          </div>

          <h2 style={{ fontWeight: "bold", marginBottom: "12px" }}>
            Manage KPI
          </h2>

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
              placeholder="Search KPI..."
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
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: "8px",
                borderRadius: "8px",
                border: "1px solid #e2dff2",
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
                padding: "8px",
                borderRadius: "8px",
                border: "1px solid #e2dff2",
              }}
            >
              <option value="">All Task Status</option>
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          {/* Table */}
          <div className="table-responsive mt-3" style={{ marginTop: "18px" }}>
            <table
              className="table table-striped table-hover align-middle"
              style={{ minWidth: "100%" }}
            >
              <thead>
                <tr>
                  <th>#</th>
                  <th>Title</th>
                  <th>Description</th>
                  <th>Target Value</th>
                  <th>Actual Value</th>
                  <th>Unit</th>
                  <th>Status KPI</th>
                  <th>Task Status</th>
                  <th>Start - End</th>
                  <th className="text-center"></th>
                </tr>
              </thead>
              <tbody>
                {currentItems.length > 0 ? (
                  currentItems.map((kpi, i) => {
                    // ฟังก์ชันกำหนดสีพื้นหลัง status KPI
                    const getKpiStatusStyle = (status) => {
                      switch (status) {
                        case "Off Track":
                          return { backgroundColor: "#ff4d4f", color: "white" }; // แดง
                        case "At Risk":
                          return { backgroundColor: "#faad14", color: "white" }; // เหลือง
                        case "On Track":
                          return { backgroundColor: "#52c41a", color: "white" }; // เขียว
                        default:
                          return { backgroundColor: "#d9d9d9", color: "#000" }; // เทา
                      }
                    };

                    // ฟังก์ชันกำหนดสีพื้นหลัง task status
                    const getTaskStatusStyle = (status) => {
                      switch (status) {
                        case "Not Started":
                          return { backgroundColor: "#074985ff", color: "white" }; // น้ำเงิน
                        case "In Progress":
                          return { backgroundColor: "#019d90ff", color: "white" }; // เขียวน้ำเงิน
                        case "Completed":
                          return { backgroundColor: "#52c41a", color: "white" }; // เขียว
                        default:
                          return { backgroundColor: "#d9d9d9", color: "#000" }; // เทา
                      }
                    };

                    return (
                      <tr key={kpi._id}>
                        <td>{(currentPage - 1) * itemsPerPage + i + 1}</td>
                        <td>{kpi.title}</td>
                        <td>{kpi.description}</td>
                        <td>{kpi.target_value}</td>
                        <td>{kpi.actual_value ?? "-"}</td>
                        <td>{kpi.unit}</td>
                        <td>
                          <span
                            style={{
                              ...getKpiStatusStyle(kpi.status_kpi),
                              padding: "4px 8px",
                              borderRadius: "12px",
                              fontWeight: "bold",
                              display: "inline-block",
                              minWidth: "80px",
                              textAlign: "center",
                            }}
                          >
                            {kpi.status_kpi ?? "-"}
                          </span>
                        </td>
                        <td>
                          <span
                            style={{
                              ...getTaskStatusStyle(kpi.status_task),
                              padding: "4px 8px",
                              borderRadius: "12px",
                              fontWeight: "bold",
                              display: "inline-block",
                              minWidth: "80px",
                              textAlign: "center",
                            }}
                          >
                            {kpi.status_task ?? "-"}
                          </span>
                        </td>
                        <td>
                          {new Date(kpi.start_date).toLocaleDateString()} -{" "}
                          {new Date(kpi.end_date).toLocaleDateString()}
                        </td>
                        <td className="text-center">
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
                          <button
                            className="btn btn-sm btn-outline-warning"
                            onClick={() =>
                              navigate("/user-updatekpi", { state: { kpi } })
                            }
                            title="อัปเดต KPI"
                          >
                            <FaEdit />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="10" className="text-center text-muted">
                      ไม่พบข้อมูล
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div
            className="pagination"
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
