import React, { useEffect, useState } from "react";
import { Modal, Button, Table } from "react-bootstrap";
import axios from "axios";

export default function UserdetailModal({ show, onHide, user }) {
  const [assignedKpis, setAssignedKpis] = useState([]);
  const [createdKpis, setCreatedKpis] = useState([]);

  useEffect(() => {
    if (user?._id) {
      if (user.role === "admin") {
        axios
          .get(`http://localhost:5000/api/admin/created-by/${user._id}`, {
            withCredentials: true,
          })
          .then((res) => setCreatedKpis(res.data))
          .catch((err) => console.error(err));
      }

      // ดึง KPI ที่ user ถูก assign
      axios
        .get(`http://localhost:5000/api/admin/assigned-to/${user._id}`, {
          withCredentials: true,
        })
        .then((res) => setAssignedKpis(res.data))
        .catch((err) => console.error(err));
    }
  }, [user]);

  if (!user) return null;

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{user.username || user.email}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p><b>Email:</b> {user.email}</p>
        <p><b>Role:</b> {user.role}</p>
        <p><b>Created At:</b> {new Date(user.createdAt).toLocaleString()}</p>

        {user.role === "admin" && createdKpis.length > 0 && (
          <>
            <h5 className="mt-3">KPI Created by this Admin</h5>
            <Table striped bordered hover size="sm">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Title</th>
                  <th>Target</th>
                  <th>Actual</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {createdKpis.map((kpi, idx) => (
                  <tr key={kpi._id}>
                    <td>{idx + 1}</td>
                    <td>{kpi.title}</td>
                    <td>{kpi.target_value} {kpi.unit}</td>
                    <td>{kpi.actual_value ?? "-"}</td>
                    <td>{kpi.status_kpi ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </>
        )}

        {assignedKpis.length > 0 && (
          <>
            <h5 className="mt-3">KPI Assigned to this User</h5>
            <Table striped bordered hover size="sm">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Title</th>
                  <th>Target</th>
                  <th>Actual</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {assignedKpis.map((kpi, idx) => (
                  <tr key={kpi._id}>
                    <td>{idx + 1}</td>
                    <td>{kpi.title}</td>
                    <td>{kpi.target_value} {kpi.unit}</td>
                    <td>{kpi.actual_value ?? "-"}</td>
                    <td>{kpi.status_task ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </>
        )}

        {assignedKpis.length === 0 && createdKpis.length === 0 && (
          <p>No KPI assigned or created yet.</p>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
