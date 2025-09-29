import React, { useEffect, useState } from "react";
import { Modal, Button, Form, ListGroup, Badge } from "react-bootstrap";
import axios from "axios";
import { toast } from "react-toastify";

export default function AdminKPIEditMD({ show, onHide, kpi, onSave }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [target, setTarget] = useState(0);
  const [unit, setUnit] = useState("หน่วย");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (kpi) {
      setTitle(kpi.title || "");
      setDescription(kpi.description || "");
      setTarget(kpi.target_value || 0);
      setUnit(kpi.unit || "หน่วย");
      setStartDate(kpi.start_date?.slice(0, 10) || "");
      setEndDate(kpi.end_date?.slice(0, 10) || "");
      setAssignedUsers(kpi.assigned_users?.map((u) => u._id) || []);
    }
  }, [kpi]);

  useEffect(() => {
    if (show) fetchUsers();
  }, [show]);

  const fetchUsers = async () => {
    try {
      const { data } = await axios.get(
        "https://kpi-isstest.onrender.com/api/admin/users",
        { withCredentials: true }
      );
      if (Array.isArray(data)) {
        setUsers(data.filter((u) => u.role === "user"));
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.error(err);
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

  const filteredUsers = users.filter(
    (u) =>
      (u.username || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async () => {
    try {
      await axios.put(
        `https://kpi-isstest.onrender.com/api/admin/kpis/${kpi._id}/update`,
        {
          title,
          description,
          target_value: target,
          unit,
          start_date: startDate,
          end_date: endDate,
          assignedUsers,
          comment,
        },
        { withCredentials: true }
      );

      toast.success("KPI updated successfully");
      onSave?.();
      onHide();
    } catch (err) {
      console.error(err);
      toast.error("Error updating KPI");
    }
  };

  if (!kpi) return null;

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Edit KPI</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-2">
            <Form.Label>Title</Form.Label>
            <Form.Control
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label>Target</Form.Label>
            <Form.Control
              type="number"
              value={target}
              onChange={(e) => setTarget(Number(e.target.value))}
            />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label>Unit</Form.Label>
            <Form.Select value={unit} onChange={(e) => setUnit(e.target.value)}>
              <option value="หน่วย">หน่วย</option>
              <option value="บาท">บาท</option>
              <option value="คน">คน</option>
              <option value="ร้อยละ">ร้อยละ</option>
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label>Start Date</Form.Label>
            <Form.Control
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label>End Date</Form.Label>
            <Form.Control
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </Form.Group>

          {/* Assign Users */}
          <Form.Group className="mb-3" style={{ position: "relative" }}>
            <Form.Label>Assign Users</Form.Label>
            <Form.Control
              placeholder="Search user..."
              className="mt-2"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
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

            {search &&
              filteredUsers.filter((u) => !assignedUsers.includes(u._id))
                .length > 0 && (
                <ListGroup
                  style={{
                    maxHeight: "200px",
                    overflowY: "auto",
                    position: "absolute",
                    top: "82px",
                    width: "100%",
                    zIndex: 1000,
                    background: "white",
                    border: "1px solid #ced4da",
                  }}
                >
                  {filteredUsers
                    .filter((u) => !assignedUsers.includes(u._id))
                    .map((user) => (
                      <ListGroup.Item
                        key={user._id}
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
          <Form.Group className="mb-2">
            <Form.Label>Comment / หมายเหตุ</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              placeholder="Comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSave}>
          Save Changes
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
