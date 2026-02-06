import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <h1 className="text-lg font-semibold text-gray-800">
        IPS Academy Timetable Management
      </h1>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">{user?.email}</span>
        <button
          onClick={logout}
          className="px-3 py-1.5 text-sm bg-gray-200 hover:bg-gray-300 rounded"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
