'use client';

import { useAuth } from '@/contexts/AuthContext';

export default function StudentDashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Student Dashboard
          </h1>
          <p className="text-gray-600 mb-4">
            Welcome, {user?.full_name || user?.username}!
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Role: {user?.role}
          </p>
          <button
            onClick={logout}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}