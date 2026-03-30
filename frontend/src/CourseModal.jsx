import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from './firebase';
import './CourseModal.css';

const CourseModal = ({ isOpen, onClose }) => {
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("Beginner");
  const [chapters, setChapters] = useState(5);
  const [includeYoutube, setIncludeYoutube] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!topic || isGenerating) return;

    setIsGenerating(true);
    try {
      const res = await fetch('http://localhost:3000/courses/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: auth.currentUser ? auth.currentUser.uid : 'temp-user-id',
          topic,
          difficulty,
          chapters,
          includeYoutube
        })
      });
      const data = await res.json();
      
      if (data.success) {
        onClose();
        navigate(`/course/${data.courseId}`);
      } else {
        alert(data.message || "Generation failed");
      }
    } catch (err) {
      console.error(err);
      alert("Error generating course. Is the backend running?");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>

        <div className="modal-header">
          <div className="ai-badge">
            <span className="badge-dot"></span> AI ENGINE V1.0
          </div>
          <h2 className="modal-title">Generate a Course</h2>
          <p className="modal-subtitle">Define your learning path with neural precision.</p>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>COURSE TITLE</label>
            <input
              type="text"
              placeholder="e.g., Advanced Quantum Mechanics"
              className="form-input"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group half">
              <label>DIFFICULTY LEVEL</label>
              <div className="select-wrapper">
                <select className="form-select" value={difficulty} onChange={e => setDifficulty(e.target.value)}>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
            </div>

            <div className="form-group half">
              <label>CHAPTERS</label>
              <div className="select-wrapper">
                <select className="form-select" value={chapters} onChange={e => setChapters(Number(e.target.value))}>
                  <option value={3}>3 Chapters</option>
                  <option value={5}>5 Chapters</option>
                  <option value={10}>10 Chapters</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-group">
            <div className="label-row">
              <label>MULTIMEDIA INTEGRATION</label>
            </div>
            <label className="toggle-container">
              <div className="toggle-label">
                <span className="input-icon">▶</span>
                <span>Include YouTube tutorial videos</span>
              </div>
              <div className="toggle-switch">
                <input type="checkbox" checked={includeYoutube} onChange={e => setIncludeYoutube(e.target.checked)} />
                <span className="slider"></span>
              </div>
            </label>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={isGenerating}>
              CANCEL
            </button>
            <button type="submit" className="btn-generate" disabled={isGenerating}>
              <span className="sparkles">✨</span> {isGenerating ? "GENERATING..." : "GENERATE COURSE"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CourseModal;
