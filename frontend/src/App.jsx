import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import LoginPage from "./LogIn"
import RegisterPage from "./Register"
import MoodEntriesPage from "./Journal"
import Header from "./components/Header"

function ProtectedRoute({ children }) {
    const token = localStorage.getItem("token")
    if (!token) return <Navigate to="/login" />
    return children
}

function App() {
    return (
        <BrowserRouter>

            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                <Route path="/dashboard" element={
                    <ProtectedRoute>
                        <>
                            <Header />
                            <div>Dashboard</div>
                        </>
                    </ProtectedRoute>
                } />

                <Route
                    path="/journal"
                    element={
                        <ProtectedRoute>
                            <>
                                <Header />
                                <MoodEntriesPage />
                            </>
                        </ProtectedRoute>
                    }
                />

                <Route path="/" element={<Navigate to="/login" />} />
            </Routes>
        </BrowserRouter>
    )
}

export default App