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
    <div className="grid grid-cols-4 gap-6 mb-8">
      {cards.map((card, index) => {
        const IconComponent = card.icon;
  return (
          <div key={index} className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
            <div className="flex items-center justify-between">
        <div className="flex items-center">
                <div className={`p-4 rounded-full ${card.iconColor}`}>
                  <IconComponent className="w-8 h-8" />
          </div>
                <div className="ml-6">
                  <p className="text-base font-medium text-gray-600">{card.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{card.value}</p>
          </div>
        </div>
      </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
              <p className={`text-base font-medium ${card.changeColor}`}>
                {card.change}
              </p>
      </div>
          </div>
        );
      })}
    </div>
  );
};

export default AdminAnalyticsCards;
