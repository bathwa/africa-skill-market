
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/indexedDBAuth';
import { useOpportunityStore } from '@/stores/opportunityStore';
import { useProviderStore } from '@/stores/providerStore';
import { Button } from '@/components/ui/button';
import { Shield, Users, Briefcase, Star, ArrowRight } from 'lucide-react';
import Header from '@/components/Header';
import VisitorSearch from '@/components/VisitorSearch';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';

const Home = () => {
  const { profile } = useAuthStore();
  const { opportunities, loadOpportunities } = useOpportunityStore();
  const { profiles, loadProfiles } = useProviderStore();
  const navigate = useNavigate();

  useEffect(() => {
    loadOpportunities();
    loadProfiles();
  }, [loadOpportunities, loadProfiles]);

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (profile) {
      navigate('/dashboard');
    }
  }, [profile, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <PWAInstallPrompt />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Connect. Collaborate. Create.
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              SkillZone is the premier platform connecting skilled professionals with clients across the SADC region. 
              Find the perfect match for your project or showcase your expertise to potential clients.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link to="/auth">
                <Button size="lg" className="px-8">
                  Get Started Today
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" onClick={() => {
                document.getElementById('search-section')?.scrollIntoView({ behavior: 'smooth' });
              }}>
                Browse Opportunities
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose SkillZone?</h2>
            <p className="text-lg text-gray-600">
              We're building the future of work in the SADC region
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full p-6 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Shield className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure & Reliable</h3>
              <p className="text-gray-600">
                Secure escrow system and verified professionals ensure safe transactions and quality work.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 rounded-full p-6 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Users className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Local Expertise</h3>
              <p className="text-gray-600">
                Connect with skilled professionals who understand your local market and requirements.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 rounded-full p-6 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Briefcase className="h-10 w-10 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Diverse Skills</h3>
              <p className="text-gray-600">
                From traditional trades to modern digital services, find expertise across all industries.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Visitor Search Section */}
      <section id="search-section" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Explore Opportunities</h2>
            <p className="text-lg text-gray-600">
              Browse available work and talented professionals across the SADC region
            </p>
          </div>
          
          <VisitorSearch opportunities={opportunities} providers={profiles} />
        </div>
      </section>

      {/* What to Expect Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">What to Expect</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-semibold mb-6">For Service Providers</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Star className="h-6 w-6 text-yellow-500 mt-1" />
                  <div>
                    <h4 className="font-medium">Find Quality Opportunities</h4>
                    <p className="text-gray-600">Access vetted projects that match your skills and location</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="h-6 w-6 text-blue-500 mt-1" />
                  <div>
                    <h4 className="font-medium">Secure Payments</h4>
                    <p className="text-gray-600">Protected transactions through our escrow system</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="h-6 w-6 text-green-500 mt-1" />
                  <div>
                    <h4 className="font-medium">Build Your Reputation</h4>
                    <p className="text-gray-600">Earn ratings and build a strong professional profile</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-2xl font-semibold mb-6">For Clients</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Briefcase className="h-6 w-6 text-purple-500 mt-1" />
                  <div>
                    <h4 className="font-medium">Access Skilled Professionals</h4>
                    <p className="text-gray-600">Find verified experts across various industries</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="h-6 w-6 text-blue-500 mt-1" />
                  <div>
                    <h4 className="font-medium">Quality Assurance</h4>
                    <p className="text-gray-600">Review ratings and portfolios before hiring</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="h-6 w-6 text-green-500 mt-1" />
                  <div>
                    <h4 className="font-medium">Direct Communication</h4>
                    <p className="text-gray-600">Chat directly with service providers through our platform</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of professionals and clients already using SkillZone
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" variant="secondary">
                Find Work Opportunities
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-blue-600">
                Hire Service Providers
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-4">SkillZone</h3>
              <p className="text-gray-400">
                Connecting skilled professionals across the SADC region
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">For Clients</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/auth" className="hover:text-white">Find Services</Link></li>
                <li><Link to="/auth" className="hover:text-white">Post a Project</Link></li>
                <li><Link to="/auth" className="hover:text-white">Browse Providers</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">For Providers</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/auth" className="hover:text-white">Find Work</Link></li>
                <li><Link to="/auth" className="hover:text-white">Create Profile</Link></li>
                <li><Link to="/auth" className="hover:text-white">Build Portfolio</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Email: admin@abathwa.com</li>
                <li>Phone: +263 78 998 9619</li>
                <li>WhatsApp: wa.me/789989619</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 SkillZone. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
