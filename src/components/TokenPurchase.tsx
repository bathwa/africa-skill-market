
import React, { useState } from 'react';
import { useAuthStore } from '@/stores/indexedDBAuth';
import { useTokenStore } from '@/stores/tokenStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Coins, Upload, Copy, CreditCard } from 'lucide-react';

interface TokenPurchaseProps {
  children?: React.ReactNode;
}

const TokenPurchase = ({ children }: TokenPurchaseProps) => {
  const { profile } = useAuthStore();
  const { createPurchase } = useTokenStore();
  
  const [amount, setAmount] = useState(10);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [proofOfPayment, setProofOfPayment] = useState('');

  if (!profile) return null;

  const calculateCost = (tokens: number) => {
    const costUSD = tokens * 0.5;
    const costZAR = tokens * 10;
    return { usd: costUSD, zar: costZAR };
  };

  const getEscrowDetails = (country: string, currency: string) => {
    if (country === 'Zimbabwe') {
      return {
        support: {
          phone: '+263 78 998 9619',
          email: 'admin@abathwa.com',
          whatsapp: 'wa.me/789989619'
        },
        accounts: [
          {
            type: 'Mobile Wallets (Ecocash, Omari, Innbucks)',
            details: '0788420479 Vusa Ncube'
          },
          {
            type: 'Innbucks MicroBank',
            details: 'Account Name: Abathwa Incubator PBC\nAccount Number: 013113351190001'
          }
        ]
      };
    }
    
    // Default escrow details for other countries
    return {
      support: {
        phone: '+1 555 0123',
        email: 'support@skillzone.com',
        whatsapp: 'wa.me/15550123'
      },
      accounts: [
        {
          type: currency === 'ZAR' ? 'First National Bank' : 'Wells Fargo',
          details: currency === 'ZAR' 
            ? 'Account Name: SkillZone Platform\nAccount Number: 1234567890\nBranch Code: 250655'
            : 'Account Name: SkillZone Platform LLC\nAccount Number: 0987654321\nRouting Number: 121000248'
        }
      ]
    };
  };

  const handlePurchaseRequest = async () => {
    if (amount < 1) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid token amount (minimum 1).",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const cost = calculateCost(amount);
      const currency = profile.country === 'South Africa' ? 'ZAR' : 'USD';
      const totalCost = currency === 'ZAR' ? cost.zar : cost.usd;

      const result = await createPurchase(profile.id, totalCost, currency);

      if (result.success && result.voucher) {
        const escrowDetails = getEscrowDetails(profile.country, currency);
        
        setPaymentDetails({
          id: result.voucher.id,
          tokens: amount,
          cost: totalCost,
          currency,
          reference: result.voucher.reference,
          escrow: escrowDetails
        });
        setShowPaymentDetails(true);
        
        toast({
          title: "Purchase Request Created",
          description: "Please complete the payment using the provided details.",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create purchase request",
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

  const handleSubmitProof = async () => {
    if (!proofOfPayment.trim()) {
      toast({
        title: "Missing Proof",
        description: "Please provide proof of payment.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Proof Submitted",
      description: "Your proof of payment has been submitted for review.",
    });
    
    setIsDialogOpen(false);
    setShowPaymentDetails(false);
    setProofOfPayment('');
    setAmount(10);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Details copied to clipboard",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-yellow-600" />
          <span className="font-medium">Current Balance: {profile.tokens} tokens</span>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Purchase Tokens
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Purchase Tokens</DialogTitle>
              <DialogDescription>
                Tokens are used to access opportunities and services. Each token costs $0.50 (USD) or R10 (ZAR).
              </DialogDescription>
            </DialogHeader>

            {!showPaymentDetails ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Number of Tokens</label>
                  <Input
                    type="number"
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    placeholder="Enter number of tokens"
                  />
                </div>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <span>Total Cost:</span>
                      <div className="text-right">
                        <div className="font-bold">
                          ${calculateCost(amount).usd} USD
                        </div>
                        <div className="text-sm text-gray-600">
                          R{calculateCost(amount).zar} ZAR
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Button 
                  onClick={handlePurchaseRequest} 
                  disabled={isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? 'Processing...' : 'Generate Payment Details'}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Payment Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="p-3 bg-yellow-50 rounded-lg">
                        <p className="text-lg font-bold text-center">
                          Amount to Pay: {paymentDetails.currency} {paymentDetails.cost}
                        </p>
                        <p className="text-sm text-center text-gray-600">
                          Reference: {paymentDetails.reference}
                        </p>
                      </div>
                      
                      <div className="space-y-3">
                        <h4 className="font-semibold">Payment Options ({profile.country}):</h4>
                        {paymentDetails.escrow.accounts.map((account: any, index: number) => (
                          <div key={index} className="p-3 border rounded-lg">
                            <p className="font-medium">{account.type}</p>
                            <p className="text-sm whitespace-pre-line">{account.details}</p>
                          </div>
                        ))}
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="font-semibold">Support Contacts:</h4>
                        <div className="text-sm space-y-1">
                          <p>Phone: {paymentDetails.escrow.support.phone}</p>
                          <p>Email: {paymentDetails.escrow.support.email}</p>
                          <p>WhatsApp: {paymentDetails.escrow.support.whatsapp}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div>
                  <label className="block text-sm font-medium mb-2">Proof of Payment</label>
                  <Textarea
                    value={proofOfPayment}
                    onChange={(e) => setProofOfPayment(e.target.value)}
                    placeholder="Paste transaction details, upload receipt text, or describe your payment..."
                    rows={4}
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    Include transaction reference, date, and amount.
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSubmitProof} className="flex-1">
                    <Upload className="h-4 w-4 mr-2" />
                    Submit Proof
                  </Button>
                  <Button variant="outline" onClick={() => setShowPaymentDetails(false)}>
                    Back
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="text-sm text-gray-600">
        <p>• 1 token = $0.50 USD or R10 ZAR</p>
        <p>• Viewing client contact details costs 1 token</p>
        <p>• New users receive 10 free tokens</p>
      </div>

      {children}
    </div>
  );
};

export default TokenPurchase;
