import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { createRoot } from 'react-dom/client';
import { MiniApp } from './app';
const root = document.getElementById('root');
if (!root)
    throw new Error('Missing #root');
createRoot(root).render(_jsx(React.StrictMode, { children: _jsx(MiniApp, {}) }));
