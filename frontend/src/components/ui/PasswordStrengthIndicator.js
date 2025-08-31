"use client";

import { getPasswordStrength, getPasswordStrengthInfo } from "@/utils/validation";

const PasswordStrengthIndicator = ({ password, className = "" }) => {
  const strength = getPasswordStrength(password);
  const { text, color, bgColor } = getPasswordStrengthInfo(strength);
  
  if (!password) return null;

  return (
    <div className={`mt-2 ${className}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-600 dark:text-gray-400">
          Password strength
        </span>
        <span className={`text-xs font-medium ${color}`}>
          {text}
        </span>
      </div>
      
      <div className="flex space-x-1">
        {[0, 1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={`h-2 flex-1 rounded-full transition-colors ${
              level <= strength 
                ? bgColor 
                : "bg-gray-200 dark:bg-gray-700"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default PasswordStrengthIndicator;