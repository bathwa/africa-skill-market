
import React from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, MapPin, Star, Coins } from 'lucide-react';

const ServiceProviders = () => {
  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Service Providers</h1>
          <p className="text-gray-600 mt-2">Find skilled workers and professionals in your area</p>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by skill or trade..."
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
              Search Providers
            </Button>
          </div>
        </div>

        {/* Service Provider Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Sample Service Provider Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">Sample Provider</CardTitle>
                  <CardDescription className="flex items-center mt-1">
                    <MapPin className="h-3 w-3 mr-1" />
                    Location Hidden
                  </CardDescription>
                </div>
                <div className="flex items-center text-yellow-500">
                  <Star className="h-4 w-4 fill-current" />
                  <span className="text-sm ml-1">4.8</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm mb-4">
                Professional service provider with years of experience. Contact details available after token purchase.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Plumbing, Electrical</span>
                <Button size="sm" className="flex items-center">
                  <Coins className="h-3 w-3 mr-1" />
                  View Contact (2 tokens)
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* No providers message */}
          <div className="col-span-full">
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-gray-500 mb-4">No service providers found</p>
                <p className="text-sm text-gray-400">Service providers will appear here once they create profiles</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ServiceProviders;
