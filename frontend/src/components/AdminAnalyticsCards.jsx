import React from 'react';
import { Users, BookOpen, GraduationCap, UserCheck, TrendingUp } from 'lucide-react';

const AdminAnalyticsCards = ({ analytics }) => {
  const cards = [
    {
      title: "Total Users",
      value: analytics?.totalUsers || 12,
      icon: Users,
      iconColor: "bg-purple-100 text-purple-600",
      change: "+12% from last month",
      changeColor: "text-green-600"
    },
    {
      title: "Total Tests", 
      value: analytics?.totalTests || 0,
      icon: BookOpen,
      iconColor: "bg-orange-100 text-orange-600",
      change: "+8% from last month",
      changeColor: "text-green-600"
    },
    {
      title: "Students",
      value: analytics?.totalStudents || 5,
      icon: GraduationCap,
      iconColor: "bg-purple-100 text-purple-600", 
      change: "+15% from last month",
      changeColor: "text-green-600"
    },
    {
      title: "Teachers",
      value: analytics?.totalTeachers || 2,
      icon: UserCheck,
      iconColor: "bg-green-100 text-green-600",
      change: "+5% from last month", 
      changeColor: "text-green-600"
    }
  ];

  return (
    <div className="space-y-4">
      {cards.map((card, index) => {
        const IconComponent = card.icon;
        return (
          <div key={index} className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`p-3 rounded-full ${card.iconColor} mr-4`}>
                  <IconComponent className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                </div>
              </div>
              <div className="flex items-center">
                <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                <p className={`text-sm font-medium ${card.changeColor}`}>
                  {card.change}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AdminAnalyticsCards;
