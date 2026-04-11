import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import LoginPage from "./LogIn"
import RegisterPage from "./Register"
import Header from "./components/Header"

import StudentDashboard from "./StudentDashboard"
import MoodEntriesPage from "./Journal"

import AdminDashboard from "./AdminDashboard"
import AdminStudents from "./AdminStudents"
import AdminTasksPage from "./AdminTasks"
// import AdminRemindersPage from "./AdminRemindersPage"
// import AdminListsPage from "./AdminListsPage"

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token")
  if (!token) return <Navigate to="/login" />
  return children
}

function StudentRoute({ children }) {
  const token = localStorage.getItem("token")
  const user = JSON.parse(localStorage.getItem("user") || "{}")
  if (!token) return <Navigate to="/login" />
  if (String(user?.role || "").toLowerCase() === "admin") return <Navigate to="/admin/dashboard" />
  return children
}

function AdminRoute({ children }) {
  const token = localStorage.getItem("token")
  const user = JSON.parse(localStorage.getItem("user") || "{}")
  if (!token) return <Navigate to="/login" />
  if (String(user?.role || "").toLowerCase() !== "admin") return <Navigate to="/dashboard" />
  return children
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route
          path="/dashboard"
          element={
            <StudentRoute>
              <>
                <Header />
                <StudentDashboard />
              </>
            </StudentRoute>
          }
        />

        <Route
          path="/journal"
          element={
            <StudentRoute>
              <>
                <Header />
                <MoodEntriesPage />
              </>
            </StudentRoute>
          }
        />

        <Route
          path="/admin/dashboard"
          element={
            <AdminRoute>
              <>
                <Header />
                <AdminDashboard />
              </>
            </AdminRoute>
          }
        />
        
        <Route
          path="/admin/tasks"
          element={
            <AdminRoute>
              <>
                <Header />
                <AdminTasksPage />
              </>
            </AdminRoute>
          }
        />
        {/* 

        <Route
          path="/admin/reminders"
          element={
            <AdminRoute>
              <>
                <Header />
                <AdminRemindersPage />
              </>
            </AdminRoute>
          }
        /> */}

        <Route
          path="/admin/students"
          element={
            <AdminRoute>
              <>
                <Header />
                <AdminStudents />
              </>
            </AdminRoute>
          }
        />

        {/* <Route
          path="/admin/lists"
          element={
            <AdminRoute>
              <>
                <Header />
                <AdminListsPage />
              </>
            </AdminRoute>
          }
        /> */}

        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App