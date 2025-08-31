export const PracticeIcon = ({ type, className = "w-12 h-12" }) => {
  switch (type) {
    case "target":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
          <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1.5"/>
          <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5"/>
          <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
        </svg>
      );
    
    case "flag":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 21V3.93689C5 3.93689 5.5 3 6.5 3C7.5 3 8 4 9 4C10 4 11 3 12 3C13 3 14 4 15 4C16 4 17 3 18 3C19 3 19 3.93689 19 3.93689V13C19 13 18.5 14 17.5 14C16.5 14 16 13 15 13C14 13 13 14 12 14C11 14 10 13 9 13C8 13 7.5 14 6.5 14C5.5 14 5 13 5 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M5 21H5.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      );
    
    case "sparkles":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L13.09 8.26L19 9L13.09 9.74L12 16L10.91 9.74L5 9L10.91 8.26L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M5 19L5.45 21.1L7.5 21.5L5.45 21.9L5 24L4.55 21.9L2.5 21.5L4.55 21.1L5 19Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M19 5L19.45 7.1L21.5 7.5L19.45 7.9L19 10L18.55 7.9L16.5 7.5L18.55 7.1L19 5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    
    case "clock":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M12 7V12L15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="12" cy="3" r="0.5" fill="currentColor"/>
          <circle cx="19.5" cy="6.5" r="0.5" fill="currentColor"/>
          <circle cx="21" cy="12" r="0.5" fill="currentColor"/>
          <circle cx="19.5" cy="17.5" r="0.5" fill="currentColor"/>
          <circle cx="12" cy="21" r="0.5" fill="currentColor"/>
          <circle cx="4.5" cy="17.5" r="0.5" fill="currentColor"/>
          <circle cx="3" cy="12" r="0.5" fill="currentColor"/>
          <circle cx="4.5" cy="6.5" r="0.5" fill="currentColor"/>
        </svg>
      );
    
    case "trophy":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 9H4C3.44772 9 3 8.55228 3 8V6C3 5.44772 3.44772 5 4 5H6M6 9V5M6 9C6 11.8284 7.5 14 10 14.8284M18 9H20C20.5523 9 21 8.55228 21 8V6C21 5.44772 20.5523 5 20 5H18M18 9V5M18 9C18 11.8284 16.5 14 14 14.8284M6 5H18M10 14.8284V18M10 14.8284C10.7659 15.1325 11.5979 15.3 12.5 15.3C13.329 15.3 14.1022 15.1546 14.8284 14.8853M14 14.8284V18M10 18H14M10 18C9 18 8 19 8 20C8 21 9 21 10 21H14C15 21 16 21 16 20C16 19 15 18 14 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    
    default:
      return null;
  }
};

export default PracticeIcon;