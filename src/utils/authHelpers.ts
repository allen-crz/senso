// Authentication helper utilities

export const getStoredToken = (): string | null => {
  return localStorage.getItem('access_token');
};

export const getStoredUser = (): any | null => {
  const userData = localStorage.getItem('user_data');
  return userData ? JSON.parse(userData) : null;
};

export const isTokenValid = (): boolean => {
  const token = getStoredToken();
  const expiresIn = localStorage.getItem('expires_in');
  
  if (!token) return false;
  
  // Simple token validation - if expires_in exists, check it
  if (expiresIn) {
    const expirationTime = parseInt(expiresIn) * 1000; // Convert to milliseconds
    const now = Date.now();
    // This is a simplified check - in practice you'd need to track when the token was issued
    return now < expirationTime;
  }
  
  // If no expiration info, assume token exists = valid (backend will reject if invalid)
  return true;
};

export const clearAuthData = (): void => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('token_type');
  localStorage.removeItem('expires_in');
  localStorage.removeItem('user_data');
};

export const logAuthState = (): void => {
  console.log('=== Auth State Debug ===');
  console.log('Token:', getStoredToken() ? 'Present' : 'Missing');
  console.log('Token Type:', localStorage.getItem('token_type'));
  console.log('User Data:', getStoredUser());
  console.log('Expires In:', localStorage.getItem('expires_in'));
  console.log('========================');
};