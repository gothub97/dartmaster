"use client";

import { forwardRef, useState } from "react";

const Input = forwardRef(({
  label,
  error,
  type = "text",
  className = "",
  required = false,
  showPasswordToggle = false,
  hint,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(false);

  const inputType = type === "password" && showPassword ? "text" : type;

  const baseInputClasses = "block w-full px-3 py-2.5 bg-white dark:bg-gray-900 border rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors duration-200";
  
  const borderClasses = error 
    ? "border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500"
    : focused
    ? "border-red-500 dark:border-red-400 focus:border-red-500 focus:ring-red-500"
    : "border-gray-300 dark:border-gray-600 focus:border-red-500 focus:ring-red-500";

  const inputClasses = `${baseInputClasses} ${borderClasses} ${className}`;

  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <input
          ref={ref}
          type={inputType}
          className={inputClasses}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
        
        {type === "password" && showPasswordToggle && (
          <button
            type="button"
            className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            onClick={togglePassword}
          >
            {showPassword ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        )}
      </div>
      
      {hint && !error && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{hint}</p>
      )}
      
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
});

Input.displayName = "Input";

export default Input;