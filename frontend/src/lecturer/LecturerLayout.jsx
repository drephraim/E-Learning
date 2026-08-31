import React, { useState } from 'react';
import LecturerSidebar from './LecturerSidebar';
import UploadMaterialModal from './UploadMaterialModal';
import './Lecturer.css';

const LecturerLayout = ({ children }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="lecturer-layout">
      <LecturerSidebar onOpenUploadModal={() => setIsModalOpen(true)} />
      {children}
      <UploadMaterialModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default LecturerLayout;
