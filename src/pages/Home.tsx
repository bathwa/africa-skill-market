
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/indexedDBAuth';
import { useOpportunityStore } from '@/stores/opportunityStore';
import { useProviderStore } from '@/stores/providerStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, DollarSign, Star, Users, Briefcase, Shield } from 'lucide-react';
import Header from '@/components/Header';

const Home = () => {
  const { profile } = useAuthStore();
  const { opportunities, loadOpportunities } = useOpportunityStore();
  const { profiles, loadProfiles } = useProviderStore();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedSkill, setSelectedSkill] = useState('all');
  const [searchType, setSearchType] = useState<'opportunities' | 'providers'>('opportunities');

  useEffect(() => {
    loadOpportunities();
    loadProfiles();
  }, [loadOpportunities, loadProfiles]);

  const skillOptions = [
    'Welding', 'Painting', 'Building & Construction', 'Plumbing', 'Electrical',
    'Home Helper', 'Gardener', 'HVAC Tech', 'Mechanic', 'Auto Electrician',
    'Web Development', 'Mobile Development', 'Design', 'Writing', 'Marketing',
    'Consulting', 'Photography', 'Catering', 'Cleaning Services', 'Tutoring'
  ];

  const locations = [
    'Zimbabwe', 'South Africa', 'Botswana', 'Zambia', 'Namibia', 
    'Angola', 'Mozambique', 'Malawi'
  ];

  const filteredOpportunities = opportunities.filter(opp => {
    const matchesSearch = opp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         opp.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = selectedLocation === 'all' || opp.client_country === selectedLocation;
    const matchesSkill = selectedSkill === 'all' || 
                        opp.skills_required.some(skill => skill.toLowerCase().includes(selectedSkill.toLowerCase()));
    return matchesSearch && matchesLocation && matchesSkill;
  }).slice(0, 6);

  const filteredProviders = profiles.filter(provider => {
    const matchesSearch = provider.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         provider.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = selectedLocation === 'all' || provider.country === selectedLocation;
    const matchesSkill = selectedSkill === 'all' || 
                        provider.skills.some(skill => skill.toLowerCase().includes(selectedSkill.toLowerCase()));
    return matchesSearch && matchesLocation && matchesSkill;
  }).slice(0, 6);

  const handleSearch = () => {
    if (profile) {
      if (searchType === 'opportunities') {
        navigate('/opportunities');
      } else {
        navigate('/providers');
      }
    } else {
      navigate('/auth');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
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
            
            {/* Search Section */}
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <Input
                      placeholder={`Search for ${searchType === 'opportunities' ? 'opportunities' : 'service providers'}...`}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="All Locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {locations.map(location => (
                      <SelectItem key={location} value={location}>{location}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedSkill} onValueChange={setSelectedSkill}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="All Skills" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Skills</SelectItem>
                    {skillOptions.map(skill => (
                      <SelectItem key={skill} value={skill}>{skill}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-4 items-center">
                <div className="flex gap-2">
                  <Button
                    variant={searchType === 'opportunities' ? 'default' : 'outline'}
                    onClick={() => setSearchType('opportunities')}
                  >
                    Find Work
                  </Button>
                  <Button
                    variant={searchType === 'providers' ? 'default' : 'outline'}
                    onClick={() => setSearchType('providers')}
                  >
                    Hire Talent
                  </Button>
                </div>
                <Button onClick={handleSearch} className="flex-1 md:flex-none">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>
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

      {/* Recent Opportunities */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Recent Opportunities</h2>
            <Link to="/opportunities">
              <Button variant="outline">View All</Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOpportunities.map((opportunity) => (
              <Card key={opportunity.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{opportunity.title}</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {opportunity.client_country}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                    {opportunity.description}
                  </p>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="font-medium">
                        {opportunity.currency} {opportunity.budget}
                      </span>
                    </div>
                    <Badge variant="outline">{opportunity.status}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {opportunity.skills_required.slice(0, 2).map((skill, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {opportunity.skills_required.length > 2 && (
                      <Badge variant="secondary" className="text-xs">
                        +{opportunity.skills_required.length - 2} more
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Service Providers */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Featured Service Providers</h2>
            <Link to="/providers">
              <Button variant="outline">View All</Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProviders.map((provider) => (
              <Card key={provider.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{provider.business_name}</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {provider.country}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                    {provider.description}
                  </p>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="font-medium">
                        {provider.rating > 0 ? provider.rating.toFixed(1) : 'New'}
                      </span>
                      <span className="text-sm text-gray-600">
                        ({provider.total_reviews})
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {provider.experience_years} years exp.
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {provider.skills.slice(0, 3).map((skill, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {provider.skills.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{provider.skills.length - 3} more
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
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
                <li><Link to="/opportunities" className="hover:text-white">Find Services</Link></li>
                <li><Link to="/auth" className="hover:text-white">Post a Project</Link></li>
                <li><Link to="/providers" className="hover:text-white">Browse Providers</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">For Providers</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/opportunities" className="hover:text-white">Find Work</Link></li>
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
