
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/indexedDBAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { Eye, EyeOff, Shield } from 'lucide-react';
import { SADC_COUNTRIES } from '@/stores/indexedDBAuth';

const AuthPage = () => {
  const { login, register } = useAuthStore();
  const navigate = useNavigate();
  
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    country: '',
    phone: '',
    role: 'client' as 'client' | 'service_provider',
    adminKey: ''
  });

  const superAdminEmails = ['admin@abathwa.com', 'abathwabiz@gmail.com'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        const result = await login(
          formData.email, 
          formData.password, 
          showAdminLogin ? formData.adminKey : undefined
        );
        
        if (result.success) {
          toast({
            title: "Welcome back!",
            description: "You have been logged in successfully.",
          });
          navigate('/dashboard');
        } else {
          toast({
            title: "Login failed",
            description: result.error,
            variant: "destructive"
          });
        }
      } else {
        if (!formData.name || !formData.country) {
          toast({
            title: "Missing information",
            description: "Please fill in all required fields.",
            variant: "destructive"
          });
          return;
        }

        const result = await register({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          country: formData.country,
          phone: formData.phone,
          role: formData.role
        });
        
        if (result.success) {
          toast({
            title: "Account created!",
            description: "Your account has been created successfully.",
          });
          navigate('/dashboard');
        } else {
          toast({
            title: "Registration failed",
            description: result.error,
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      toast({
        title: "An error occurred",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailChange = (email: string) => {
    setFormData(prev => ({ ...prev, email }));
    setShowAdminLogin(superAdminEmails.includes(email));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {isLogin ? 'Welcome Back' : 'Join SkillZone'}
          </CardTitle>
          <CardDescription>
            {isLogin 
              ? 'Sign in to your account' 
              : 'Create your account to get started'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleEmailChange(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter your password"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {showAdminLogin && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-800">Admin Access</span>
                </div>
                <Input
                  type="password"
                  value={formData.adminKey}
                  onChange={(e) => setFormData(prev => ({ ...prev, adminKey: e.target.value }))}
                  placeholder="Enter admin key"
                />
                <p className="text-xs text-orange-600 mt-1">
                  Leave empty to login as regular user
                </p>
              </div>
            )}

            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Full Name</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Country</label>
                  <Select value={formData.country} onValueChange={(value) => setFormData(prev => ({ ...prev, country: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your country" />
                    </SelectTrigger>
                    <SelectContent>
                      {SADC_COUNTRIES.map(country => (
                        <SelectItem key={country} value={country}>{country}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Phone (Optional)</label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter your phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">I want to:</label>
                  <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value as 'client' | 'service_provider' }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="client">Hire service providers</SelectItem>
                      <SelectItem value="service_provider">Offer my services</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
            </Button>
          </form>

          <Separator className="my-6" />

          <div className="text-center">
            <p className="text-sm text-gray-600">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
            </p>
            <Button
              variant="link"
              onClick={() => {
                setIsLogin(!isLogin);
                setFormData(prev => ({ ...prev, adminKey: '' }));
                setShowAdminLogin(false);
              }}
              className="p-0 h-auto"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;
