import { useState, useEffect } from "react"
import { useAuth, API } from "../App"

export default function ExamDetailPage({ examId }) {
  const { token, navigate } = useAuth()
  const [exam, setExam] = useState(null)
  const [grades, setGrades] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all") // all | pending | approved | overridden

  const load = async () => {
    const [examRes, gradesRes, statsRes] = await Promise.all([
      fetch(`${API}/exams/${examId}`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API}/grades/exam/${examId}`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API}/grades/exam/${examId}/stats`, { headers: { Authorization: `Bearer ${token}` } })
    ])
    const [examData, gradesData, statsData] = await Promise.all([examRes.json(), gradesRes.json(), statsRes.json()])
    setExam(examData)
    setGrades(gradesData)
    setStats(statsData)
    setLoading(false)
  }

  useEffect(() => { load() }, [examId])

  const filtered = grades.filter(g => filter === "all" || g.status === filter)

  if (loading) return <Loading />

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "48px 32px", fontFamily: "'DM Mono', monospace" }}>

      {/* Breadcrumb */}
      <div style={{ fontSize: "10px", color: "#555", letterSpacing: "0.15em", marginBottom: "24px" }}>
        <span style={{ cursor: "pointer", color: "#666" }} onClick={() => navigate("dashboard")}>DASHBOARD</span>
        <span style={{ margin: "0 8px" }}>›</span>
        <span style={{ color: "#e8e6e0" }}>{exam?.title}</span>
      </div>

      <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#e8e6e0", marginBottom: "8px" }}>
        {exam?.title}
      </h1>
      <div style={{ fontSize: "11px", color: "#444", letterSpacing: "0.1em", marginBottom: "40px" }}>
        EXAM ID: {examId} · UPLOADED {exam?.created_at?.split("T")[0]}
      </div>

      {/* Stats */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px", marginBottom: "40px" }}>
          <MiniStat label="TOTAL" value={stats.total} />
          <MiniStat label="PENDING" value={stats.pending} accent={stats.pending > 0} color="#c8ff00" />
          <MiniStat label="APPROVED" value={stats.approved} color="#4a9a4a" />
          <MiniStat label="OVERRIDDEN" value={stats.overridden} color="#9a6a2a" />
          <MiniStat label="PLAGIARISM FLAGS" value={stats.plagiarism_flags} color={stats.plagiarism_flags > 0 ? "#ff6b6b" : "#444"} />
        </div>
      )}

      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "40px" }}>
          <MiniStat label="AVG SCORE" value={`${stats.avg_score} / ${grades[0]?.ai_result?.max_score ?? "?"}`} />
          <MiniStat label="HIGHEST" value={stats.max_score} color="#4a9a4a" />
          <MiniStat label="LOWEST" value={stats.min_score} color="#9a4a4a" />
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "24px", borderBottom: "1px solid #1e1e2e", paddingBottom: "0" }}>
        {["all", "pending", "approved", "overridden"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            background: "transparent", border: "none", borderBottom: filter === f ? "2px solid #c8ff00" : "2px solid transparent",
            color: filter === f ? "#c8ff00" : "#555", padding: "10px 16px",
            fontSize: "10px", letterSpacing: "0.15em", cursor: "pointer",
            fontFamily: "'DM Mono', monospace", marginBottom: "-1px"
          }}>
            {f.toUpperCase()} ({f === "all" ? grades.length : grades.filter(g => g.status === f).length})
          </button>
        ))}
      </div>

      {/* Grade cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {filtered.map(grade => (
          <GradeRow key={grade.grade_id} grade={grade} navigate={navigate} />
        ))}
      </div>
    </div>
  )
}

function GradeRow({ grade, navigate }) {
  const pct = grade.ai_result?.percentage ?? 0
  const hasPlagiarism = grade.ai_result?.grades?.some(g => g.plagiarism_flag)

  const statusColor = { pending: "#c8ff00", approved: "#4a9a4a", overridden: "#9a6a2a" }[grade.status]
  const statusLabel = { pending: "PENDING REVIEW", approved: "APPROVED", overridden: "OVERRIDDEN" }[grade.status]

  return (
    <div
      onClick={() => navigate("review", { examId: grade.exam_id, gradeId: grade.grade_id })}
      style={{
        background: "#0f0f1a", border: "1px solid #1e1e2e", padding: "20px 24px",
        display: "grid", gridTemplateColumns: "120px 1fr 140px 160px 100px",
        alignItems: "center", gap: "24px", cursor: "pointer", transition: "all 0.2s"
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = "#333"}
      onMouseLeave={e => e.currentTarget.style.borderColor = "#1e1e2e"}
    >
      {/* Student ID */}
      <div>
        <div style={{ fontSize: "13px", fontWeight: 600, color: "#e8e6e0" }}>{grade.student_id}</div>
        <div style={{ fontSize: "10px", color: "#444", marginTop: "4px" }}>{grade.filename}</div>
      </div>

      {/* Score bar */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
          <span style={{ fontSize: "11px", color: "#555" }}>AI SCORE</span>
          <span style={{ fontSize: "12px", color: "#e8e6e0", fontWeight: 600 }}>
            {grade.final_score} / {grade.ai_result?.max_score}
          </span>
        </div>
        <div style={{ height: "4px", background: "#1e1e2e", borderRadius: "2px" }}>
          <div style={{
            height: "100%", borderRadius: "2px",
            width: `${pct}%`,
            background: pct >= 70 ? "#4a9a4a" : pct >= 40 ? "#9a9a2a" : "#9a4a4a"
          }} />
        </div>
      </div>

      {/* Percentage */}
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "20px", fontWeight: 700, color: pct >= 70 ? "#4a9a4a" : pct >= 40 ? "#c8b800" : "#c84a4a" }}>
          {pct}%
        </div>
      </div>

      {/* Flags */}
      <div>
        {hasPlagiarism && (
          <span style={{ background: "#2a0a0a", border: "1px solid #4a1a1a", color: "#ff6b6b", fontSize: "9px", padding: "4px 8px", letterSpacing: "0.1em" }}>
            ⚠ PLAGIARISM
          </span>
        )}
      </div>

      {/* Status */}
      <div style={{ textAlign: "right" }}>
        <span style={{ fontSize: "9px", color: statusColor, letterSpacing: "0.1em" }}>{statusLabel}</span>
        <div style={{ fontSize: "10px", color: "#333", marginTop: "4px" }}>→ REVIEW</div>
      </div>
    </div>
  )
}

function MiniStat({ label, value, color, accent }) {
  return (
    <div style={{ background: "#0f0f1a", border: "1px solid #1e1e2e", padding: "16px 20px" }}>
      <div style={{ fontSize: "9px", color: "#444", letterSpacing: "0.15em", marginBottom: "8px" }}>{label}</div>
      <div style={{ fontSize: "20px", fontWeight: 700, color: color || "#e8e6e0" }}>{value}</div>
    </div>
  )
}

function Loading() {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh", color: "#444", fontFamily: "'DM Mono', monospace", fontSize: "12px", letterSpacing: "0.1em" }}>
      LOADING...
    </div>
  )
}
