import { useState, useEffect, createContext, useContext } from "react"
import LoginPage from "./pages/LoginPage"
import DashboardPage from "./pages/DashboardPage"
import UploadPage from "./pages/UploadPage"
import ReviewPage from "./pages/ReviewPage"
import ExamDetailPage from "./pages/ExamDetailPage"

// ─── Auth Context ─────────────────────────────────────────────────────────────
export const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

const API = "http://localhost:8000"
export { API }

export default function App() {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem("gradeops_token"))
  const [page, setPage] = useState("dashboard")
  const [pageParams, setPageParams] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      fetch(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data) setUser(data)
          else { setToken(null); localStorage.removeItem("gradeops_token") }
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [token])

  const login = (newToken, userData) => {
    localStorage.setItem("gradeops_token", newToken)
    setToken(newToken)
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem("gradeops_token")
    setToken(null)
    setUser(null)
    setPage("dashboard")
  }

  const navigate = (p, params = {}) => {
    setPage(p)
    setPageParams(params)
  }

  if (loading) return (
    <div style={{ background: "#0a0a0f", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="spinner" />
    </div>
  )

  if (!user) return (
    <AuthContext.Provider value={{ user, token, login, logout, navigate }}>
      <LoginPage />
    </AuthContext.Provider>
  )

  const renderPage = () => {
    switch (page) {
      case "upload": return <UploadPage />
      case "review": return <ReviewPage examId={pageParams.examId} gradeId={pageParams.gradeId} />
      case "exam": return <ExamDetailPage examId={pageParams.examId} />
      default: return <DashboardPage />
    }
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, navigate }}>
      <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#e8e6e0", fontFamily: "'DM Mono', monospace" }}>
        <Nav page={page} />
        <main style={{ paddingTop: "70px" }}>
          {renderPage()}
        </main>
      </div>
    </AuthContext.Provider>
  )
}

function Nav({ page }) {
  const { user, logout, navigate } = useAuth()
  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      background: "rgba(10,10,15,0.95)", borderBottom: "1px solid #1e1e2e",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 32px", height: "64px", backdropFilter: "blur(12px)"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
        <span style={{ fontSize: "15px", fontWeight: 700, letterSpacing: "0.15em", color: "#c8ff00" }}>
          GRADE<span style={{ color: "#fff" }}>OPS</span>
        </span>
        <NavBtn label="Dashboard" active={page === "dashboard"} onClick={() => navigate("dashboard")} />
        {user?.role === "instructor" && (
          <NavBtn label="Upload Exam" active={page === "upload"} onClick={() => navigate("upload")} />
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <span style={{ fontSize: "11px", color: "#666", letterSpacing: "0.1em" }}>
          {user?.name} · <span style={{ color: "#c8ff00" }}>{user?.role?.toUpperCase()}</span>
        </span>
        <button onClick={logout} style={{
          background: "transparent", border: "1px solid #333", color: "#888",
          padding: "6px 14px", fontSize: "11px", cursor: "pointer", letterSpacing: "0.1em",
          transition: "all 0.2s"
        }}
          onMouseEnter={e => { e.target.style.borderColor = "#c8ff00"; e.target.style.color = "#c8ff00" }}
          onMouseLeave={e => { e.target.style.borderColor = "#333"; e.target.style.color = "#888" }}
        >LOGOUT</button>
      </div>
    </nav>
  )
}

function NavBtn({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      background: "transparent", border: "none", cursor: "pointer",
      fontSize: "11px", letterSpacing: "0.12em", padding: "4px 0",
      color: active ? "#c8ff00" : "#666",
      borderBottom: active ? "1px solid #c8ff00" : "1px solid transparent",
      transition: "all 0.2s"
    }}>{label.toUpperCase()}</button>
  )
}
