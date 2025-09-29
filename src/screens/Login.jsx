import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import { useCookies } from "react-cookie";
import { Link, useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "react-toastify/dist/ReactToastify.css";

function Login() {
  const [cookies] = useCookies([]);
  const navigate = useNavigate();

  const [values, setValues] = useState({ email: "", password: "", role: "" });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (cookies.jwt) navigate("/");
  }, [cookies, navigate]);

  const generateError = (error) =>
    toast.error(error, { position: "bottom-right" });
  const generateSuccess = (msg) =>
    toast.success(msg, { position: "bottom-right" });

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!values.email || !values.password || !values.role)
      return generateError("Please fill in all information");

    try {
      const { data } = await axios.post(
        "https://kpi-system-api.onrender.com/login",
        { ...values },
        { withCredentials: true }
      );

      if (data.errors) {
        Object.values(data.errors).forEach((err) => generateError(err));
      } else {
        const userRole = data.user?.role || values.role;
        if (userRole === "admin") navigate("/admin-dashboard");
        else navigate("/user-dashboard");
      }
    } catch (ex) {
      console.log(ex);
      generateError("Something went wrong. Please try again.");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "10000px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f0f0f5",
        padding: "20px",
        margin:"80px",
      }}
    >
      
      <div
        style={{
          maxWidth: "500px",
          width: "100%",
          background: "white",
          borderRadius: "16px",
          boxShadow: "0 12px 30px rgba(0,0,0,0.15)",
          padding: "40px",
          textAlign: "center",
        }}
      >
        <img
          src="/logo.png"
          alt="Logo"
          style={{ width: "150px", marginBottom: "25px" }}
        />
        
        <form onSubmit={handleSubmit} style={{ textAlign: "left" }}>
          <label>Email</label>
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={values.email}
            onChange={(e) =>
              setValues({ ...values, [e.target.name]: e.target.value })
            }
            style={{
              width: "100%",
              padding: "14px",
              margin: "10px 0",
              borderRadius: "10px",
              border: "1px solid #ccc",
              boxSizing: "border-box",
            }}
          />

          <label>Password</label>
          <div style={{ position: "relative", marginBottom: "15px" }}>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={values.password}
              onChange={(e) =>
                setValues({ ...values, [e.target.name]: e.target.value })
              }
              style={{
                width: "100%",
                padding: "14px 50px 14px 14px",
                borderRadius: "10px",
                border: "1px solid #ccc",
              }}
            />
            <span
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: "15px",
                top: "50%",
                transform: "translateY(-50%)",
                cursor: "pointer",
                color: "#9236d9",
              }}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          <label>Role</label>
          <div style={{ marginBottom: "25px" }}>
            <label style={{ marginRight: "20px" }}>
              <input
                type="radio"
                name="role"
                value="admin"
                checked={values.role === "admin"}
                onChange={(e) => setValues({ ...values, role: e.target.value })}
              />{" "}
              Admin
            </label>
            <label>
              <input
                type="radio"
                name="role"
                value="user"
                checked={values.role === "user"}
                onChange={(e) => setValues({ ...values, role: e.target.value })}
              />{" "}
              User
            </label>
          </div>

          <button
            type="submit"
            style={{
              width: "100%",
              padding: "16px",
              background: "#9236d9",
              color: "white",
              border: "none",
              borderRadius: "10px",
              fontSize: "18px",
              fontWeight: "bold",
              cursor: "pointer",
              marginBottom: "15px",
            }}
          >
            Login
          </button>

          <p style={{ textAlign: "center" }}>
            Don't have an account?{" "}
            <Link
              to="/register"
              style={{ color: "#9236d9", fontWeight: "bold" }}
            >
              Register
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Login;
