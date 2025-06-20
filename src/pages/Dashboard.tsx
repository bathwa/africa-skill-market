import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useAuthStore } from '@/stores/indexedDBAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import TokenPurchase from '@/components/TokenPurchase';
import { User, MapPin, Calendar, Coins } from 'lucide-react';

const Dashboard = () => {
  const { profile, logout } = useAuthStore();

  if (!profile) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p>Loading profile...</p>
        </div>
      </Layout>
    );
  }

  const getWelcomeMessage = () => {
    switch (profile.role) {
      case 'client':
        return 'Manage your projects and find service providers';
      case 'service_provider':
        return 'Discover opportunities and grow your business';
      case 'admin':
      case 'super_admin':
        return 'Manage platform operations and users';
      default:
        return 'Welcome to SkillZone Platform';
    }
  };

  const getQuickActions = () => {
    switch (profile.role) {
      case 'client':
        return [
          { title: 'Create Opportunity', description: 'Post a new project', href: '/client/create', icon: '📝' },
          { title: '管理 Opportunities', description: 'View and manage your projects', href: '/client/manage', icon: '📊' },
          { title: 'Service Providers', description: 'Browse service providers', href: '/providers', icon: '👥' },
        ];
      case 'service_provider':
        return [
          { title: 'Browse Opportunities', description: 'Find new projects', href: '/opportunities', icon: '🔍' },
          { title: 'Service Providers', description: 'View other providers', href: '/providers', icon: '👥' },
        ];
      case 'admin':
      case 'super_admin':
        return [
          { title: 'Admin Panel', description: 'Manage platform', href: '/admin', icon: '⚙️' },
          { title: 'All Opportunities', description: 'View all opportunities', href: '/opportunities', icon: '📋' },
          { title: 'All Providers', description: 'View all service providers', href: '/providers', icon: '👥' },
        ];
      default:
        return [];
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {profile.name}!
          </h1>
          <p className="text-gray-600 mt-2">{getWelcomeMessage()}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Role</p>
                  <p className="text-lg font-semibold text-gray-900 capitalize">
                    {profile.role.replace('_', ' ')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <MapPin className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Country</p>
                  <p className="text-lg font-semibold text-gray-900">{profile.country}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Coins className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Tokens</p>
                  <p className="text-lg font-semibold text-gray-900">{profile.tokens}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Member Since</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(profile.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {getQuickActions().map((action, index) => (
              <Link key={index} to={action.href}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      <span className="text-2xl mr-3">{action.icon}</span>
                      <h3 className="text-lg font-semibold text-gray-900">{action.title}</h3>
                    </div>
                    <p className="text-gray-600">{action.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Token Purchase Section */}
        <Card>
          <CardHeader>
            <CardTitle>Token Management</CardTitle>
            <CardDescription>
              Purchase tokens to access opportunities and services
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TokenPurchase />
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Dashboard;
