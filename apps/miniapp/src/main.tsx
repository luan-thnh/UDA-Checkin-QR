import React from 'react';
import { createRoot } from 'react-dom/client';
import { MiniApp } from './app';
import 'zmp-ui/zaui.css';
import './app.css';

const root = document.getElementById('app');
if (!root) throw new Error('Missing #app');
createRoot(root).render(
  <React.StrictMode>
    <MiniApp />
  </React.StrictMode>,
);
