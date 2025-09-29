import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import { useCookies } from "react-cookie";
import { Link, useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "react-toastify/dist/ReactToastify.css";

function Register() {
  const [cookies] = useCookies([]);
  const navigate = useNavigate();

  const [values, setValues] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
  });

  const [passwordMatch, setPasswordMatch] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (cookies.jwt) navigate("/");
  }, [cookies, navigate]);

  useEffect(() => {
    if (values.confirmPassword === "") setPasswordMatch(true);
    else setPasswordMatch(values.password === values.confirmPassword);
  }, [values.password, values.confirmPassword]);

  const generateError = (error) =>
    toast.error(error, { position: "bottom-right" });

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (
      !values.username ||
      !values.email ||
      !values.password ||
      !values.confirmPassword ||
      !values.role
    )
      return generateError("Please fill in all information");

    if (!passwordMatch) return generateError("Passwords do not match");

    try {
      const { data } = await axios.post(
        "https://kpi-system-api.onrender.com/register",
        { ...values, password: values.password },
        { withCredentials: true }
      );

      if (data.errors) {
        const allErrors = Object.values(data.errors).join("\n"); // รวมทุกข้อความ
        generateError(allErrors);
      } else {
        toast.success("Registration successful!", { position: "bottom-right" });
        navigate("/login");
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
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f0f0f5",
        padding: "20px",
        paddingTop: "300px",
        width: "10000px",
        maxHeight: "80vh",
        overflowY: "auto",
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
          <label>Username</label>
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={values.username}
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

          <label>Confirm Password</label>
          <div style={{ position: "relative", marginBottom: "15px" }}>
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="Confirm Password"
              value={values.confirmPassword}
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
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              style={{
                position: "absolute",
                right: "15px",
                top: "50%",
                transform: "translateY(-50%)",
                cursor: "pointer",
                color: "#9236d9",
              }}
            >
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
          {!passwordMatch && (
            <p style={{ color: "red", fontSize: "0.9rem" }}>
              Passwords do not match
            </p>
          )}

          <label>Role</label>
          <select
            name="role"
            value={values.role}
            onChange={(e) => setValues({ ...values, role: e.target.value })}
            style={{
              width: "100%",
              padding: "14px",
              marginBottom: "25px",
              borderRadius: "10px",
              border: "1px solid #ccc",
              boxSizing: "border-box",
            }}
          >
            <option value="">Select role</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>

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
            Register
          </button>

          <p style={{ textAlign: "center" }}>
            Already have an account?{" "}
            <Link to="/login" style={{ color: "#9236d9", fontWeight: "bold" }}>
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Register;
