import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import axios from "axios";

export default function Cards({ children }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const verifyUser = async () => {
      try {
        const { data } = await axios.post("https://kpi-system-api.onrender.com/", {}, { withCredentials: true });
        if (data.status) {
          setUser(data.user); // จะมี role และ info ของผู้ใช้
        }
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    verifyUser();
  }, []);

  if (loading) return <p>Loading...</p>;

  if (!user) return <Navigate to="/login" />;

  // ถ้า login แล้ว redirect ตาม role
  if (user.role === "admin") return <Navigate to="/admin-dashboard" />;
  return <Navigate to="/user-dashboard" />;
}
