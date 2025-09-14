import * as React from "react"

const getVariantClasses = (variant) => {
  switch (variant) {
    case 'secondary':
      return 'border-transparent bg-gray-100 text-gray-800 hover:bg-gray-200';
    case 'destructive':
      return 'border-transparent bg-red-100 text-red-800 hover:bg-red-200';
    case 'outline':
      return 'border-gray-300 text-gray-700';
    default:
      return 'border-transparent bg-blue-100 text-blue-800 hover:bg-blue-200';
  }
};

function Badge({ className = "", variant = "default", ...props }) {
  const variantClasses = getVariantClasses(variant);
  
  return (
    <div 
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors ${variantClasses} ${className}`} 
      {...props} 
    />
  )
}

export { Badge }