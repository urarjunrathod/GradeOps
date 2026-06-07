import { useState, useEffect } from "react"
import { useAuth, API } from "../App"

export default function DashboardPage() {
  const { token, navigate, user } = useAuth()
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API}/exams`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { setExams(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const totalPending = exams.reduce((s, e) => s + (e.pending_count || 0), 0)
  const totalExams = exams.length

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "48px 32px", fontFamily: "'DM Mono', monospace" }}>

      {/* Header */}
      <div style={{ marginBottom: "48px" }}>
        <div style={{ fontSize: "10px", color: "#555", letterSpacing: "0.2em", marginBottom: "12px" }}>
          GRADEOPS / DASHBOARD
        </div>
        <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#e8e6e0", margin: 0, letterSpacing: "0.05em" }}>
          Welcome back, <span style={{ color: "#c8ff00" }}>{user?.name}</span>
        </h1>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "48px" }}>
        <StatCard label="TOTAL EXAMS" value={totalExams} />
        <StatCard label="PENDING REVIEW" value={totalPending} accent={totalPending > 0} />
        <StatCard label="YOUR ROLE" value={user?.role?.toUpperCase()} />
      </div>

      {/* Exams list */}
      <div style={{ marginBottom: "24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: "11px", color: "#555", letterSpacing: "0.15em" }}>ALL EXAMS</div>
        {user?.role === "instructor" && (
          <button onClick={() => navigate("upload")} style={btnStyle}>
            + UPLOAD NEW EXAM
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", color: "#444", padding: "80px 0", fontSize: "12px", letterSpacing: "0.1em" }}>
          LOADING EXAMS...
        </div>
      ) : exams.length === 0 ? (
        <EmptyState navigate={navigate} role={user?.role} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {exams.map(exam => (
            <ExamCard key={exam.exam_id} exam={exam} navigate={navigate} />
          ))}
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, accent }) {
  return (
    <div style={{
      background: "#0f0f1a", border: `1px solid ${accent ? "#c8ff00" : "#1e1e2e"}`,
      padding: "24px 28px"
    }}>
      <div style={{ fontSize: "10px", color: "#444", letterSpacing: "0.15em", marginBottom: "12px" }}>{label}</div>
      <div style={{ fontSize: "28px", fontWeight: 700, color: accent ? "#c8ff00" : "#e8e6e0" }}>{value}</div>
    </div>
  )
}

function ExamCard({ exam, navigate }) {
  const pendingPct = exam.total_submissions > 0
    ? Math.round(((exam.pending_count || 0) / exam.total_submissions) * 100)
    : 0

  return (
    <div style={{
      background: "#0f0f1a", border: "1px solid #1e1e2e", padding: "24px 28px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      cursor: "pointer", transition: "border-color 0.2s"
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = "#333"}
      onMouseLeave={e => e.currentTarget.style.borderColor = "#1e1e2e"}
      onClick={() => navigate("exam", { examId: exam.exam_id })}
    >
      <div>
        <div style={{ fontSize: "14px", fontWeight: 600, color: "#e8e6e0", marginBottom: "8px" }}>
          {exam.title}
        </div>
        <div style={{ fontSize: "11px", color: "#555", letterSpacing: "0.1em" }}>
          ID: {exam.exam_id} · {exam.total_submissions} submissions · {exam.created_at?.split("T")[0]}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
        {exam.pending_count > 0 && (
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "18px", fontWeight: 700, color: "#c8ff00" }}>{exam.pending_count}</div>
            <div style={{ fontSize: "10px", color: "#555", letterSpacing: "0.1em" }}>PENDING</div>
          </div>
        )}
        {exam.pending_count === 0 && (
          <div style={{ fontSize: "11px", color: "#3a7a3a", letterSpacing: "0.1em" }}>✓ COMPLETE</div>
        )}
        <div style={{ fontSize: "12px", color: "#444" }}>→</div>
      </div>
    </div>
  )
}

function EmptyState({ navigate, role }) {
  return (
    <div style={{
      textAlign: "center", padding: "80px 40px",
      border: "1px dashed #1e1e2e", color: "#444"
    }}>
      <div style={{ fontSize: "32px", marginBottom: "16px" }}>📋</div>
      <div style={{ fontSize: "13px", letterSpacing: "0.1em", marginBottom: "24px" }}>NO EXAMS UPLOADED YET</div>
      {role === "instructor" && (
        <button onClick={() => navigate("upload")} style={btnStyle}>
          UPLOAD FIRST EXAM →
        </button>
      )}
    </div>
  )
}

const btnStyle = {
  background: "#c8ff00", color: "#0a0a0f", border: "none",
  padding: "10px 20px", fontSize: "11px", fontWeight: 700,
  letterSpacing: "0.15em", cursor: "pointer", fontFamily: "'DM Mono', monospace"
}
