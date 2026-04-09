import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// Storage shim: the prototype was built inside Claude's artifact runtime, which
// provides a special `window.storage` object. Real browsers don't have that, so
// we recreate it on top of the standard localStorage API. The shape matches
// what App.jsx expects: get(key) -> {value} | null, set(key, value) -> {value}.
if (typeof window !== 'undefined' && !window.storage) {
  window.storage = {
    get: async (key) => {
      const v = localStorage.getItem(key);
      return v !== null ? { value: v } : null;
    },
    set: async (key, value) => {
      localStorage.setItem(key, String(value));
      return { value };
    },
    delete: async (key) => {
      localStorage.removeItem(key);
      return { deleted: true };
    },
  };
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
