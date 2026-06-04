import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from './firebase';
import { Sparkles, ArrowRight, ChevronDown } from 'lucide-react';
import './CourseModal.css';
import { API_BASE_URL } from './config';

const difficultyMap = { 'Beginner': 'BEGINNER', 'Intermediate': 'INTERMEDIATE', 'Advanced': 'ADVANCED' };

const CourseModal = ({ isOpen, onClose }) => {
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("Beginner");
  const [chapters, setChapters] = useState(5);
  const [includeYoutube, setIncludeYoutube] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [adaptiveLevel, setAdaptiveLevel] = useState(null);
  const navigate = useNavigate();

  // Fetch user's adaptive level and pre-fill difficulty
  useEffect(() => {
    if (!isOpen || !auth.currentUser) return;
    fetch(`${API_BASE_URL}/users/${auth.currentUser.uid}`)
      .then(r => r.json())
      .then(data => {
        if (data.cognitiveState) {
          const level = data.cognitiveState === 'BEGINNER' ? 'Beginner'
            : data.cognitiveState === 'INTERMEDIATE' ? 'Intermediate' : 'Advanced';
          setAdaptiveLevel(level);
          setDifficulty(level);
        }
      })
      .catch(() => {});
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!topic || isGenerating) return;

    setIsGenerating(true);
    try {
      const res = await fetch(`${API_BASE_URL}/courses/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: auth.currentUser ? auth.currentUser.uid : 'temp-user-id',
          topic,
          difficulty: difficultyMap[difficulty] || 'BEGINNER',
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
          <h2 className="modal-title">Create a course</h2>
          <p className="modal-subtitle">Tell us what you want to learn and we'll build it for you.</p>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>What do you want to learn?</label>
            <input
              type="text"
              placeholder="e.g. Machine Learning, Spanish, Photography"
              className="form-input"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>
                Difficulty
                {adaptiveLevel && (
                  <span className="adaptive-hint">Your level: {adaptiveLevel}</span>
                )}
              </label>
              <div className="select-wrapper">
                <select className="form-select" value={difficulty} onChange={e => setDifficulty(e.target.value)}>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
                <ChevronDown size={16} className="select-icon" />
              </div>
            </div>

            <div className="form-group">
              <label>Chapters</label>
              <input
                type="number"
                min={1}
                max={20}
                className="form-input"
                value={chapters}
                onChange={e => setChapters(Math.min(20, Math.max(1, Number(e.target.value))))}
                style={{ width: '100%', height: '42px', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="toggle-container">
              <div className="toggle-label">
                <span className="toggle-icon">▶</span>
                <span>Include YouTube videos</span>
              </div>
              <div className="toggle-switch">
                <input type="checkbox" checked={includeYoutube} onChange={e => setIncludeYoutube(e.target.checked)} />
                <span className="toggle-slider"></span>
              </div>
            </label>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={isGenerating}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isGenerating || !topic}>
              <Sparkles size={15} /> {isGenerating ? "Generating..." : "Generate Course"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CourseModal;
