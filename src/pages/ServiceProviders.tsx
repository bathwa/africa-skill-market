
import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useAuthStore } from '@/stores/indexedDBAuth';
import { useProviderStore } from '@/stores/providerStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, MapPin, Star, Coins, User, Briefcase, Award, ExternalLink } from 'lucide-react';

const ServiceProviders = () => {
  const { profile } = useAuthStore();
  const { profiles, reviews, loadProfiles, getProfilesByCountry, getReviewsByProvider } = useProviderStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<any>(null);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  if (!profile) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p>Please log in to view service providers.</p>
        </div>
      </Layout>
    );
  }

  const countryProviders = getProfilesByCountry(profile.country);
  const filteredProviders = countryProviders.filter(provider =>
    provider.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    provider.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    provider.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const ProviderCard = ({ provider }: { provider: any }) => {
    const providerReviews = getReviewsByProvider(provider.id);
    
    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={`https://avatar.vercel.sh/${provider.business_name}.png`} />
                <AvatarFallback>{provider.business_name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">{provider.business_name}</CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <MapPin className="h-3 w-3" />
                  {provider.country}
                  <Briefcase className="h-3 w-3 ml-2" />
                  {provider.experience_years} years experience
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center text-yellow-500">
              <Star className="h-4 w-4 fill-current" />
              <span className="text-sm ml-1">
                {provider.rating > 0 ? provider.rating.toFixed(1) : 'New'}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 text-sm line-clamp-3">
            {provider.description}
          </p>
          
          <div className="flex flex-wrap gap-1">
            {provider.skills.slice(0, 4).map((skill: string, index: number) => (
              <Badge key={index} variant="outline" className="text-xs">
                {skill}
              </Badge>
            ))}
            {provider.skills.length > 4 && (
              <Badge variant="outline" className="text-xs">
                +{provider.skills.length - 4} more
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="text-sm text-gray-600">
              <span className="font-medium">
                {provider.currency} {provider.hourly_rate}/hr
              </span>
              <span className="mx-2">•</span>
              <span>{provider.completed_projects} projects completed</span>
            </div>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  size="sm" 
                  onClick={() => setSelectedProvider(provider)}
                  className="flex items-center gap-1"
                >
                  <User className="h-3 w-3" />
                  View Profile
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={`https://avatar.vercel.sh/${provider.business_name}.png`} />
                      <AvatarFallback className="text-lg">{provider.business_name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <DialogTitle className="text-xl">{provider.business_name}</DialogTitle>
                      <DialogDescription className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {provider.country}
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500" />
                          {provider.rating > 0 ? provider.rating.toFixed(1) : 'New'} ({provider.total_reviews} reviews)
                        </span>
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-2">About</h3>
                    <p className="text-gray-600">{provider.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold mb-2">Experience</h3>
                      <p className="text-gray-600">{provider.experience_years} years</p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Hourly Rate</h3>
                      <p className="text-gray-600">{provider.currency} {provider.hourly_rate}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Completed Projects</h3>
                      <p className="text-gray-600">{provider.completed_projects}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Member Since</h3>
                      <p className="text-gray-600">{new Date(provider.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {provider.skills.map((skill: string, index: number) => (
                        <Badge key={index} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {provider.certifications.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2 flex items-center gap-1">
                        <Award className="h-4 w-4" />
                        Certifications
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {provider.certifications.map((cert: string, index: number) => (
                          <Badge key={index} variant="outline">
                            {cert}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {provider.portfolio_links.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Portfolio</h3>
                      <div className="space-y-2">
                        {provider.portfolio_links.map((link: string, index: number) => (
                          <a 
                            key={index}
                            href={link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-blue-600 hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                            {link}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {providerReviews.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3">Reviews ({providerReviews.length})</h3>
                      <div className="space-y-4 max-h-60 overflow-y-auto">
                        {providerReviews.slice(0, 5).map((review) => (
                          <div key={review.id} className="border-l-2 border-gray-200 pl-4">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`h-3 w-3 ${star <= review.rating ? 'text-yellow-500 fill-current' : 'text-gray-300'}`}
                                  />
                                ))}
                              </div>
                              <span className="text-sm font-medium">{review.client_name}</span>
                              <span className="text-xs text-gray-500">
                                {new Date(review.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">{review.comment}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Service Providers</h1>
          <p className="text-gray-600 mt-2">
            Find skilled professionals in {profile.country}
          </p>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, skills, or description..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Results */}
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            {filteredProviders.length} service providers found in {profile.country}
          </p>
        </div>

        {/* Service Provider Cards */}
        {filteredProviders.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No service providers found</h3>
              <p className="text-gray-600">
                {searchTerm 
                  ? 'Try adjusting your search terms'
                  : `No service providers are currently available in ${profile.country}`
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProviders.map((provider) => (
              <ProviderCard key={provider.id} provider={provider} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ServiceProviders;
