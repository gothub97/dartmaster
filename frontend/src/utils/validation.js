/**
 * Validation utilities for forms
 */

/**
 * Validate email format
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * Requirements: At least 8 characters, one uppercase, one lowercase, one number
 */
export const validatePassword = (password) => {
  const errors = [];
  
  if (password.length < 8) {
    errors.push("At least 8 characters long");
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push("At least one uppercase letter");
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push("At least one lowercase letter");
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push("At least one number");
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    strength: getPasswordStrength(password)
  };
};

/**
 * Calculate password strength score (0-4)
 */
export const getPasswordStrength = (password) => {
  let score = 0;
  
  // Length
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  
  // Character types
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  
  // Reduce score if password is too simple
  if (/^(.)\1{7,}$/.test(password)) score -= 2; // All same character
  if (/^(012|123|234|345|456|567|678|789|890|abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/.test(password.toLowerCase())) {
    score -= 1; // Sequential characters
  }
  
  return Math.max(0, Math.min(4, score));
};

/**
 * Get password strength text and color
 */
export const getPasswordStrengthInfo = (strength) => {
  const strengthMap = {
    0: { text: "Very Weak", color: "text-red-600", bgColor: "bg-red-500" },
    1: { text: "Weak", color: "text-red-500", bgColor: "bg-red-400" },
    2: { text: "Fair", color: "text-yellow-500", bgColor: "bg-yellow-400" },
    3: { text: "Good", color: "text-blue-500", bgColor: "bg-blue-400" },
    4: { text: "Strong", color: "text-green-500", bgColor: "bg-green-400" }
  };
  
  return strengthMap[strength] || strengthMap[0];
};

/**
 * Validate name (minimum 2 characters, no special characters except spaces, hyphens, apostrophes)
 */
export const validateName = (name) => {
  if (!name || name.trim().length < 2) {
    return { isValid: false, error: "Name must be at least 2 characters long" };
  }
  
  if (name.trim().length > 50) {
    return { isValid: false, error: "Name must be less than 50 characters" };
  }
  
  const nameRegex = /^[a-zA-Z\s'-]+$/;
  if (!nameRegex.test(name.trim())) {
    return { isValid: false, error: "Name can only contain letters, spaces, hyphens, and apostrophes" };
  }
  
  return { isValid: true };
};

/**
 * General form validation helper
 */
export const validateForm = (data, rules) => {
  const errors = {};
  let isValid = true;
  
  Object.keys(rules).forEach(field => {
    const value = data[field];
    const rule = rules[field];
    
    // Required field validation
    if (rule.required && (!value || value.toString().trim() === "")) {
      errors[field] = `${rule.label || field} is required`;
      isValid = false;
      return;
    }
    
    // Skip other validations if field is empty and not required
    if (!value || value.toString().trim() === "") {
      return;
    }
    
    // Email validation
    if (rule.type === "email" && !validateEmail(value)) {
      errors[field] = "Please enter a valid email address";
      isValid = false;
    }
    
    // Password validation
    if (rule.type === "password") {
      const passwordValidation = validatePassword(value);
      if (!passwordValidation.isValid) {
        errors[field] = `Password must have: ${passwordValidation.errors.join(", ")}`;
        isValid = false;
      }
    }
    
    // Name validation
    if (rule.type === "name") {
      const nameValidation = validateName(value);
      if (!nameValidation.isValid) {
        errors[field] = nameValidation.error;
        isValid = false;
      }
    }
    
    // Custom validation function
    if (rule.validator) {
      const customValidation = rule.validator(value, data);
      if (!customValidation.isValid) {
        errors[field] = customValidation.error;
        isValid = false;
      }
    }
  });
  
  return { isValid, errors };
};