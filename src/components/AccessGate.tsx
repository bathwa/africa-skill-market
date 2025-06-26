
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Coins, MessageCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/indexedDBAuth';
import { toast } from '@/hooks/use-toast';

interface AccessGateProps {
  type: 'opportunity' | 'provider';
  title: string;
  description: string;
  cost: number;
  onPurchase: () => Promise<void>;
  hasAccess: boolean;
  children: React.ReactNode;
}

const AccessGate = ({ type, title, description, cost, onPurchase, hasAccess, children }: AccessGateProps) => {
  const { profile } = useAuthStore();

  const handlePurchase = async () => {
    if (!profile) {
      toast({
        title: "Authentication Required",
        description: "Please log in to purchase access.",
        variant: "destructive"
      });
      return;
    }

    if (profile.tokens < cost) {
      toast({
        title: "Insufficient Tokens",
        description: `You need ${cost} token${cost > 1 ? 's' : ''} to access this ${type}. Please purchase more tokens.`,
        variant: "destructive"
      });
      return;
    }

    try {
      await onPurchase();
      toast({
        title: "Access Granted",
        description: `You now have access to this ${type}. Chat feature is now available!`,
      });
    } catch (error) {
      toast({
        title: "Purchase Failed",
        description: "Unable to complete purchase. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (hasAccess) {
    return <div>{children}</div>;
  }

  return (
    <Card className="border-2 border-dashed border-gray-300">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
          <Lock className="h-6 w-6 text-gray-600" />
        </div>
        <CardTitle>Premium Access Required</CardTitle>
        <CardDescription>
          Unlock full details and chat functionality for this {type}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium mb-2">{title}</h4>
          <p className="text-sm text-gray-600 line-clamp-2">{description}</p>
        </div>
        
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-blue-600" />
            <span className="font-medium">Access Cost</span>
          </div>
          <Badge variant="secondary">{cost} Token{cost > 1 ? 's' : ''}</Badge>
        </div>

        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            <span>Real-time chat with {type === 'opportunity' ? 'client' : 'service provider'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>👤</span>
            <span>Full contact details</span>
          </div>
          <div className="flex items-center gap-2">
            <span>📱</span>
            <span>Direct communication channels</span>
          </div>
        </div>

        <Button onClick={handlePurchase} className="w-full" size="lg">
          <Lock className="h-4 w-4 mr-2" />
          Purchase Access ({cost} Token{cost > 1 ? 's' : ''})
        </Button>

        {profile && (
          <div className="text-center text-sm text-gray-600">
            Your current balance: {profile.tokens} tokens
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AccessGate;
