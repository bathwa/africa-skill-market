
import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useAuthStore } from '@/stores/indexedDBAuth';
import { useOpportunityStore } from '@/stores/opportunityStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Search, MapPin, DollarSign, Clock, Eye, EyeOff, Star, User } from 'lucide-react';

const Opportunities = () => {
  const { profile, updateProfile } = useAuthStore();
  const { 
    opportunities, 
    loadOpportunities, 
    getOpportunitiesByCountry, 
    purchaseAccess, 
    hasAccess,
    getOpportunityById 
  } = useOpportunityStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedOpportunity, setSelectedOpportunity] = useState<string | null>(null);

  useEffect(() => {
    loadOpportunities();
  }, [loadOpportunities]);

  if (!profile) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p>Please log in to view opportunities.</p>
        </div>
      </Layout>
    );
  }

  const filteredOpportunities = getOpportunitiesByCountry(profile.country).filter(opp => {
    const matchesSearch = opp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         opp.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || opp.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handlePurchaseAccess = async (opportunityId: string) => {
    if (!profile) return;

    if (profile.tokens < 1) {
      toast({
        title: "Insufficient tokens",
        description: "You need at least 1 token to purchase access to this opportunity.",
        variant: "destructive"
      });
      return;
    }

    const result = await purchaseAccess(opportunityId, profile.id);
    if (result.success) {
      // Deduct token
      await updateProfile({ tokens: profile.tokens - 1 });
      toast({
        title: "Access purchased",
        description: "You can now view the client's contact details.",
      });
    } else {
      toast({
        title: "Purchase failed",
        description: result.error,
        variant: "destructive"
      });
    }
  };

  const OpportunityCard = ({ opportunity }: { opportunity: any }) => {
    const hasContactAccess = hasAccess(opportunity.id, profile.id);
    const isMyOpportunity = opportunity.client_id === profile.id;

    return (
      <Card className="h-full">
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg">{opportunity.title}</CardTitle>
            <Badge variant={opportunity.status === 'open' ? 'default' : 'secondary'}>
              {opportunity.status}
            </Badge>
          </div>
          <CardDescription className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {opportunity.client_country}
            <Clock className="h-4 w-4 ml-2" />
            {new Date(opportunity.created_at).toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600 line-clamp-3">
            {opportunity.description}
          </p>
          
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-green-600" />
            <span className="font-medium">
              {opportunity.currency} {opportunity.budget}
            </span>
          </div>

          <div className="flex flex-wrap gap-1">
            {opportunity.skills_required.map((skill: string, index: number) => (
              <Badge key={index} variant="outline" className="text-xs">
                {skill}
              </Badge>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">
              By: {opportunity.client_name}
            </span>
            {!isMyOpportunity && profile.role === 'service_provider' && (
              <div className="flex items-center gap-2">
                {hasContactAccess ? (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View Contact
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Client Contact Details</DialogTitle>
                        <DialogDescription>
                          Contact information for {opportunity.title}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <label className="font-medium">Email:</label>
                          <p>{opportunity.client_email}</p>
                        </div>
                        {opportunity.client_phone && (
                          <div>
                            <label className="font-medium">Phone:</label>
                            <p>{opportunity.client_phone}</p>
                          </div>
                        )}
                        <div>
                          <label className="font-medium">Client:</label>
                          <p>{opportunity.client_name}</p>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                ) : (
                  <Button 
                    size="sm" 
                    onClick={() => handlePurchaseAccess(opportunity.id)}
                    disabled={profile.tokens < 1}
                  >
                    <EyeOff className="h-4 w-4 mr-1" />
                    Access (1 token)
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Opportunities</h1>
          <p className="text-gray-600 mt-2">
            Discover work opportunities in {profile.country}
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search opportunities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="web-development">Web Development</SelectItem>
              <SelectItem value="mobile-development">Mobile Development</SelectItem>
              <SelectItem value="design">Design</SelectItem>
              <SelectItem value="writing">Writing</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
              <SelectItem value="consulting">Consulting</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results */}
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            {filteredOpportunities.length} opportunities found in {profile.country}
          </p>
        </div>

        {/* Opportunities Grid */}
        {filteredOpportunities.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No opportunities found</h3>
              <p className="text-gray-600">
                {searchTerm || categoryFilter !== 'all' 
                  ? 'Try adjusting your search filters'
                  : `No opportunities are currently available in ${profile.country}`
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOpportunities.map((opportunity) => (
              <OpportunityCard key={opportunity.id} opportunity={opportunity} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Opportunities;
