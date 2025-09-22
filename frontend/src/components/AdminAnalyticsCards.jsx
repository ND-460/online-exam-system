import React from 'react';
import { motion } from 'framer-motion';
import { 
  Download, 
  Users, 
  BookOpen, 
  GraduationCap, 
  BarChart3,
  TrendingUp,
  Activity,
  PieChart
} from 'lucide-react';

const AdminAnalyticsCards = ({ 
  analytics = {}, 
  loading = false, 
  onDownload = () => {} 
}) => {
  // Default data structure with sample data for demonstration
  const defaultAnalytics = {
    totalUsers: 1250,
    totalTests: 45,
    totalStudents: 980,
    totalTeachers: 85,
    activeUsers: 1100,
    completedTests: 38,
    pendingUsers: 12,
    systemHealth: 98
  };

  const data = { ...defaultAnalytics, ...analytics };

  const cards = [
    {
      id: 'users',
      title: 'Total Users',
      value: data.totalUsers || 0,
      trend: '+12% from last month',
      icon: <Users className="w-6 h-6" />,
      color: 'purple',
      bgColor: 'bg-purple-50',
      iconBg: 'bg-purple-100',
      textColor: 'text-purple-600',
      accentColor: 'border-l-purple-500'
    },
    {
      id: 'tests',
      title: 'Total Tests',
      value: data.totalTests || 0,
      trend: '+8% from last month',
      icon: <BookOpen className="w-6 h-6" />,
      color: 'orange',
      bgColor: 'bg-orange-50',
      iconBg: 'bg-orange-100',
      textColor: 'text-orange-600',
      accentColor: 'border-l-orange-500'
    },
    {
      id: 'students',
      title: 'Students',
      value: data.totalStudents || 0,
      trend: '+15% from last month',
      icon: <GraduationCap className="w-6 h-6" />,
      color: 'purple',
      bgColor: 'bg-purple-50',
      iconBg: 'bg-purple-100',
      textColor: 'text-purple-600',
      accentColor: 'border-l-purple-500'
    },
    {
      id: 'teachers',
      title: 'Teachers',
      value: data.totalTeachers || 0,
      trend: '+5% from last month',
      icon: <Users className="w-6 h-6" />,
      color: 'teal',
      bgColor: 'bg-teal-50',
      iconBg: 'bg-teal-100',
      textColor: 'text-teal-600',
      accentColor: 'border-l-teal-500'
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border-l-4 border-gray-200 p-6 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <motion.div
          key={card.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`bg-white rounded-lg shadow-sm border-l-4 ${card.accentColor} p-6 hover:shadow-md transition-shadow duration-200`}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">{card.title}</p>
              <p className="text-3xl font-bold text-gray-900 mb-1">
                {card.value.toLocaleString()}
              </p>
              <p className="text-sm text-green-600 font-medium">{card.trend}</p>
            </div>
            <div className={`w-12 h-12 ${card.iconBg} rounded-full flex items-center justify-center`}>
              <div className={card.textColor}>
                {card.icon}
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default AdminAnalyticsCards;
