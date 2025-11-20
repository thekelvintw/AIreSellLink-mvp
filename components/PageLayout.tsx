
import React, { ReactNode } from 'react';

interface PageLayoutProps {
  children: ReactNode;
}

const PageLayout: React.FC<PageLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-brand-light font-sans text-brand-dark">
      <main className="max-w-md mx-auto p-4 pt-6">
        {children}
      </main>
    </div>
  );
};

export default PageLayout;
