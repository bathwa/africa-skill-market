
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useAuthStore } from '@/stores/indexedDBAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Plus, X, User, Briefcase, Star } from 'lucide-react';

interface ServiceProviderProfile {
  id: string;
  user_id: string;
  business_name: string;
  description: string;
  skills: string[];
  experience_years: number;
  hourly_rate: number;
  currency: 'USD' | 'ZAR';
  portfolio_links: string[];
  certifications: string[];
  rating: number;
  total_reviews: number;
  completed_projects: number;
  created_at: string;
  updated_at: string;
}

const CreateProvider = () => {
  const { profile, updateProfile } = useAuthStore();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    business_name: '',
    description: '',
    skills: [] as string[],
    experience_years: 0,
    hourly_rate: 0,
    currency: 'USD' as 'USD' | 'ZAR',
    portfolio_links: [] as string[],
    certifications: [] as string[],
  });

  const [newSkill, setNewSkill] = useState('');
  const [newPortfolioLink, setNewPortfolioLink] = useState('');
  const [newCertification, setNewCertification] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!profile || profile.role !== 'service_provider') {
    return (
      <Layout>
        <div className="text-center py-12">
          <p>Access denied. Only service providers can create profiles.</p>
        </div>
      </Layout>
    );
  }

  const handleAddItem = (
    type: 'skills' | 'portfolio_links' | 'certifications',
    value: string,
    setValue: (value: string) => void
  ) => {
    if (value.trim() && !formData[type].includes(value.trim())) {
      setFormData(prev => ({
        ...prev,
        [type]: [...prev[type], value.trim()]
      }));
      setValue('');
    }
  };

  const handleRemoveItem = (
    type: 'skills' | 'portfolio_links' | 'certifications',
    itemToRemove: string
  ) => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].filter(item => item !== itemToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.business_name || !formData.description || formData.skills.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields and add at least one skill.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create service provider profile in IndexedDB
      const providerProfile: ServiceProviderProfile = {
        id: crypto.randomUUID(),
        user_id: profile.id,
        ...formData,
        rating: 0,
        total_reviews: 0,
        completed_projects: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Store in local storage for now (would be IndexedDB in production)
      const existingProfiles = JSON.parse(localStorage.getItem('service_provider_profiles') || '[]');
      existingProfiles.push(providerProfile);
      localStorage.setItem('service_provider_profiles', JSON.stringify(existingProfiles));

      // Update user profile to indicate they have a provider profile
      await updateProfile({ 
        provider_profile_created: true,
        provider_profile_id: providerProfile.id 
      });

      toast({
        title: "Profile Created",
        description: "Your service provider profile has been created successfully!",
      });
      
      navigate('/dashboard');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create Service Provider Profile</h1>
          <p className="text-gray-600 mt-2">Set up your professional profile to attract clients</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-6 w-6" />
              Professional Information
            </CardTitle>
            <CardDescription>
              Provide details about your services and expertise
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Business/Professional Name *</label>
                  <Input
                    value={formData.business_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, business_name: e.target.value }))}
                    placeholder="Your business or professional name"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Professional Description *</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your services, experience, and what makes you unique..."
                    rows={6}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Years of Experience</label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.experience_years}
                    onChange={(e) => setFormData(prev => ({ ...prev, experience_years: Number(e.target.value) }))}
                    placeholder="Years of professional experience"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Hourly Rate</label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.hourly_rate}
                      onChange={(e) => setFormData(prev => ({ ...prev, hourly_rate: Number(e.target.value) }))}
                      placeholder="0.00"
                    />
                    <Select 
                      value={formData.currency} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value as 'USD' | 'ZAR' }))}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="ZAR">ZAR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Skills & Expertise *</label>
                <div className="flex gap-2 mb-3">
                  <Input
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="Add a skill"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddItem('skills', newSkill, setNewSkill))}
                  />
                  <Button 
                    type="button" 
                    onClick={() => handleAddItem('skills', newSkill, setNewSkill)} 
                    size="sm"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="cursor-pointer">
                      {skill}
                      <X 
                        className="h-3 w-3 ml-1" 
                        onClick={() => handleRemoveItem('skills', skill)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Portfolio Links</label>
                <div className="flex gap-2 mb-3">
                  <Input
                    value={newPortfolioLink}
                    onChange={(e) => setNewPortfolioLink(e.target.value)}
                    placeholder="https://your-portfolio.com"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddItem('portfolio_links', newPortfolioLink, setNewPortfolioLink))}
                  />
                  <Button 
                    type="button" 
                    onClick={() => handleAddItem('portfolio_links', newPortfolioLink, setNewPortfolioLink)} 
                    size="sm"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.portfolio_links.map((link, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">
                        {link}
                      </a>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem('portfolio_links', link)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Certifications</label>
                <div className="flex gap-2 mb-3">
                  <Input
                    value={newCertification}
                    onChange={(e) => setNewCertification(e.target.value)}
                    placeholder="Add a certification"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddItem('certifications', newCertification, setNewCertification))}
                  />
                  <Button 
                    type="button" 
                    onClick={() => handleAddItem('certifications', newCertification, setNewCertification)} 
                    size="sm"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.certifications.map((cert, index) => (
                    <Badge key={index} variant="outline" className="cursor-pointer">
                      {cert}
                      <X 
                        className="h-3 w-3 ml-1" 
                        onClick={() => handleRemoveItem('certifications', cert)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? 'Creating Profile...' : 'Create Profile'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate('/dashboard')}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default CreateProvider;
