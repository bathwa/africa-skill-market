
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useAuthStore } from '@/stores/indexedDBAuth';
import { useProviderStore } from '@/stores/providerStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Upload, X, Plus, User } from 'lucide-react';

const CreateProvider = () => {
  const { profile, updateProfile } = useAuthStore();
  const { createProfile } = useProviderStore();
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
    work_images: [] as File[],
    profile_image: null as File | null,
  });

  const [newSkill, setNewSkill] = useState('');
  const [newPortfolioLink, setNewPortfolioLink] = useState('');
  const [newCertification, setNewCertification] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!profile) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p>Please log in to create a provider profile.</p>
        </div>
      </Layout>
    );
  }

  const skillOptions = [
    'Welding', 'Painting', 'Building & Construction', 'Plumbing', 'Electrical',
    'Home Helper', 'Gardener', 'HVAC Tech', 'Mechanic', 'Auto Electrician',
    'Web Development', 'Mobile Development', 'Design', 'Writing', 'Marketing',
    'Consulting', 'Photography', 'Catering', 'Cleaning Services', 'Tutoring',
    'Carpentry', 'Roofing', 'Tiling', 'Painting & Decorating', 'Landscaping'
  ];

  const handleAddSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const handleAddPortfolioLink = () => {
    if (newPortfolioLink.trim() && !formData.portfolio_links.includes(newPortfolioLink.trim())) {
      setFormData(prev => ({
        ...prev,
        portfolio_links: [...prev.portfolio_links, newPortfolioLink.trim()]
      }));
      setNewPortfolioLink('');
    }
  };

  const handleRemovePortfolioLink = (linkToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      portfolio_links: prev.portfolio_links.filter(link => link !== linkToRemove)
    }));
  };

  const handleAddCertification = () => {
    if (newCertification.trim() && !formData.certifications.includes(newCertification.trim())) {
      setFormData(prev => ({
        ...prev,
        certifications: [...prev.certifications, newCertification.trim()]
      }));
      setNewCertification('');
    }
  };

  const handleRemoveCertification = (certToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.filter(cert => cert !== certToRemove)
    }));
  };

  const handleWorkImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setFormData(prev => ({
      ...prev,
      work_images: [...prev.work_images, ...files]
    }));
  };

  const handleProfileImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        profile_image: file
      }));
    }
  };

  const handleRemoveWorkImage = (imageToRemove: File) => {
    setFormData(prev => ({
      ...prev,
      work_images: prev.work_images.filter(img => img !== imageToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.business_name || !formData.description || formData.skills.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const profileData = {
        user_id: profile.id,
        business_name: formData.business_name,
        description: formData.description,
        skills: formData.skills,
        experience_years: formData.experience_years,
        hourly_rate: formData.hourly_rate,
        currency: formData.currency,
        portfolio_links: formData.portfolio_links,
        certifications: formData.certifications,
        country: profile.country,
      };

      const result = await createProfile(profileData);

      if (result.success) {
        // Update user profile to reflect provider profile creation
        await updateProfile({ 
          role: 'service_provider'
        });
        
        toast({
          title: "Profile Created",
          description: "Your service provider profile has been created successfully!",
        });
        navigate('/providers');
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create profile",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
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
            <CardTitle>Professional Profile</CardTitle>
            <CardDescription>
              Provide detailed information about your services and experience
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Profile Picture</label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                      {formData.profile_image ? (
                        <img 
                          src={URL.createObjectURL(formData.profile_image)} 
                          alt="Profile" 
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <User className="h-8 w-8 text-gray-400" />
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfileImageUpload}
                      className="hidden"
                      id="profile-image-upload"
                    />
                    <label htmlFor="profile-image-upload" className="cursor-pointer">
                      <Button type="button" variant="outline" size="sm">
                        Upload Photo
                      </Button>
                    </label>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Business Name *</label>
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
                    rows={4}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Experience (Years)</label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.experience_years}
                    onChange={(e) => setFormData(prev => ({ ...prev, experience_years: Number(e.target.value) }))}
                    placeholder="Years of experience"
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
                      placeholder="Your hourly rate"
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
                <label className="block text-sm font-medium mb-2">Skills & Services *</label>
                <div className="flex gap-2 mb-3">
                  <Select value={newSkill} onValueChange={setNewSkill}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select a skill" />
                    </SelectTrigger>
                    <SelectContent>
                      {skillOptions.map(skill => (
                        <SelectItem key={skill} value={skill}>{skill}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" onClick={handleAddSkill} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="cursor-pointer">
                      {skill}
                      <X 
                        className="h-3 w-3 ml-1" 
                        onClick={() => handleRemoveSkill(skill)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Work Images</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-2">Upload images of your work</p>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleWorkImageUpload}
                    className="hidden"
                    id="work-images-upload"
                  />
                  <label htmlFor="work-images-upload" className="cursor-pointer">
                    <Button type="button" variant="outline" size="sm">
                      Choose Images
                    </Button>
                  </label>
                </div>
                {formData.work_images.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    {formData.work_images.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(image)}
                          alt={`Work ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-1 right-1 h-6 w-6 p-0"
                          onClick={() => handleRemoveWorkImage(image)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Portfolio Links</label>
                <div className="flex gap-2 mb-3">
                  <Input
                    value={newPortfolioLink}
                    onChange={(e) => setNewPortfolioLink(e.target.value)}
                    placeholder="Add portfolio or website link"
                    type="url"
                  />
                  <Button type="button" onClick={handleAddPortfolioLink} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.portfolio_links.map((link, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                        {link}
                      </a>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemovePortfolioLink(link)}
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
                    placeholder="Add certification or qualification"
                  />
                  <Button type="button" onClick={handleAddCertification} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.certifications.map((cert, index) => (
                    <Badge key={index} variant="outline" className="cursor-pointer">
                      {cert}
                      <X 
                        className="h-3 w-3 ml-1" 
                        onClick={() => handleRemoveCertification(cert)}
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
