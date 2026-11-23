import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import APIsecSimulator from './APIsecSimulator.jsx';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <APIsecSimulator />
  </React.StrictMode>
);
