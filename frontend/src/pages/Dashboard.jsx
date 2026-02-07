import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import SummaryCard from '../components/SummaryCard';
import Loader from '../components/Loader';
import * as dashboardApi from '../services/dashboardApi';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [sessionsPerWeek, setSessionsPerWeek] = useState([]);
  const [subjectDistribution, setSubjectDistribution] = useState([]);
  const [teacherWorkload, setTeacherWorkload] = useState([]);

  useEffect(() => {
    dashboardApi
      .getDashboardStats()
      .then((res) => {
        setStats(res.stats);
        setSessionsPerWeek(res.sessionsPerWeek || []);
        setSubjectDistribution(res.subjectDistribution || []);
        setTeacherWorkload(res.teacherWorkload || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-6">Dashboard</h2>

      {/* Summary Cards - grid layout */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <SummaryCard
          label="Total Subjects"
          value={stats?.subjects ?? 0}
          icon={<span className="text-xl">📚</span>}
        />
        <SummaryCard
          label="Total Teachers"
          value={stats?.teachers ?? 0}
          icon={<span className="text-xl">👨‍🏫</span>}
        />
        <SummaryCard
          label="Total Classes"
          value={stats?.classes ?? 0}
          icon={<span className="text-xl">🏫</span>}
        />
        <SummaryCard
          label="Total Labs"
          value={stats?.labs ?? 0}
          icon={<span className="text-xl">🔬</span>}
        />
        <SummaryCard
          label="Total Sessions"
          value={stats?.sessions ?? 0}
          icon={<span className="text-xl">📅</span>}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart - Sessions per week */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Sessions per Day</h3>
          <div className="h-64">
            {sessionsPerWeek.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sessionsPerWeek}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" name="Sessions" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No session data
              </div>
            )}
          </div>
        </div>

        {/* Pie Chart - Subject distribution */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Subject Distribution</h3>
          <div className="h-64">
            {subjectDistribution.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={subjectDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {subjectDistribution.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No subject distribution data
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Line Chart - Teacher workload */}
      <div className="mt-6 bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Teacher Workload (Top 10)</h3>
        <div className="h-64">
          {teacherWorkload.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={teacherWorkload}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="sessions"
                  stroke="#3b82f6"
                  name="Sessions"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              No teacher workload data
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
