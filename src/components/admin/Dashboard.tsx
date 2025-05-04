import React, { useState } from 'react';
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
} from 'recharts';
import {
  Users,
  Video,
  Clock,
  TrendingUp,
  Search,
  Filter,
  MoreVertical,
} from 'lucide-react';
import { formatDate } from '../../lib/utils';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export function AdminDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  const stats = [
    { name: 'Total Users', value: '156', icon: Users, change: '+12%' },
    { name: 'Active Submissions', value: '23', icon: Video, change: '+8%' },
    { name: 'Avg. Response Time', value: '1.2d', icon: Clock, change: '-25%' },
    { name: 'Completion Rate', value: '94%', icon: TrendingUp, change: '+3%' },
  ];

  const submissionData = [
    { name: 'Mon', submissions: 4 },
    { name: 'Tue', submissions: 6 },
    { name: 'Wed', submissions: 8 },
    { name: 'Thu', submissions: 5 },
    { name: 'Fri', submissions: 7 },
    { name: 'Sat', submissions: 3 },
    { name: 'Sun', submissions: 4 },
  ];

  const coachData = [
    { name: 'Sarah', value: 25 },
    { name: 'Michael', value: 18 },
    { name: 'Emma', value: 15 },
    { name: 'John', value: 12 },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.name}</p>
                <p className="text-2xl font-semibold">{stat.value}</p>
              </div>
              <div className="rounded-full p-3 bg-indigo-100">
                <stat.icon className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
            <div className="mt-2">
              <span
                className={`text-sm ${
                  stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {stat.change} vs last period
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Submissions Chart */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold">Submission Trends</h2>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="border rounded-md px-3 py-1 text-sm"
            >
              <option value="week">Last 7 days</option>
              <option value="month">Last 30 days</option>
              <option value="year">Last 12 months</option>
            </select>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={submissionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="submissions" fill="#4F46E5" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Coach Performance */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-semibold mb-6">Coach Performance</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={coachData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {coachData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {coachData.map((coach, index) => (
              <div key={coach.name} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span>{coach.name}</span>
                </div>
                <span>{coach.value} evaluations</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold">Recent Activity</h2>
          <div className="flex space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search activity..."
                className="pl-10 pr-4 py-2 border rounded-md"
              />
            </div>
            <button className="p-2 border rounded-md hover:bg-gray-50">
              <Filter className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {[1, 2, 3, 4, 5].map((item) => (
                <tr key={item} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-gray-200" />
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">User Name</div>
                        <div className="text-sm text-gray-500">user@example.com</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">Submitted video for review</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {formatDate(new Date())}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Completed
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-gray-400 hover:text-gray-500">
                      <MoreVertical className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}