import toast from 'react-hot-toast';

/**
 * Toast notification helpers for consistent UX
 */

export const showSuccess = (message: string) => {
  toast.success(message, {
    duration: 4000,
    position: 'top-right',
    style: {
      background: '#10b981',
      color: '#fff',
      fontWeight: '600',
      fontSize: '14px',
      padding: '12px 16px',
      borderRadius: '12px',
    },
    iconTheme: {
      primary: '#fff',
      secondary: '#10b981',
    },
  });
};

export const showError = (message: string) => {
  toast.error(message, {
    duration: 5000,
    position: 'top-right',
    style: {
      background: '#ef4444',
      color: '#fff',
      fontWeight: '600',
      fontSize: '14px',
      padding: '12px 16px',
      borderRadius: '12px',
    },
    iconTheme: {
      primary: '#fff',
      secondary: '#ef4444',
    },
  });
};

export const showLoading = (message: string) => {
  return toast.loading(message, {
    position: 'top-right',
    style: {
      background: '#3b82f6',
      color: '#fff',
      fontWeight: '600',
      fontSize: '14px',
      padding: '12px 16px',
      borderRadius: '12px',
    },
  });
};

export const showInfo = (message: string) => {
  toast(message, {
    duration: 4000,
    position: 'top-right',
    icon: 'ℹ️',
    style: {
      background: '#3b82f6',
      color: '#fff',
      fontWeight: '600',
      fontSize: '14px',
      padding: '12px 16px',
      borderRadius: '12px',
    },
  });
};
