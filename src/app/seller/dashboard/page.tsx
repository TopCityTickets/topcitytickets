import React from 'react';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="ultra-dark-card w-full max-w-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black brand-text-gradient mb-4">Seller Dashboard</h1>
          <p className="text-slate-300">
            Welcome to your dashboard! Here you can manage your events and view your sales.
          </p>
        </div>
        {/* Additional dashboard content goes here */}
      </div>
    </div>
  );
}