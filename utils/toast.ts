import toast from 'react-hot-toast';

/**
 * Toast notification helpers for consistent UX
 */

const enterpriseStyle = {
  background: '#FFFFFF',
  color: '#0F172A',
  fontWeight: '600',
  fontSize: '13px',
  padding: '12px 16px',
  borderRadius: '6px',
  border: '1px solid #E2E8F0',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
};

export const showSuccess = (message: string) => {
  toast.success(message, {
    duration: 4000,
    position: 'top-right',
    style: enterpriseStyle,
    iconTheme: {
      primary: '#10B981',
      secondary: '#FFFFFF',
    },
  });
};

export const showError = (message: string) => {
  toast.error(message, {
    duration: 5000,
    position: 'top-right',
    style: enterpriseStyle,
    iconTheme: {
      primary: '#EF4444',
      secondary: '#FFFFFF',
    },
  });
};

export const showLoading = (message: string) => {
  return toast.loading(message, {
    position: 'top-right',
    style: enterpriseStyle,
  });
};

export const showInfo = (message: string) => {
  toast(message, {
    duration: 4000,
    position: 'top-right',
    icon: 'ℹ️',
    style: enterpriseStyle,
  });
};
