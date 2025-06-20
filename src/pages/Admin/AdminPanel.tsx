
import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { useAuthStore } from '@/stores/indexedDBAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Coins, Settings, BarChart3, Shield, AlertTriangle } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import UserManagement from '@/components/Admin/UserManagement';
import TokenManagement from '@/components/Admin/TokenManagement';
import EscrowManagement from '@/components/Admin/EscrowManagement';

const AdminPanel = () => {
  const { profile } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'tokens' | 'escrow'>('overview');

  // Redirect if not admin or super admin
  if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
    return <Navigate to="/dashboard" replace />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'users':
        return <UserManagement />;
      case 'tokens':
        return <TokenManagement />;
      case 'escrow':
        return <EscrowManagement />;
      default:
        return (
          <>
            {/* Admin Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Users className="h-4 w-4 mr-2 text-blue-600" />
                    Total Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs text-gray-600 mt-1">Registered users</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Coins className="h-4 w-4 mr-2 text-orange-600" />
                    Token Transactions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs text-gray-600 mt-1">Total transactions</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <BarChart3 className="h-4 w-4 mr-2 text-green-600" />
                    Service Providers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs text-gray-600 mt-1">Active providers</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2 text-red-600" />
                    Pending Reviews
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs text-gray-600 mt-1">Need attention</p>
                </CardContent>
              </Card>
            </div>

            {/* Admin Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>Manage users, roles, and permissions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => setActiveTab('users')}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Manage Users
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Token & Payment Management</CardTitle>
                  <CardDescription>Handle token purchases and payments</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => setActiveTab('tokens')}
                  >
                    <Coins className="h-4 w-4 mr-2" />
                    Token Management
                  </Button>
                </CardContent>
              </Card>

              {profile.role === 'super_admin' && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle>System Settings</CardTitle>
                      <CardDescription>Configure platform settings</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Button 
                        className="w-full" 
                        variant="outline"
                        onClick={() => setActiveTab('escrow')}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Escrow Accounts
                      </Button>
                      <Button className="w-full" variant="outline">
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Platform Settings
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Announcements</CardTitle>
                      <CardDescription>Manage platform announcements</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Button className="w-full" variant="outline">
                        Create Announcement
                      </Button>
                      <Button className="w-full" variant="outline">
                        View All Announcements
                      </Button>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </>
        );
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
              <p className="text-gray-600 mt-2">Manage SkillZone platform and users</p>
              {profile.role === 'super_admin' && (
                <div className="flex items-center mt-2 text-sm text-orange-600">
                  <Shield className="h-4 w-4 mr-1" />
                  Super Admin Access
                </div>
              )}
            </div>
            
            {activeTab !== 'overview' && (
              <Button
                variant="outline"
                onClick={() => setActiveTab('overview')}
              >
                Back to Overview
              </Button>
            )}
          </div>
          
          {activeTab !== 'overview' && (
            <div className="flex gap-2 mt-4">
              <Button
                variant={activeTab === 'users' ? 'default' : 'outline'}
                onClick={() => setActiveTab('users')}
              >
                Users
              </Button>
              <Button
                variant={activeTab === 'tokens' ? 'default' : 'outline'}
                onClick={() => setActiveTab('tokens')}
              >
                Tokens
              </Button>
              {profile.role === 'super_admin' && (
                <Button
                  variant={activeTab === 'escrow' ? 'default' : 'outline'}
                  onClick={() => setActiveTab('escrow')}
                >
                  Escrow
                </Button>
              )}
            </div>
          )}
        </div>

        {renderContent()}
      </div>
    </Layout>
  );
};

export default AdminPanel;
