import React from "react";

export const Button = ({ children, className = "", ...props }) => {
  return (
    <button
      {...props}
      className={`bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded transition-colors ${className}`}
    >
      {children}
    </button>
  );
};
