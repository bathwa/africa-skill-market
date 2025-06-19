
import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/integrations/supabase/client';
import { Users, Briefcase, Coins, Star, Plus, CreditCard, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';

interface DashboardStats {
  totalProviders: number;
  totalOpportunities: number;
  myOpportunities: number;
  completedProjects: number;
}

const Dashboard = () => {
  const { profile, isAuthenticated } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats>({
    totalProviders: 0,
    totalOpportunities: 0,
    myOpportunities: 0,
    completedProjects: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && profile) {
      loadStats();
    }
  }, [isAuthenticated, profile]);

  const loadStats = async () => {
    try {
      const [providersRes, opportunitiesRes, myOpportunitiesRes, projectsRes] = await Promise.all([
        supabase.from('service_providers').select('id', { count: 'exact' }).eq('is_active', true),
        supabase.from('opportunities').select('id', { count: 'exact' }).eq('is_active', true),
        supabase.from('opportunities').select('id', { count: 'exact' }).eq('client_id', profile?.id).eq('is_active', true),
        supabase.from('project_completions').select('id', { count: 'exact' }).eq('status', 'completed')
      ]);

      setStats({
        totalProviders: providersRes.count || 0,
        totalOpportunities: opportunitiesRes.count || 0,
        myOpportunities: myOpportunitiesRes.count || 0,
        completedProjects: projectsRes.count || 0
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      user: 'bg-blue-100 text-blue-800',
      admin: 'bg-orange-100 text-orange-800',
      super_admin: 'bg-red-100 text-red-800'
    };
    return colors[role as keyof typeof colors] || colors.user;
  };

  if (!profile) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Loading your profile...</h2>
            <p className="text-gray-600">Please wait while we fetch your information.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Welcome back, {profile.name}!</h1>
              <div className="flex items-center mt-2 space-x-4">
                <Badge className={getRoleBadge(profile.role)}>
                  {profile.role.replace('_', ' ').toUpperCase()}
                </Badge>
                <span className="text-gray-600">{profile.country}</span>
                <div className="flex items-center text-green-600">
                  <Coins className="h-4 w-4 mr-1" />
                  <span className="font-semibold">{profile.tokens} tokens</span>
                </div>
              </div>
            </div>
            <Button asChild>
              <Link to="/opportunities/create" className="flex items-center">
                <Plus className="h-4 w-4 mr-2" />
                Post Opportunity
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center">
                <Users className="h-4 w-4 mr-2 text-blue-600" />
                Service Providers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : stats.totalProviders}</div>
              <p className="text-xs text-gray-600 mt-1">Available in {profile.country}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center">
                <Briefcase className="h-4 w-4 mr-2 text-green-600" />
                Opportunities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : stats.totalOpportunities}</div>
              <p className="text-xs text-gray-600 mt-1">Active opportunities</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center">
                <Star className="h-4 w-4 mr-2 text-yellow-600" />
                My Posts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : stats.myOpportunities}</div>
              <p className="text-xs text-gray-600 mt-1">Opportunities posted</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center">
                <Coins className="h-4 w-4 mr-2 text-purple-600" />
                Your Tokens
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{profile.tokens}</div>
              <p className="text-xs text-gray-600 mt-1">Available tokens</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button asChild className="w-full" variant="outline">
                <Link to="/providers" className="flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Browse Service Providers
                </Link>
              </Button>
              <Button asChild className="w-full" variant="outline">
                <Link to="/opportunities" className="flex items-center">
                  <Briefcase className="h-4 w-4 mr-2" />
                  View Opportunities
                </Link>
              </Button>
              <Button asChild className="w-full" variant="outline">
                <Link to="/tokens/purchase" className="flex items-center">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Purchase Tokens
                </Link>
              </Button>
              <Button asChild className="w-full" variant="outline">
                <Link to="/provider/create" className="flex items-center">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Become a Service Provider
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Platform Stats</CardTitle>
              <CardDescription>SkillZone community overview</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Service Providers</span>
                <span className="font-semibold">{stats.totalProviders}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Active Opportunities</span>
                <span className="font-semibold">{stats.totalOpportunities}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Completed Projects</span>
                <span className="font-semibold">{stats.completedProjects}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Your Country</span>
                <span className="font-semibold">{profile.country}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Access */}
        {(profile.role === 'admin' || profile.role === 'super_admin') && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center text-orange-800">
                <Users className="h-5 w-5 mr-2" />
                Admin Panel Access
              </CardTitle>
              <CardDescription className="text-orange-700">
                You have {profile.role.replace('_', ' ')} privileges
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="bg-orange-600 hover:bg-orange-700">
                <Link to="/admin">
                  Access Admin Panel
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;
