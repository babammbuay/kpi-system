import React, { useEffect, useState } from "react";
import { Modal, Button, Table } from "react-bootstrap";
import axios from "axios";

export default function KPIdetailMD({ show, onHide, kpi }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (kpi?._id) {
      // ดึง history ของ KPI
      axios
        .get(`https://kpi-system-api.onrender.com/api/admin/kpis/${kpi._id}/history`, {
          withCredentials: true,
        })
        .then((res) => setHistory(res.data))
        .catch((err) => console.error(err));
    }
  }, [kpi]);

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title >{kpi.title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>
          <b>Title:</b> {kpi.title}
        </p>
        <p>
          <b>Description:</b> {kpi.description}
        </p>
        <p>
          <b>Target:</b> {kpi.target_value} {kpi.unit}
        </p>
        <p>
          <b>Actual:</b> {kpi.actual_value ?? "-"}
        </p>
        <p>
          <b>Status KPI:</b> {kpi.status_kpi ?? "-"}
        </p>
        <p>
          <b>Task Status:</b> {kpi.status_task}
        </p>
        <p>
          <b>Assigned Users:</b>{" "}
          {kpi.assigned_users.map((u) => u.email).join(", ")}
        </p>
        <p>
          <b>Created By:</b> {kpi.created_by?.username} (
          {new Date(kpi.createdAt).toLocaleString()})
        </p>

        <h5 className="mt-3">Update History</h5>
        {history.length > 0 ? (
          <Table striped bordered hover size="sm">
            <thead>
              <tr>
                <th>#</th>
                <th>User</th>
                <th>Date</th>
                <th>Action</th>
                <th>Changes</th>
                <th>Comment</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h, idx) => (
                <tr key={h._id}>
                  <td>{idx + 1}</td>
                  <td>{h.updated_by?.username || "(deleted user)"}</td>
                  <td>{new Date(h.createdAt).toLocaleString()}</td>
                  <td>{h.action}</td>
                  <td>
                    {h.changes &&
                      Object.entries(h.changes).map(
                        ([field, [oldVal, newVal]]) => (
                          <div key={field}>
                            <b>{field}</b>: {oldVal?.toString() || "-"} →{" "}
                            {newVal?.toString() || "-"}
                          </div>
                        )
                      )}
                  </td>
                  <td>{h.comment || "-"}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <p>No updates yet.</p>
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
