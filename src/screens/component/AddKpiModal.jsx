import React, { useEffect, useState } from "react";
import { Modal, Button, Form, ListGroup, Badge } from "react-bootstrap";
import axios from "axios";

export default function AddKpiModal({ show, onHide, refreshKPIs }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [users, setUsers] = useState([]);
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [targetValue, setTargetValue] = useState("");
  const [unit, setUnit] = useState("unit");
  const [currentTime, setCurrentTime] = useState(new Date());

  // ดึง user ทุกครั้งที่เปิด modal
  useEffect(() => {
    if (show) fetchUsers();
  }, [show]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // อัปเดตทุกวินาที
    return () => clearInterval(timer);
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await axios.get(
        "https://kpi-isstest.onrender.com/api/admin/users",
        { withCredentials: true }
      );
      console.log("Fetched users:", data);

      // ตรวจสอบ data เป็น array และ filter เฉพาะ role user
      if (Array.isArray(data)) {
        setUsers(data.filter((u) => u.role === "user"));
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.error("fetchUsers error:", err);
      setUsers([]);
    }
  };

  // assign/unassign user
  const handleAssign = (userId) => {
    if (assignedUsers.includes(userId)) {
      setAssignedUsers(assignedUsers.filter((id) => id !== userId));
    } else {
      setAssignedUsers([...assignedUsers, userId]);
    }
  };

  // assign/unassign all
  const handleAssignAll = () => {
    if (assignedUsers.length === users.length) {
      setAssignedUsers([]);
    } else {
      setAssignedUsers(users.map((u) => u._id));
    }
  };

  // submit KPI
  const handleSubmit = async () => {
    if (
      !title ||
      !description ||
      !startDate ||
      !endDate ||
      !targetValue ||
      assignedUsers.length === 0
    ) {
      alert("Please Input All Information");
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post(
        "https://kpi-isstest.onrender.com/api/admin/createKpi",
        {
          title,
          description,
          start_date: startDate,
          end_date: endDate,
          target_value: Number(targetValue),
          unit,
          assignedUsers,
        },
        { withCredentials: true }
      );

      // ส่ง notification ไปยังผู้ใช้แต่ละคน
      //   await axios.post(
      //     "https://kpi-isstest.onrender.com/api/admin/notify",
      //     { kpiId: data._id, userIds: assignedUsers },
      //     { withCredentials: true }
      //   );

      alert("Create KPI Success!");

      // รีเซ็ต form
      setTitle("");
      setDescription("");
      setStartDate("");
      setEndDate("");
      setTargetValue("");
      setUnit("unit");
      setAssignedUsers([]);
      setSearch("");

      onHide();

      if (refreshKPIs) refreshKPIs(); // reload table
    } catch (err) {
      console.error("handleSubmit error:", err);
      alert("เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  // กรอง user ตาม search
  const filteredUsers = Array.isArray(users)
    ? users.filter(
        (u) =>
          (u.username || "").toLowerCase().includes(search.toLowerCase()) ||
          (u.email || "").toLowerCase().includes(search.toLowerCase())
      )
    : [];

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <div>
          <Modal.Title>Add KPI</Modal.Title>
          <div style={{ fontSize: "14px", color: "gray", marginTop: "4px" }}>
            
            {currentTime.toLocaleTimeString([], { hour12: false })}
          </div>
        </div>
      </Modal.Header>

      <Modal.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Title</Form.Label>
            <Form.Control
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="KPI Title"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="KPI Description"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Target Value</Form.Label>
            <div style={{ display: "flex", gap: "10px" }}>
              <Form.Control
                type="number"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                placeholder="target value"
              />
              <Form.Select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              >
                <option value="unit">unit</option>
                <option value="percentage">percentage</option>
                <option value="bath">bath</option>
                <option value="people">people</option>
              </Form.Select>
            </div>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Start Date</Form.Label>
            <Form.Control
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>End Date</Form.Label>
            <Form.Control
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </Form.Group>

          <Form.Group className="mb-3" style={{ position: "relative" }}>
            <Form.Label>Assign Users</Form.Label>

            {/* ช่องค้นหา */}
            <Form.Control
              placeholder="Search user..."
              className="mt-2"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            {/* ปุ่ม Select All */}
            <Button
              variant={
                assignedUsers.length === users.length ? "secondary" : "primary"
              }
              size="sm"
              onClick={handleAssignAll}
              style={{
                backgroundColor:
                  assignedUsers.length === users.length ? "#6c757d" : "#9236d9",
                borderColor:
                  assignedUsers.length === users.length ? "#6c757d" : "#9236d9",
                marginTop: "5px",
              }}
            >
              {assignedUsers.length === users.length
                ? "Cancel All"
                : "Select All User"}
            </Button>

            {/* Dropdown ของ user */}
            {search &&
              filteredUsers.filter((u) => !assignedUsers.includes(u._id))
                .length > 0 && (
                <ListGroup
                  style={{
                    maxHeight: "200px",
                    overflowY: "auto",
                    position: "absolute",
                    top: "82px", // อยู่ใต้ช่องค้นหา + ปุ่ม
                    width: "100%",
                    zIndex: 1000,
                    background: "white",
                    border: "1px solid #ced4da",
                  }}
                >
                  {filteredUsers
                    .filter((user) => !assignedUsers.includes(user._id))
                    .map((user) => (
                      <ListGroup.Item
                        key={user._id || Math.random()}
                        onClick={() => handleAssign(user._id)}
                        style={{
                          cursor: "pointer",
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span>{user.username || "(no name)"}</span>
                        <Badge bg="secondary">
                          {user.email || "(no email)"}
                        </Badge>
                      </ListGroup.Item>
                    ))}
                </ListGroup>
              )}

            {/* แสดง user ที่เลือกแล้ว */}
            {assignedUsers.length > 0 && (
              <div
                style={{
                  marginTop: "5px",
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "5px",
                }}
              >
                {assignedUsers.map((id) => {
                  const u = users.find((user) => user._id === id);
                  return (
                    <span
                      key={id}
                      style={{
                        display: "inline-block",
                        padding: "5px 10px",
                        borderRadius: "12px",
                        cursor: "pointer",
                        color: "#d0aceb",
                      }}
                      onClick={() => handleAssign(id)}
                    >
                      <span style={{ color: "#404040ff" }}>Assign Users: </span>
                      {u?.username || "(no name)"} ×
                    </span>
                  );
                })}
              </div>
            )}
          </Form.Group>
        </Form>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancle
        </Button>
        <Button
          style={{ background: "#9236d9" }}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Loading..." : "Create"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
