import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster, ToastBar, toast } from 'react-hot-toast';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import './index.css';

function ToastWithClose() {
  return (t) => (
    <ToastBar toast={t} position={t.position || 'top-right'}>
      {({ icon, message }) => (
        <>
          {icon}
          {message}
          <button
            type="button"
            onClick={() => toast.dismiss(t.id)}
            aria-label="Close"
            className="toast-close-btn"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </>
      )}
    </ToastBar>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster position="top-right" toastOptions={{ className: 'toast-with-close' }}>
          {ToastWithClose()}
        </Toaster>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
