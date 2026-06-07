import { useState } from "react"
import { useAuth, API } from "../App"

export default function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const form = new URLSearchParams()
      form.append("username", email)
      form.append("password", password)

      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || "Login failed")
      login(data.access_token, data.user)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: "100vh", background: "#0a0a0f",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'DM Mono', monospace", position: "relative", overflow: "hidden"
    }}>
      {/* Background grid */}
      <div style={{
        position: "absolute", inset: 0, opacity: 0.04,
        backgroundImage: "linear-gradient(#c8ff00 1px, transparent 1px), linear-gradient(90deg, #c8ff00 1px, transparent 1px)",
        backgroundSize: "40px 40px"
      }} />

      <div style={{ width: "100%", maxWidth: "400px", padding: "0 24px", position: "relative", zIndex: 1 }}>
        {/* Logo */}
        <div style={{ marginBottom: "48px", textAlign: "center" }}>
          <div style={{ fontSize: "32px", fontWeight: 800, letterSpacing: "0.2em", marginBottom: "8px" }}>
            <span style={{ color: "#c8ff00" }}>GRADE</span>
            <span style={{ color: "#fff" }}>OPS</span>
          </div>
          <div style={{ fontSize: "11px", color: "#444", letterSpacing: "0.2em" }}>
            AI-POWERED EXAM GRADING SYSTEM
          </div>
        </div>

        {/* Form card */}
        <div style={{
          background: "#0f0f1a", border: "1px solid #1e1e2e",
          padding: "40px 36px"
        }}>
          <div style={{ fontSize: "13px", color: "#666", letterSpacing: "0.15em", marginBottom: "32px" }}>
            SIGN IN TO CONTINUE
          </div>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: "20px" }}>
              <label style={labelStyle}>EMAIL</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@iitg.ac.in" required style={inputStyle}
                onFocus={e => e.target.style.borderColor = "#c8ff00"}
                onBlur={e => e.target.style.borderColor = "#1e1e2e"}
              />
            </div>
            <div style={{ marginBottom: "28px" }}>
              <label style={labelStyle}>PASSWORD</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required style={inputStyle}
                onFocus={e => e.target.style.borderColor = "#c8ff00"}
                onBlur={e => e.target.style.borderColor = "#1e1e2e"}
              />
            </div>

            {error && (
              <div style={{ background: "#1a0f0f", border: "1px solid #4a1e1e", color: "#ff6b6b", padding: "12px", fontSize: "12px", marginBottom: "20px", letterSpacing: "0.05em" }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              width: "100%", background: "#c8ff00", color: "#0a0a0f",
              border: "none", padding: "14px", fontSize: "12px",
              fontWeight: 700, letterSpacing: "0.2em", cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1, fontFamily: "'DM Mono', monospace",
              transition: "all 0.2s"
            }}>
              {loading ? "AUTHENTICATING..." : "SIGN IN →"}
            </button>
          </form>
        </div>

        {/* Demo credentials */}
        <div style={{ marginTop: "24px", padding: "16px", background: "#0f0f1a", border: "1px solid #1e1e2e" }}>
          <div style={{ fontSize: "10px", color: "#444", letterSpacing: "0.15em", marginBottom: "12px" }}>DEMO CREDENTIALS</div>
          <DemoRow role="INSTRUCTOR" email="prof@iitg.ac.in" pass="password123" setEmail={setEmail} setPassword={setPassword} />
          <DemoRow role="TA" email="ta@iitg.ac.in" pass="password123" setEmail={setEmail} setPassword={setPassword} />
        </div>
      </div>
    </div>
  )
}

function DemoRow({ role, email, pass, setEmail, setPassword }) {
  return (
    <div
      onClick={() => { setEmail(email); setPassword(pass) }}
      style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", cursor: "pointer", borderBottom: "1px solid #1e1e2e" }}
    >
      <span style={{ fontSize: "11px", color: "#c8ff00", letterSpacing: "0.1em" }}>{role}</span>
      <span style={{ fontSize: "11px", color: "#555" }}>{email}</span>
    </div>
  )
}

const labelStyle = {
  display: "block", fontSize: "10px", color: "#555",
  letterSpacing: "0.15em", marginBottom: "8px"
}

const inputStyle = {
  width: "100%", background: "#0a0a0f", border: "1px solid #1e1e2e",
  color: "#e8e6e0", padding: "12px 14px", fontSize: "13px",
  fontFamily: "'DM Mono', monospace", outline: "none", boxSizing: "border-box",
  transition: "border-color 0.2s"
}
