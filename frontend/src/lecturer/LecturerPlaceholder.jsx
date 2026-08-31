import React from 'react';
import { Sparkles, Layers } from 'lucide-react';

const LecturerPlaceholder = ({ title, subtitle }) => {
  return (
    <div className="lecturer-content">
      <div className="lecturer-header-badge">
        <Sparkles size={12} /> Academic Portal
      </div>
      <h1 className="lecturer-greeting">{title}</h1>
      <p className="lecturer-subtitle" style={{ marginBottom: 32 }}>
        {subtitle || 'This module is scheduled for Phase 2 implementation.'}
      </p>

      <div className="lecturer-section" style={{ textAlign: 'center', padding: '64px 24px' }}>
        <div className="empty-state-icon" style={{ background: 'rgba(129, 140, 248, 0.12)', color: '#818cf8' }}>
          <Layers size={32} />
        </div>
        <h3 className="empty-state-title" style={{ fontSize: '1.2rem', marginTop: 16 }}>
          {title} Module Architecture Ready
        </h3>
        <p className="empty-state-text" style={{ maxWidth: 520, margin: '12px auto 0' }}>
          The foundation for {title.toLowerCase()} and academic material management is set up in Phase 1. 
          Detailed syllabus ingestion, Retrieval-Augmented Generation (RAG), and content validation pipelines will be enabled in subsequent upgrade phases.
        </p>
      </div>
    </div>
  );
};

export default LecturerPlaceholder;
