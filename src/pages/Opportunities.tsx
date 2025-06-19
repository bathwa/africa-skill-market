
import React from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, MapPin, Calendar, Coins, Plus } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

const Opportunities = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Opportunities</h1>
            <p className="text-gray-600 mt-2">Discover work opportunities posted by clients</p>
          </div>
          {isAuthenticated && (
            <Button className="bg-blue-700 hover:bg-blue-800">
              <Plus className="h-4 w-4 mr-2" />
              Post Opportunity
            </Button>
          )}
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search opportunities..."
                className="pl-10"
              />
            </div>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Location..."
                className="pl-10"
              />
            </div>
            <Button className="bg-blue-700 hover:bg-blue-800">
              Search Opportunities
            </Button>
          </div>
        </div>

        {/* Opportunity Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sample Opportunity Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">Sample Opportunity</CardTitle>
                  <CardDescription className="flex items-center mt-1">
                    <MapPin className="h-3 w-3 mr-1" />
                    Location Hidden
                  </CardDescription>
                </div>
                <div className="flex items-center text-gray-500 text-sm">
                  <Calendar className="h-3 w-3 mr-1" />
                  Posted today
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm mb-4">
                Looking for skilled professionals for a project. Full details and contact information available after token purchase.
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-500">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                    Construction
                  </span>
                  <span className="ml-2">3 slots available</span>
                </div>
                <Button size="sm" className="flex items-center">
                  <Coins className="h-3 w-3 mr-1" />
                  View Details (3 tokens)
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* No opportunities message */}
          <div className="col-span-full">
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-gray-500 mb-4">No opportunities available</p>
                <p className="text-sm text-gray-400">Opportunities will appear here once clients post them</p>
                {isAuthenticated && (
                  <Button className="mt-4" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Be the first to post an opportunity
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Opportunities;
