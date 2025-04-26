
export const validatePassword = (password: string) => {
  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasUpperCase = /[A-Z]/.test(password);
  
  return {
    isValid: hasMinLength && hasNumber && hasUpperCase,
    hasMinLength,
    hasNumber,
    hasUpperCase
  };
};
