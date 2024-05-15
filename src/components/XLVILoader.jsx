// Loader.js
import React from 'react';
import './XLVILoader.css';

const XLVILoader = () => {
  return (
    <div className="loader-container">
      <div className="loader"></div>
      <div style={{color:"#fff"}}>Event Loop</div>
    </div>
  );
};

export default XLVILoader;
