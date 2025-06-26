
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, Star, Lock, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

interface VisitorSearchProps {
  opportunities: any[];
  providers: any[];
}

const VisitorSearch = ({ opportunities, providers }: VisitorSearchProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedSkill, setSelectedSkill] = useState('all');
  const [searchType, setSearchType] = useState<'opportunities' | 'providers'>('opportunities');

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
                        opp.skills_required.some((skill: string) => skill.toLowerCase().includes(selectedSkill.toLowerCase()));
    return matchesSearch && matchesLocation && matchesSkill;
  }).slice(0, 6);

  const filteredProviders = providers.filter(provider => {
    const matchesSearch = provider.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         provider.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = selectedLocation === 'all' || provider.country === selectedLocation;
    const matchesSkill = selectedSkill === 'all' || 
                        provider.skills?.some((skill: string) => skill.toLowerCase().includes(selectedSkill.toLowerCase()));
    return matchesSearch && matchesLocation && matchesSkill;
  }).slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Search Interface */}
      <Card className="p-6">
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
      </Card>

      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {searchType === 'opportunities' ? (
          filteredOpportunities.map((opportunity) => (
            <Card key={opportunity.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  {opportunity.title}
                  <Lock className="h-4 w-4 text-gray-400" />
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {opportunity.client_country}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                  {opportunity.description.substring(0, 100)}...
                </p>
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="outline">{opportunity.status}</Badge>
                  <div className="text-sm text-gray-600">
                    Budget: {opportunity.currency} {opportunity.budget}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mb-4">
                  {opportunity.skills_required.slice(0, 2).map((skill: string, index: number) => (
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
                <Link to="/auth">
                  <Button className="w-full" size="sm">
                    Sign up to Apply
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))
        ) : (
          filteredProviders.map((provider) => (
            <Card key={provider.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  {provider.business_name}
                  <Lock className="h-4 w-4 text-gray-400" />
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {provider.country}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                  {provider.description?.substring(0, 100)}...
                </p>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="font-medium">
                      {provider.rating > 0 ? provider.rating.toFixed(1) : 'New'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {provider.experience_years} years exp.
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mb-4">
                  {provider.skills?.slice(0, 3).map((skill: string, index: number) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                  {provider.skills?.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{provider.skills.length - 3} more
                    </Badge>
                  )}
                </div>
                <Link to="/auth">
                  <Button className="w-full" size="sm">
                    Sign up to Contact
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* What You're Missing Section */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <div className="text-center">
            <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Unlock Full Access
            </h3>
            <p className="text-gray-600 mb-4">
              Sign up to contact service providers, apply for opportunities, and access exclusive features.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-6">
              <div>✓ Direct contact with providers</div>
              <div>✓ Apply for opportunities</div>
              <div>✓ Real-time messaging</div>
            </div>
            <Link to="/auth">
              <Button size="lg">
                Join SkillZone Today
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VisitorSearch;
