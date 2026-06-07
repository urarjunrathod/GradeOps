import { useState } from "react"
import { useAuth, API } from "../App"

const EMPTY_RUBRIC = [{ question_number: 1, max_marks: 10, criteria: "" }]

export default function UploadPage() {
  const { token, navigate } = useAuth()
  const [title, setTitle] = useState("")
  const [rubric, setRubric] = useState(EMPTY_RUBRIC)
  const [files, setFiles] = useState([])
  const [status, setStatus] = useState(null) // null | "uploading" | "done" | "error"
  const [result, setResult] = useState(null)
  const [error, setError] = useState("")

  const addRubricRow = () =>
    setRubric(r => [...r, { question_number: r.length + 1, max_marks: 10, criteria: "" }])

  const removeRubricRow = (i) =>
    setRubric(r => r.filter((_, idx) => idx !== i).map((item, idx) => ({ ...item, question_number: idx + 1 })))

  const updateRubric = (i, field, value) =>
    setRubric(r => r.map((item, idx) => idx === i ? { ...item, [field]: value } : item))

  const handleUpload = async () => {
    if (!title.trim()) return setError("Please enter an exam title")
    if (files.length === 0) return setError("Please upload at least one exam PDF")
    if (rubric.some(r => !r.criteria.trim())) return setError("Please fill in all rubric criteria")

    setError("")
    setStatus("uploading")

    const formData = new FormData()
    formData.append("exam_title", title)
    formData.append("rubric_json", JSON.stringify(rubric))
    for (const file of files) formData.append("files", file)

    try {
      const res = await fetch(`${API}/exams/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || "Upload failed")
      setResult(data)
      setStatus("done")
    } catch (err) {
      setError(err.message)
      setStatus("error")
    }
  }

  if (status === "done") return <SuccessPage result={result} navigate={navigate} />

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "48px 32px", fontFamily: "'DM Mono', monospace" }}>

      <div style={{ marginBottom: "40px" }}>
        <div style={{ fontSize: "10px", color: "#555", letterSpacing: "0.2em", marginBottom: "12px" }}>
          GRADEOPS / UPLOAD EXAM
        </div>
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#e8e6e0", margin: 0 }}>
          New Exam Upload
        </h1>
      </div>

      {/* Exam title */}
      <Section label="01 — EXAM TITLE">
        <input
          value={title} onChange={e => setTitle(e.target.value)}
          placeholder="e.g. CS301 Mid-Semester 2026"
          style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }}
          onFocus={e => e.target.style.borderColor = "#c8ff00"}
          onBlur={e => e.target.style.borderColor = "#1e1e2e"}
        />
      </Section>

      {/* Rubric builder */}
      <Section label="02 — GRADING RUBRIC">
        <div style={{ fontSize: "11px", color: "#444", marginBottom: "16px", letterSpacing: "0.05em" }}>
          Define how each question should be graded. The AI will use these criteria.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {rubric.map((row, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "60px 90px 1fr 36px", gap: "10px", alignItems: "start" }}>
              <div style={{ background: "#0a0a0f", border: "1px solid #1e1e2e", padding: "12px 8px", textAlign: "center", color: "#c8ff00", fontSize: "12px" }}>
                Q{row.question_number}
              </div>
              <div>
                <div style={{ fontSize: "9px", color: "#444", letterSpacing: "0.1em", marginBottom: "4px" }}>MAX MARKS</div>
                <input
                  type="number" value={row.max_marks}
                  onChange={e => updateRubric(i, "max_marks", parseFloat(e.target.value))}
                  style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }}
                  onFocus={e => e.target.style.borderColor = "#c8ff00"}
                  onBlur={e => e.target.style.borderColor = "#1e1e2e"}
                />
              </div>
              <div>
                <div style={{ fontSize: "9px", color: "#444", letterSpacing: "0.1em", marginBottom: "4px" }}>GRADING CRITERIA</div>
                <input
                  value={row.criteria}
                  onChange={e => updateRubric(i, "criteria", e.target.value)}
                  placeholder="e.g. Full marks for correct formula + working. Partial credit for method only."
                  style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }}
                  onFocus={e => e.target.style.borderColor = "#c8ff00"}
                  onBlur={e => e.target.style.borderColor = "#1e1e2e"}
                />
              </div>
              <button
                onClick={() => removeRubricRow(i)}
                disabled={rubric.length === 1}
                style={{
                  background: "transparent", border: "1px solid #2a1a1a", color: "#663",
                  width: "36px", height: "42px", cursor: "pointer", fontSize: "14px",
                  marginTop: "18px", opacity: rubric.length === 1 ? 0.3 : 1
                }}
              >×</button>
            </div>
          ))}
        </div>
        <button onClick={addRubricRow} style={{
          marginTop: "12px", background: "transparent", border: "1px dashed #333",
          color: "#555", padding: "10px 20px", fontSize: "11px", cursor: "pointer",
          letterSpacing: "0.1em", fontFamily: "'DM Mono', monospace", width: "100%"
        }}>
          + ADD QUESTION
        </button>
      </Section>

      {/* File upload */}
      <Section label="03 — EXAM SCANS (PDFs)">
        <div style={{ fontSize: "11px", color: "#444", marginBottom: "16px", letterSpacing: "0.05em" }}>
          Upload one PDF per student. Files will be named automatically (STU001, STU002...).
        </div>
        <label style={{
          display: "block", border: "2px dashed #333", padding: "32px",
          textAlign: "center", cursor: "pointer",
          background: files.length > 0 ? "#0f1a0f" : "#0a0a0f",
          borderColor: files.length > 0 ? "#3a7a3a" : "#333"
        }}>
          <input
            type="file" multiple accept=".pdf" style={{ display: "none" }}
            onChange={e => setFiles(Array.from(e.target.files))}
          />
          {files.length === 0 ? (
            <div>
              <div style={{ fontSize: "24px", marginBottom: "12px" }}>📄</div>
              <div style={{ fontSize: "12px", color: "#555", letterSpacing: "0.1em" }}>
                CLICK TO SELECT PDFs
              </div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: "18px", color: "#c8ff00", fontWeight: 700, marginBottom: "8px" }}>
                {files.length} FILES SELECTED
              </div>
              <div style={{ fontSize: "11px", color: "#555" }}>
                {files.slice(0, 5).map(f => f.name).join(", ")}
                {files.length > 5 ? ` +${files.length - 5} more` : ""}
              </div>
            </div>
          )}
        </label>
      </Section>

      {error && (
        <div style={{ background: "#1a0f0f", border: "1px solid #4a1e1e", color: "#ff6b6b", padding: "14px", fontSize: "12px", marginBottom: "24px", letterSpacing: "0.05em" }}>
          ⚠ {error}
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={status === "uploading"}
        style={{
          width: "100%", background: status === "uploading" ? "#555" : "#c8ff00",
          color: "#0a0a0f", border: "none", padding: "16px",
          fontSize: "13px", fontWeight: 700, letterSpacing: "0.2em",
          cursor: status === "uploading" ? "not-allowed" : "pointer",
          fontFamily: "'DM Mono', monospace"
        }}
      >
        {status === "uploading" ? "⏳ PROCESSING WITH AI..." : "UPLOAD & GRADE →"}
      </button>
    </div>
  )
}

function Section({ label, children }) {
  return (
    <div style={{ marginBottom: "36px" }}>
      <div style={{ fontSize: "10px", color: "#c8ff00", letterSpacing: "0.2em", marginBottom: "16px", paddingBottom: "10px", borderBottom: "1px solid #1e1e2e" }}>
        {label}
      </div>
      {children}
    </div>
  )
}

function SuccessPage({ result, navigate }) {
  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "80px 32px", textAlign: "center", fontFamily: "'DM Mono', monospace" }}>
      <div style={{ fontSize: "48px", marginBottom: "24px" }}>✅</div>
      <div style={{ fontSize: "20px", fontWeight: 700, color: "#c8ff00", marginBottom: "12px", letterSpacing: "0.1em" }}>
        UPLOAD COMPLETE
      </div>
      <div style={{ fontSize: "13px", color: "#555", marginBottom: "8px" }}>
        Exam ID: <span style={{ color: "#e8e6e0" }}>{result.exam_id}</span>
      </div>
      <div style={{ fontSize: "13px", color: "#555", marginBottom: "40px" }}>
        {result.submissions?.length} exams processed and graded by AI
      </div>
      <button onClick={() => navigate("exam", { examId: result.exam_id })} style={{
        background: "#c8ff00", color: "#0a0a0f", border: "none",
        padding: "14px 32px", fontSize: "12px", fontWeight: 700,
        letterSpacing: "0.15em", cursor: "pointer", fontFamily: "'DM Mono', monospace"
      }}>
        REVIEW GRADES →
      </button>
    </div>
  )
}

const inputStyle = {
  background: "#0a0a0f", border: "1px solid #1e1e2e",
  color: "#e8e6e0", padding: "12px 14px", fontSize: "13px",
  fontFamily: "'DM Mono', monospace", outline: "none", transition: "border-color 0.2s"
}
