import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';

// Safe Window.fetch setter patch to handle environment getter-only fetch property
try {
  const win = typeof window !== 'undefined' ? window : globalThis;
  const proto = Object.getPrototypeOf(win) || win;
  const desc = Object.getOwnPropertyDescriptor(proto, 'fetch') || Object.getOwnPropertyDescriptor(win, 'fetch');
  if (desc && desc.get && !desc.set) {
    let currentFetch = desc.get.call(win);
    Object.defineProperty(win, 'fetch', {
      get: () => currentFetch,
      set: (fn) => { currentFetch = fn; },
      configurable: true,
      enumerable: true
    });
  }
} catch (e) {
  // Safe fallback
}

import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
