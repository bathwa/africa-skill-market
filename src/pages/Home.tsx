
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Users, Briefcase, Shield, MapPin, Coins } from 'lucide-react';
import Layout from '@/components/Layout';

const Home = () => {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-700 via-blue-600 to-orange-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-8">
            <img 
              src="/lovable-uploads/66e50579-9d23-4c55-a7d5-b7ecbf89cccd.png" 
              alt="SkillZone Logo" 
              className="h-20 w-20"
            />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Welcome to SkillZone
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-blue-100">
            Connecting skilled workers with opportunities across SADC countries
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button size="lg" className="bg-white text-blue-700 hover:bg-gray-100 px-8 py-3">
                Get Started
              </Button>
            </Link>
            <Link to="/providers">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-700 px-8 py-3">
                Browse Services
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How SkillZone Works</h2>
            <p className="text-lg text-gray-600">
              A simple, secure platform connecting skilled workers with clients
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Users className="h-8 w-8 text-blue-700" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Create Your Profile</h3>
                <p className="text-gray-600">
                  Service providers showcase their skills and clients post opportunities
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="bg-orange-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Search className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Browse & Discover</h3>
                <p className="text-gray-600">
                  Search for services by category, location, and rating
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Coins className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Connect Securely</h3>
                <p className="text-gray-600">
                  Use tokens to access contact details and connect with the right people
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-gray-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Why Choose SkillZone?
              </h2>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-100 rounded-full p-2 flex-shrink-0">
                    <Shield className="h-5 w-5 text-blue-700" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Secure & Private</h3>
                    <p className="text-gray-600">Contact details are protected and only accessible through tokens</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="bg-orange-100 rounded-full p-2 flex-shrink-0">
                    <MapPin className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Local Focus</h3>
                    <p className="text-gray-600">Find skilled workers and opportunities in your country and area</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="bg-green-100 rounded-full p-2 flex-shrink-0">
                    <Briefcase className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Fair & Transparent</h3>
                    <p className="text-gray-600">Free to post profiles and opportunities, pay only to connect</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-8 shadow-lg">
              <h3 className="text-2xl font-bold mb-6 text-center">Get Started Today</h3>
              <div className="space-y-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Coins className="h-8 w-8 text-blue-700 mx-auto mb-2" />
                  <p className="font-semibold">10 Free Tokens</p>
                  <p className="text-sm text-gray-600">When you sign up</p>
                </div>
                <Link to="/register">
                  <Button className="w-full bg-blue-700 hover:bg-blue-800" size="lg">
                    Create Account
                  </Button>
                </Link>
                <p className="text-xs text-gray-500 text-center">
                  Join thousands of skilled workers and clients across SADC countries
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Home;
