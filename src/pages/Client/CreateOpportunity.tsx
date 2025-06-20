
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuthStore } from '@/stores/indexedDBAuth';
import { useOpportunityStore } from '@/stores/opportunityStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { X, Plus, Upload, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const opportunitySchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  budget: z.number().min(1, 'Budget must be greater than 0'),
  currency: z.enum(['USD', 'ZAR']),
  category: z.string().min(1, 'Category is required'),
  skills_required: z.array(z.string()).min(1, 'At least one skill is required'),
  client_phone: z.string().optional(),
});

type OpportunityFormData = z.infer<typeof opportunitySchema>;

const CATEGORIES = [
  'web-development',
  'mobile-development', 
  'design',
  'writing',
  'marketing',
  'consulting',
  'data-analysis',
  'translation',
  'other'
];

const COMMON_SKILLS = [
  'JavaScript', 'React', 'Node.js', 'Python', 'PHP', 'HTML/CSS',
  'Mobile Development', 'UI/UX Design', 'Graphic Design', 'Content Writing',
  'SEO', 'Digital Marketing', 'Data Analysis', 'WordPress', 'E-commerce'
];

const CreateOpportunity = () => {
  const { profile } = useAuthStore();
  const { createOpportunity } = useOpportunityStore();
  const navigate = useNavigate();
  const [newSkill, setNewSkill] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const form = useForm<OpportunityFormData>({
    resolver: zodResolver(opportunitySchema),
    defaultValues: {
      title: '',
      description: '',
      budget: 0,
      currency: 'USD',
      category: '',
      skills_required: [],
      client_phone: '',
    },
  });

  const addSkill = (skill: string) => {
    const currentSkills = form.getValues('skills_required');
    if (skill && !currentSkills.includes(skill)) {
      form.setValue('skills_required', [...currentSkills, skill]);
    }
    setNewSkill('');
  };

  const removeSkill = (skillToRemove: string) => {
    const currentSkills = form.getValues('skills_required');
    form.setValue('skills_required', currentSkills.filter(skill => skill !== skillToRemove));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: OpportunityFormData) => {
    if (!profile) return;

    const opportunityData = {
      ...data,
      client_id: profile.id,
      client_name: profile.name,
      client_country: profile.country,
      client_email: profile.email,
      files: selectedFiles,
    };

    const result = await createOpportunity(opportunityData);
    
    if (result.success) {
      toast({
        title: "Opportunity created",
        description: "Your opportunity has been posted successfully.",
      });
      navigate('/dashboard');
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  if (!profile || profile.role !== 'client') {
    return (
      <div className="text-center py-12">
        <p>Access denied. Only clients can create opportunities.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Create New Opportunity</CardTitle>
          <CardDescription>
            Post a new project opportunity for service providers in {profile.country}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter project title..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe your project requirements in detail..."
                        className="min-h-32"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Provide detailed requirements, timeline, and any specific deliverables
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="budget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Budget</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="ZAR">ZAR</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORIES.map(category => (
                          <SelectItem key={category} value={category}>
                            {category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="client_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Your contact number..." {...field} />
                    </FormControl>
                    <FormDescription>
                      Service providers will see this after purchasing access
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="skills_required"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Required Skills</FormLabel>
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add skill..."
                          value={newSkill}
                          onChange={(e) => setNewSkill(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addSkill(newSkill);
                            }
                          }}
                        />
                        <Button 
                          type="button" 
                          onClick={() => addSkill(newSkill)}
                          size="sm"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {COMMON_SKILLS.map(skill => (
                          <Button
                            key={skill}
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addSkill(skill)}
                          >
                            {skill}
                          </Button>
                        ))}
                      </div>

                      {field.value.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {field.value.map(skill => (
                            <Badge key={skill} variant="default" className="flex items-center gap-1">
                              {skill}
                              <X 
                                className="h-3 w-3 cursor-pointer" 
                                onClick={() => removeSkill(skill)}
                              />
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <label className="text-sm font-medium">Project Files (Optional)</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <div className="text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-4">
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <span className="mt-2 block text-sm font-medium text-gray-900">
                          Upload project files
                        </span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          multiple
                          className="sr-only"
                          onChange={handleFileChange}
                        />
                      </label>
                      <p className="mt-1 text-xs text-gray-500">
                        Images, documents, or any relevant files
                      </p>
                    </div>
                  </div>
                </div>

                {selectedFiles.length > 0 && (
                  <div className="space-y-2">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span className="text-sm">{file.name}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <Button type="submit" className="flex-1">
                  Create Opportunity
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
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateOpportunity;
