import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Layout from "./components/Layout/Layout";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import EngineerList from "./components/Engineer/EngineerList";
import AddEngineer from "./components/Engineer/AddEngineer";
import EditEngineer from "./components/Engineer/EditEngineer";
import ProjectList from "./components/Project/ProjectList";
import AddProject from "./components/Project/AddProject";
import EditProject from "./components/Project/EditProject";
import TaskList from "./components/Task/TaskList";
import AddTask from "./components/Task/AddTask";
import EditTask from "./components/Task/EditTask";
import ITBPList from "./components/ITBP/ITBPList";
import UserList from "./components/User/UserList";
import DataList from "./components/DataProject/DataList"; // 🔹 Tambahkan import ini di atas



// Komponen untuk proteksi route
const PrivateRoute = ({ user, children }) => {
  const location = useLocation();
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    window.location.href = "/login";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-500">
        Loading...
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* LOGIN PAGE */}
        <Route path="/login" element={<Login onLogin={handleLogin} />} />

        {/* REDIRECT root ke dashboard jika login, ke login jika belum */}
        <Route
          path="/"
          element={
            user ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* DASHBOARD */}
      <Route
  path="/dashboard"
  element={
    <PrivateRoute user={user}>
      <Layout user={user} onLogout={handleLogout} setUser={setUser}>
        <Dashboard user={user} /> {/* ⬅️ kirim user sebagai prop */}
      </Layout>
    </PrivateRoute>
  }
/>


        {/* ENGINEER */}
        <Route
          path="/engineer"
          element={
            <PrivateRoute user={user}>
              <Layout user={user} onLogout={handleLogout} setUser={setUser}>
                <EngineerList />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/engineer/add"
          element={
            <PrivateRoute user={user}>
              <Layout user={user} onLogout={handleLogout} setUser={setUser}>
                <AddEngineer />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/engineer/:SAP/edit"
          element={
            <PrivateRoute user={user}>
              <Layout user={user} onLogout={handleLogout} setUser={setUser}>
                <EditEngineer />
              </Layout>
            </PrivateRoute>
          }
        />

        {/* PROJECT */}
        <Route
          path="/project"
          element={
            <PrivateRoute user={user}>
              <Layout user={user} onLogout={handleLogout} setUser={setUser}>
                <ProjectList />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/add"
          element={
            <PrivateRoute user={user}>
              <Layout user={user} onLogout={handleLogout} setUser={setUser}>
                <AddProject />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/projects/:id_project/edit"
          element={
            <PrivateRoute user={user}>
              <Layout user={user} onLogout={handleLogout} setUser={setUser}>
                <EditProject />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/projects/:id_project"
          element={
            <PrivateRoute user={user}>
              <Layout user={user} onLogout={handleLogout} setUser={setUser}>
                <TaskList />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/projects/:id_project/add-task"
          element={
            <PrivateRoute user={user}>
              <Layout user={user} onLogout={handleLogout} setUser={setUser}>
                <AddTask />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/projects/:id_project/tasks/:id_task/edit"
          element={
            <PrivateRoute user={user}>
              <Layout user={user} onLogout={handleLogout} setUser={setUser}>
                <EditTask />
              </Layout>
            </PrivateRoute>
          }
        />

        {/* ITBP */}
        <Route
          path="/itbp"
          element={
            <PrivateRoute user={user}>
              <Layout user={user} onLogout={handleLogout} setUser={setUser}>
                <ITBPList />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
  path="/administration/user"
  element={
    <PrivateRoute user={user}>
      <Layout user={user} onLogout={handleLogout} setUser={setUser}>
        <UserList />
      </Layout>
    </PrivateRoute>
  }
/>
<Route
  path="/administration/data-project"
  element={
    <PrivateRoute user={user}>
      <Layout user={user} onLogout={handleLogout} setUser={setUser}>
        <DataList />
      </Layout>
    </PrivateRoute>
  }
/>


        {/* fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
