import React, { useEffect, useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import axios from "axios";
import { toast } from "react-toastify";

export default function UserEditModal({ show, onHide, user, onSave }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("user");
  const [errors, setErrors] = useState({}); // ✅ สำหรับเก็บ error เฉพาะช่อง

  useEffect(() => {
    if (user) {
      setUsername(user.username || "");
      setEmail(user.email || "");
      setRole(user.role || "user");
      setErrors({});
    }
  }, [user]);

  const validateForm = () => {
    const newErrors = {};
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!username.trim()) {
      newErrors.username = "Username is required";
    } else if (!usernameRegex.test(username)) {
      newErrors.username = "No special characters allowed";
    }

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(email)) {
      newErrors.email = "Invalid email format";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return; // ✅ หยุดถ้าฟอร์มไม่ผ่าน

    try {
      await axios.put(
        `http://localhost:5000/api/admin/users/${user._id}/update`,
        { username, email, role },
        { withCredentials: true }
      );

      toast.success("User updated successfully");
      onSave?.();
      onHide();
    } catch (err) {
      console.error(err);

      // ✅ ตรวจ error จาก backend (กรณีซ้ำ)
      if (err.response?.data?.message?.includes("duplicate")) {
        if (err.response.data.message.includes("username")) {
          setErrors((prev) => ({
            ...prev,
            username: "This username is already taken",
          }));
        }
        if (err.response.data.message.includes("email")) {
          setErrors((prev) => ({
            ...prev,
            email: "This email is already registered",
          }));
        }
      } else {
        toast.error("Error updating user");
      }
    }
  };

  if (!user) return null;

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Edit User</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-2">
            <Form.Label>Username</Form.Label>
            <Form.Control
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              isInvalid={!!errors.username}
            />
            {errors.username && (
              <Form.Text className="text-danger">{errors.username}</Form.Text>
            )}
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              isInvalid={!!errors.email}
            />
            {errors.email && (
              <Form.Text className="text-danger">{errors.email}</Form.Text>
            )}
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Role</Form.Label>
            <Form.Select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </Form.Select>
          </Form.Group>
        </Form>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button style={{ background: "#9236d9" }} onClick={handleSave}>
          Save Changes
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
