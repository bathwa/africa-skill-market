
import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/indexedDBAuth';
import { useOpportunityStore, Opportunity } from '@/stores/opportunityStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Edit, Trash2, Eye, Star, CheckCircle, XCircle, DollarSign, Calendar, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

const ManageOpportunities = () => {
  const { profile } = useAuthStore();
  const { opportunities, loadOpportunities, updateOpportunity } = useOpportunityStore();
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    budget: 0,
    status: 'open' as const,
  });

  useEffect(() => {
    loadOpportunities();
  }, [loadOpportunities]);

  if (!profile || profile.role !== 'client') {
    return (
      <div className="text-center py-12">
        <p>Access denied. Only clients can manage opportunities.</p>
      </div>
    );
  }

  const myOpportunities = opportunities.filter(opp => opp.client_id === profile.id);

  const handleEdit = (opportunity: Opportunity) => {
    setSelectedOpportunity(opportunity);
    setEditForm({
      title: opportunity.title,
      description: opportunity.description,
      budget: opportunity.budget,
      status: opportunity.status,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedOpportunity) return;

    const result = await updateOpportunity(selectedOpportunity.id, {
      ...editForm,
      updated_at: new Date().toISOString(),
    });

    if (result.success) {
      toast({
        title: "Opportunity updated",
        description: "Your opportunity has been updated successfully.",
      });
      setIsEditDialogOpen(false);
      loadOpportunities();
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (opportunityId: string, newStatus: 'open' | 'in_progress' | 'completed' | 'cancelled') => {
    const result = await updateOpportunity(opportunityId, {
      status: newStatus,
      updated_at: new Date().toISOString(),
    });

    if (result.success) {
      toast({
        title: "Status updated",
        description: `Opportunity status changed to ${newStatus}.`,
      });
      loadOpportunities();
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  const handleRateProvider = async (opportunityId: string, rating: number) => {
    const result = await updateOpportunity(opportunityId, {
      client_rating: rating,
      updated_at: new Date().toISOString(),
    });

    if (result.success) {
      toast({
        title: "Rating submitted",
        description: "Thank you for rating the service provider.",
      });
      loadOpportunities();
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Opportunities</h1>
          <p className="text-gray-600 mt-2">
            Manage your posted opportunities and projects
          </p>
        </div>
        <Link to="/client/create">
          <Button>Create New Opportunity</Button>
        </Link>
      </div>

      {myOpportunities.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No opportunities posted</h3>
            <p className="text-gray-600 mb-4">Start by creating your first opportunity</p>
            <Link to="/client/create">
              <Button>Create Opportunity</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {myOpportunities.map((opportunity) => (
            <Card key={opportunity.id} className="h-full">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{opportunity.title}</CardTitle>
                  <Badge className={getStatusColor(opportunity.status)}>
                    {opportunity.status.replace('_', ' ')}
                  </Badge>
                </div>
                <CardDescription className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(opportunity.created_at).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    {opportunity.currency} {opportunity.budget}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600 line-clamp-3">
                  {opportunity.description}
                </p>

                <div className="flex flex-wrap gap-1">
                  {opportunity.skills_required.slice(0, 3).map((skill, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                  {opportunity.skills_required.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{opportunity.skills_required.length - 3} more
                    </Badge>
                  )}
                </div>

                {opportunity.assigned_provider_id && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-900">
                      Project assigned to service provider
                    </p>
                    {opportunity.status === 'completed' && !opportunity.client_rating && (
                      <div className="mt-2">
                        <p className="text-sm text-blue-700 mb-2">Rate this service provider:</p>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <Star
                              key={rating}
                              className="h-5 w-5 cursor-pointer hover:text-yellow-500"
                              onClick={() => handleRateProvider(opportunity.id, rating)}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    {opportunity.client_rating && (
                      <div className="mt-2 flex items-center gap-1">
                        <span className="text-sm text-blue-700">Your rating:</span>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${star <= opportunity.client_rating! ? 'text-yellow-500' : 'text-gray-300'}`}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(opportunity)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>

                  {opportunity.status === 'open' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange(opportunity.id, 'cancelled')}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  )}

                  {opportunity.status === 'in_progress' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange(opportunity.id, 'completed')}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Mark Complete
                    </Button>
                  )}

                  {opportunity.status === 'cancelled' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange(opportunity.id, 'open')}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Reopen
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Opportunity</DialogTitle>
            <DialogDescription>
              Update your opportunity details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Title</label>
              <Input
                value={editForm.title}
                onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <Textarea
                value={editForm.description}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Budget</label>
              <Input
                type="number"
                value={editForm.budget}
                onChange={(e) => setEditForm(prev => ({ ...prev, budget: Number(e.target.value) }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <Select 
                value={editForm.status} 
                onValueChange={(value) => setEditForm(prev => ({ ...prev, status: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={handleUpdate} className="flex-1">
                Update Opportunity
              </Button>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageOpportunities;
