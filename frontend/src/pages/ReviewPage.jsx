import { useState, useEffect, useCallback } from "react"
import { useAuth, API } from "../App"

export default function ReviewPage({ examId, gradeId }) {
  const { token, navigate } = useAuth()
  const [grade, setGrade] = useState(null)
  const [allGrades, setAllGrades] = useState([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showOverride, setShowOverride] = useState(false)
  const [overrideScore, setOverrideScore] = useState("")
  const [overrideFeedback, setOverrideFeedback] = useState("")
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)

  const showToast = (msg, color = "#c8ff00") => {
    setToast({ msg, color })
    setTimeout(() => setToast(null), 2000)
  }

  const loadGrades = async () => {
    const res = await fetch(`${API}/grades/exam/${examId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    setAllGrades(data)
    const idx = data.findIndex(g => g.grade_id === gradeId)
    setCurrentIdx(idx >= 0 ? idx : 0)
    setGrade(data[idx >= 0 ? idx : 0])
    setLoading(false)
  }

  useEffect(() => { loadGrades() }, [examId, gradeId])

  const goTo = useCallback((idx) => {
    if (idx < 0 || idx >= allGrades.length) return
    setCurrentIdx(idx)
    setGrade(allGrades[idx])
    setShowOverride(false)
    setOverrideScore("")
    setOverrideFeedback("")
  }, [allGrades])

  const submitAction = async (action, extra = {}) => {
    setSaving(true)
    try {
      const body = { action, ...extra }
      const res = await fetch(`${API}/grades/${grade.grade_id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      })
      const updated = await res.json()
      // Update local state
      const updatedGrades = allGrades.map(g => g.grade_id === updated.grade_id ? updated : g)
      setAllGrades(updatedGrades)
      setGrade(updated)
      showToast(action === "approve" ? "✓ APPROVED" : "✓ OVERRIDDEN", action === "approve" ? "#c8ff00" : "#9a9a2a")
      // Auto advance to next pending
      const nextPending = updatedGrades.findIndex((g, i) => i > currentIdx && g.status === "pending")
      if (nextPending >= 0) setTimeout(() => goTo(nextPending), 800)
    } catch (err) {
      showToast("ERROR: " + err.message, "#ff6b6b")
    } finally {
      setSaving(false)
      setShowOverride(false)
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (showOverride || saving) return
      if (e.key === "a" || e.key === "A") submitAction("approve")
      if (e.key === "o" || e.key === "O") setShowOverride(v => !v)
      if (e.key === "ArrowRight" || e.key === "d") goTo(currentIdx + 1)
      if (e.key === "ArrowLeft" || e.key === "s") goTo(currentIdx - 1)
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [grade, currentIdx, showOverride, saving, goTo])

  if (loading) return <Loading />
  if (!grade) return <div style={{ color: "#555", padding: "80px", textAlign: "center", fontFamily: "'DM Mono', monospace" }}>Grade not found</div>

  const pendingCount = allGrades.filter(g => g.status === "pending").length

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "32px", fontFamily: "'DM Mono', monospace", position: "relative" }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: "80px", right: "32px", zIndex: 999,
          background: "#0a0a0f", border: `1px solid ${toast.color}`,
          color: toast.color, padding: "14px 24px", fontSize: "13px",
          letterSpacing: "0.15em", fontWeight: 700,
          animation: "fadeIn 0.2s ease"
        }}>
          {toast.msg}
        </div>
      )}

      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px" }}>
        <div>
          <div style={{ fontSize: "10px", color: "#555", letterSpacing: "0.15em", marginBottom: "8px" }}>
            <span style={{ cursor: "pointer", color: "#666" }} onClick={() => navigate("exam", { examId })}>← BACK TO EXAM</span>
          </div>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "#e8e6e0" }}>
            Reviewing: <span style={{ color: "#c8ff00" }}>{grade.student_id}</span>
            <span style={{ color: "#444", fontSize: "12px", marginLeft: "12px" }}>
              ({currentIdx + 1} / {allGrades.length})
            </span>
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {pendingCount > 0 && (
            <div style={{ fontSize: "11px", color: "#c8ff00", letterSpacing: "0.1em", marginRight: "8px" }}>
              {pendingCount} PENDING
            </div>
          )}
          <NavBtn onClick={() => goTo(currentIdx - 1)} disabled={currentIdx === 0}>← PREV [S]</NavBtn>
          <NavBtn onClick={() => goTo(currentIdx + 1)} disabled={currentIdx === allGrades.length - 1}>NEXT [D] →</NavBtn>
        </div>
      </div>

      {/* Main 2-column layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>

        {/* LEFT: Student answer viewer */}
        <div>
          <SectionLabel>STUDENT ANSWER — {grade.filename}</SectionLabel>
          <div style={{
            background: "#0f0f1a", border: "1px solid #1e1e2e",
            minHeight: "500px", display: "flex", alignItems: "center", justifyContent: "center",
            flexDirection: "column", gap: "16px"
          }}>
            {/* In production, render the PDF here using PDF.js or an iframe */}
            <div style={{ fontSize: "40px" }}>📄</div>
            <div style={{ fontSize: "12px", color: "#444", letterSpacing: "0.1em", textAlign: "center", padding: "0 32px" }}>
              PDF VIEWER<br />
              <span style={{ fontSize: "10px", color: "#333", marginTop: "8px", display: "block" }}>
                Integrate PDF.js here to display the student's answer sheet.
                <br />File path: {grade.file_path}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT: AI Grade + Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Score summary */}
          <div>
            <SectionLabel>AI GRADE SUMMARY</SectionLabel>
            <div style={{ background: "#0f0f1a", border: "1px solid #1e1e2e", padding: "24px" }}>
              <div style={{ display: "flex", alignItems: "flex-end", gap: "12px", marginBottom: "20px" }}>
                <div style={{ fontSize: "42px", fontWeight: 800, color: "#c8ff00", lineHeight: 1 }}>
                  {grade.ai_result.total_score}
                </div>
                <div style={{ fontSize: "18px", color: "#444", paddingBottom: "8px" }}>
                  / {grade.ai_result.max_score}
                </div>
                <div style={{ fontSize: "18px", color: "#888", paddingBottom: "8px" }}>
                  ({grade.ai_result.percentage}%)
                </div>
              </div>

              {/* Per-question breakdown */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {grade.ai_result.grades.map((q, i) => (
                  <QuestionRow key={i} q={q} />
                ))}
              </div>
            </div>
          </div>

          {/* Status badge */}
          <div style={{
            background: "#0f0f1a", border: `1px solid ${grade.status === "pending" ? "#333" : "#1e2e1e"}`,
            padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center"
          }}>
            <span style={{ fontSize: "10px", color: "#555", letterSpacing: "0.15em" }}>STATUS</span>
            <StatusBadge status={grade.status} reviewedBy={grade.reviewed_by} score={grade.final_score} />
          </div>

          {/* Action buttons */}
          {grade.status === "pending" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <SectionLabel>QUICK ACTIONS</SectionLabel>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <ActionBtn
                  label="APPROVE [A]"
                  sublabel="Accept AI grade as-is"
                  color="#c8ff00"
                  textColor="#0a0a0f"
                  onClick={() => submitAction("approve")}
                  disabled={saving}
                />
                <ActionBtn
                  label="OVERRIDE [O]"
                  sublabel="Change score manually"
                  color="transparent"
                  textColor="#e8e6e0"
                  border="#555"
                  onClick={() => setShowOverride(v => !v)}
                  disabled={saving}
                />
              </div>
            </div>
          )}

          {/* Override panel */}
          {showOverride && grade.status === "pending" && (
            <div style={{ background: "#0f0f1a", border: "1px solid #555", padding: "24px" }}>
              <div style={{ fontSize: "11px", color: "#888", letterSpacing: "0.15em", marginBottom: "16px" }}>
                SET MANUAL SCORE
              </div>
              <div style={{ marginBottom: "12px" }}>
                <label style={labelStyle}>FINAL SCORE (max: {grade.ai_result.max_score})</label>
                <input
                  type="number" value={overrideScore}
                  onChange={e => setOverrideScore(e.target.value)}
                  min={0} max={grade.ai_result.max_score} step={0.5}
                  placeholder={grade.ai_result.total_score}
                  style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }}
                  onFocus={e => e.target.style.borderColor = "#c8ff00"}
                  onBlur={e => e.target.style.borderColor = "#1e1e2e"}
                />
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={labelStyle}>FEEDBACK / REASON (optional)</label>
                <textarea
                  value={overrideFeedback} onChange={e => setOverrideFeedback(e.target.value)}
                  placeholder="Reason for override..."
                  rows={3}
                  style={{ ...inputStyle, width: "100%", boxSizing: "border-box", resize: "vertical" }}
                  onFocus={e => e.target.style.borderColor = "#c8ff00"}
                  onBlur={e => e.target.style.borderColor = "#1e1e2e"}
                />
              </div>
              <button
                onClick={() => submitAction("override", {
                  override_score: parseFloat(overrideScore) || grade.ai_result.total_score,
                  override_feedback: overrideFeedback
                })}
                disabled={saving}
                style={{
                  width: "100%", background: "#9a6a2a", color: "#fff", border: "none",
                  padding: "12px", fontSize: "11px", fontWeight: 700, letterSpacing: "0.15em",
                  cursor: "pointer", fontFamily: "'DM Mono', monospace"
                }}
              >
                CONFIRM OVERRIDE
              </button>
            </div>
          )}

          {/* Keyboard shortcuts hint */}
          <div style={{ background: "#0a0a0a", border: "1px solid #111", padding: "16px 20px" }}>
            <div style={{ fontSize: "9px", color: "#333", letterSpacing: "0.15em", marginBottom: "10px" }}>KEYBOARD SHORTCUTS</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
              {[["A", "Approve"], ["O", "Toggle override"], ["D / →", "Next student"], ["S / ←", "Prev student"]].map(([k, v]) => (
                <div key={k} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <kbd style={{ background: "#1e1e2e", border: "1px solid #333", color: "#c8ff00", padding: "2px 6px", fontSize: "10px", fontFamily: "'DM Mono', monospace" }}>{k}</kbd>
                  <span style={{ fontSize: "10px", color: "#444" }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function QuestionRow({ q }) {
  const pct = (q.awarded_marks / q.max_marks) * 100
  return (
    <div style={{ background: "#0a0a0f", padding: "12px 14px", border: `1px solid ${q.plagiarism_flag ? "#4a1a1a" : "#0f0f1a"}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
        <span style={{ fontSize: "11px", color: "#888" }}>Q{q.question_number}</span>
        <span style={{ fontSize: "12px", fontWeight: 700, color: pct >= 70 ? "#4a9a4a" : pct >= 40 ? "#c8b800" : "#c84a4a" }}>
          {q.awarded_marks} / {q.max_marks}
        </span>
      </div>
      <div style={{ height: "3px", background: "#1e1e2e", marginBottom: "8px" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: pct >= 70 ? "#4a9a4a" : pct >= 40 ? "#c8b800" : "#c84a4a" }} />
      </div>
      <div style={{ fontSize: "10px", color: "#555", lineHeight: "1.5" }}>{q.justification}</div>
      {q.plagiarism_flag && (
        <div style={{ marginTop: "8px", fontSize: "9px", color: "#ff6b6b", letterSpacing: "0.1em" }}>⚠ POTENTIAL PLAGIARISM DETECTED</div>
      )}
    </div>
  )
}

function StatusBadge({ status, reviewedBy, score }) {
  const colors = { pending: "#666", approved: "#4a9a4a", overridden: "#9a6a2a" }
  const labels = { pending: "AWAITING REVIEW", approved: `APPROVED BY ${reviewedBy}`, overridden: `OVERRIDDEN → ${score}` }
  return (
    <span style={{ fontSize: "11px", color: colors[status], letterSpacing: "0.1em" }}>
      {labels[status]}
    </span>
  )
}

function ActionBtn({ label, sublabel, color, textColor, border, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: color, color: textColor,
      border: `2px solid ${border || color}`,
      padding: "16px 12px", cursor: disabled ? "not-allowed" : "pointer",
      fontFamily: "'DM Mono', monospace", textAlign: "center", opacity: disabled ? 0.6 : 1,
      transition: "opacity 0.2s"
    }}>
      <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.15em" }}>{label}</div>
      <div style={{ fontSize: "10px", opacity: 0.7, marginTop: "4px" }}>{sublabel}</div>
    </button>
  )
}

function NavBtn({ children, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: "transparent", border: "1px solid #1e1e2e", color: disabled ? "#333" : "#666",
      padding: "8px 14px", fontSize: "10px", letterSpacing: "0.1em",
      cursor: disabled ? "not-allowed" : "pointer", fontFamily: "'DM Mono', monospace",
      transition: "all 0.2s"
    }}>
      {children}
    </button>
  )
}

function SectionLabel({ children }) {
  return (
    <div style={{ fontSize: "10px", color: "#555", letterSpacing: "0.2em", marginBottom: "10px", paddingBottom: "8px", borderBottom: "1px solid #1e1e2e" }}>
      {children}
    </div>
  )
}

function Loading() {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh", color: "#444", fontFamily: "'DM Mono', monospace", fontSize: "12px" }}>
      LOADING REVIEW...
    </div>
  )
}

const labelStyle = { display: "block", fontSize: "9px", color: "#555", letterSpacing: "0.15em", marginBottom: "8px" }
const inputStyle = {
  background: "#0a0a0f", border: "1px solid #1e1e2e", color: "#e8e6e0",
  padding: "10px 12px", fontSize: "12px", fontFamily: "'DM Mono', monospace",
  outline: "none", transition: "border-color 0.2s"
}
