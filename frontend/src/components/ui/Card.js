"use client";

const Card = ({ children, className = "", padding = "md", ...props }) => {
  const paddingClasses = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8"
  };

  const baseClasses = "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm";
  const classes = `${baseClasses} ${paddingClasses[padding]} ${className}`;

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

const CardHeader = ({ children, className = "", ...props }) => (
  <div className={`pb-4 border-b border-gray-200 dark:border-gray-700 ${className}`} {...props}>
    {children}
  </div>
);

const CardTitle = ({ children, className = "", ...props }) => (
  <h3 className={`text-lg font-semibold text-gray-900 dark:text-gray-100 ${className}`} {...props}>
    {children}
  </h3>
);

const CardDescription = ({ children, className = "", ...props }) => (
  <p className={`text-sm text-gray-600 dark:text-gray-400 mt-1 ${className}`} {...props}>
    {children}
  </p>
);

const CardContent = ({ children, className = "", ...props }) => (
  <div className={`pt-4 ${className}`} {...props}>
    {children}
  </div>
);

const CardFooter = ({ children, className = "", ...props }) => (
  <div className={`pt-4 border-t border-gray-200 dark:border-gray-700 ${className}`} {...props}>
    {children}
  </div>
);

Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Description = CardDescription;
Card.Content = CardContent;
Card.Footer = CardFooter;

export default Card;