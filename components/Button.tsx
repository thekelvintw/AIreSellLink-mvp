
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  variant?: 'primary' | 'secondary' | 'outline';
}

const Button: React.FC<ButtonProps> = ({ label, variant = 'primary', className = '', ...props }) => {
  const baseClasses =
    'w-full rounded-lg py-3 font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:bg-gray-200 disabled:text-gray-500 disabled:border disabled:border-gray-300 disabled:cursor-not-allowed disabled:hover:bg-gray-200 disabled:focus:ring-0';

  const variantClasses = {
    primary: 'bg-brand-dark text-white hover:bg-gray-800 focus:ring-brand-dark',
    secondary: 'bg-brand-accent text-white hover:bg-orange-600 focus:ring-brand-accent',
    outline: 'bg-transparent text-brand-dark border border-brand-dark hover:bg-gray-100 focus:ring-brand-dark',
  };

  return (
    <button className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...props}>
      {label}
    </button>
  );
};

export default Button;
