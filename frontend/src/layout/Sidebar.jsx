import { NavLink } from 'react-router-dom';

const navItems = [
  { path: '/', label: 'Dashboard' },
  { path: '/subjects', label: 'Subjects' },
  { path: '/teachers', label: 'Teachers' },
  { path: '/classes', label: 'Classes' },
  { path: '/labs', label: 'Labs' },
  { path: '/schedules', label: 'Schedules' },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-gray-800 text-white flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h2 className="font-bold text-lg">IPS Timetable</h2>
      </div>
      <nav className="flex-1 p-2">
        {navItems.map(({ path, label }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            className={({ isActive }) =>
              `block px-4 py-3 rounded mb-1 ${
                isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
