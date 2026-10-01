import React from 'react';
import { createRoot } from 'react-dom/client';
import { DashboardApp } from './app';
import './app.css';

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root');
createRoot(root).render(
  <React.StrictMode>
    <DashboardApp />
  </React.StrictMode>,
);
