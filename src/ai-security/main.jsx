import React from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import AISecuritySimulator from './AISecuritySimulator.jsx';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AISecuritySimulator />
  </React.StrictMode>
);
