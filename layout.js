import React from 'react';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-[#121212] text-white font-sans">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
        body {
          font-family: 'Inter', sans-serif;
        }
      `}</style>
      <main>{children}</main>
    </div>
  );
}
