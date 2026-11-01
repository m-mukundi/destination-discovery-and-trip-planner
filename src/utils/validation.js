// Same rules as the backend (auth_routes.py). The backend always re-checks.

export const validateEmail = (value) => {
  const email = value.trim();
  if (!email) return 'Email is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address';
  return '';
};

export const validatePassword = (value) => {
  if (value.length < 8) return 'Password must be at least 8 characters';
  if (value.length > 128) return 'Password must be at most 128 characters';
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) {
    return 'Password must include a letter and a number';
  }
  return '';
};

export const validateRequired = (value, label) =>
  value.trim() ? '' : `${label} is required`;
