import React from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Routes, Route, BrowserRouter } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import Register from "./screens/Register";
import Login from "./screens/Login";
import Cards from "./screens/Cards";

import AdminDashboard from "./screens/AdminDashboard";
import Adminmanagekpi from "./screens/Adminmanagekpi";
import Adminmanageuser from "./screens/Adminmanageuser";
import ProfileSetting from "./screens/ProfileSetting";

import UserDashboard from "./screens/UserDashboard";
import UserManagekpi from "./screens/UserManagekpi";
import UserUpdateKPI from "./screens/UserUpdateKPI";
import Userprofile from "./screens/Userprofile";

export default function App() {
  return (
    <BrowserRouter>
      <ToastContainer
        position="bottom-right"
        newestOnTop={true}
        autoClose={3000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        draggable
        pauseOnFocusLoss
        style={{ zIndex: 9999 }} // เพิ่ม z-index
      />
      <Routes>
        <Route exact path="/register" element={<Register />} />
        <Route exact path="/login" element={<Login />} />
        <Route exact path="/" element={<Cards />} />

        <Route exact path="/admin-dashboard" element={<AdminDashboard />} />
        <Route exact path="/admin-managekpi" element={<Adminmanagekpi />} />
        <Route exact path="/admin-manageuser" element={<Adminmanageuser />} />

        <Route exact path="/profilesetting" element={<ProfileSetting />} />

        <Route exact path="/user-dashboard" element={<UserDashboard />} />
        <Route exact path="/user-managekpi" element={<UserManagekpi />} />
        <Route exact path="/user-updatekpi" element={<UserUpdateKPI />} />
        <Route exact path="/user-profile" element={<Userprofile />} />
      </Routes>
    </BrowserRouter>
  );
}
