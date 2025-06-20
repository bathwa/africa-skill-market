
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useAuthStore } from '@/stores/indexedDBAuth';
import { useTokenStore, TOKEN_PRICE_USD, TOKEN_PRICE_ZAR } from '@/stores/tokenStore';
import { toast } from '@/hooks/use-toast';
import { Coins, Copy, Upload, CreditCard } from 'lucide-react';

interface TokenPurchaseProps {
  children: React.ReactNode;
}

const TokenPurchase: React.FC<TokenPurchaseProps> = ({ children }) => {
  const { profile } = useAuthStore();
  const { createPurchase, submitProofOfPayment } = useTokenStore();
  
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'amount' | 'voucher' | 'proof'>('amount');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<'USD' | 'ZAR'>('USD');
  const [voucherDetails, setVoucherDetails] = useState<any>(null);
  const [purchaseId, setPurchaseId] = useState<string>('');
  const [proofType, setProofType] = useState<'text' | 'image' | 'pdf'>('text');
  const [proofContent, setProofContent] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const tokenPrice = currency === 'USD' ? TOKEN_PRICE_USD : TOKEN_PRICE_ZAR;
  const calculatedTokens = Math.floor(parseFloat(amount || '0') / tokenPrice);

  const handleCreatePurchase = async () => {
    if (!profile || !amount) return;

    setIsLoading(true);
    try {
      const result = await createPurchase(profile.id, parseFloat(amount), currency);
      if (result.success && result.voucher) {
        setVoucherDetails(result.voucher);
        // Find the purchase ID (we'd need to modify the store to return it)
        setStep('voucher');
      } else {
        toast({
          title: "Purchase failed",
          description: result.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create purchase",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyDetails = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Payment details copied to clipboard"
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setProofFile(file);
      // Convert to base64
      const reader = new FileReader();
      reader.onload = () => {
        setProofContent(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitProof = async () => {
    if (!purchaseId) return;

    setIsLoading(true);
    try {
      const proof = {
        type: proofType,
        content: proofContent,
        filename: proofFile?.name,
      };

      const result = await submitProofOfPayment(purchaseId, proof);
      if (result.success) {
        toast({
          title: "Proof submitted",
          description: "Your proof of payment has been submitted for review"
        });
        setIsOpen(false);
        resetForm();
      } else {
        toast({
          title: "Submission failed",
          description: result.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit proof",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setStep('amount');
    setAmount('');
    setCurrency('USD');
    setVoucherDetails(null);
    setPurchaseId('');
    setProofType('text');
    setProofContent('');
    setProofFile(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild onClick={() => setIsOpen(true)}>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Purchase Tokens
          </DialogTitle>
          <DialogDescription>
            {step === 'amount' && 'Enter the amount you want to spend'}
            {step === 'voucher' && 'Use these details to make your payment'}
            {step === 'proof' && 'Upload your proof of payment'}
          </DialogDescription>
        </DialogHeader>

        {step === 'amount' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={currency} onValueChange={(value: 'USD' | 'ZAR') => setCurrency(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($0.50 per token)</SelectItem>
                  <SelectItem value="ZAR">ZAR (R10 per token)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount ({currency})</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`Enter amount in ${currency}`}
              />
            </div>

            {amount && (
              <Card>
                <CardContent className="pt-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">You will receive</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {calculatedTokens} tokens
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {currency} {parseFloat(amount).toFixed(2)} ÷ {currency} {tokenPrice} = {calculatedTokens} tokens
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            <Button 
              onClick={handleCreatePurchase} 
              className="w-full"
              disabled={!amount || calculatedTokens === 0 || isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Purchase'}
            </Button>
          </div>
        )}

        {step === 'voucher' && voucherDetails && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Payment Details</CardTitle>
                <CardDescription>Use these details to make your payment</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Bank:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{voucherDetails.bank_name}</span>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => handleCopyDetails(voucherDetails.bank_name)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Account:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono">{voucherDetails.account_number}</span>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => handleCopyDetails(voucherDetails.account_number)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Reference:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono text-blue-600">{voucherDetails.reference}</span>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => handleCopyDetails(voucherDetails.reference)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm font-medium">Amount:</span>
                  <span className="text-lg font-bold">
                    {voucherDetails.currency} {voucherDetails.amount}
                  </span>
                </div>
              </CardContent>
            </Card>

            <div className="text-xs text-gray-600 space-y-1">
              <p>• Make the payment using your banking app or wallet</p>
              <p>• Use the exact reference number provided</p>
              <p>• Keep your proof of payment ready</p>
            </div>

            <Button onClick={() => setStep('proof')} className="w-full">
              I've Made Payment
            </Button>
          </div>
        )}

        {step === 'proof' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="proofType">Proof Type</Label>
              <Select value={proofType} onValueChange={(value: 'text' | 'image' | 'pdf') => setProofType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text (Transaction ID/Reference)</SelectItem>
                  <SelectItem value="image">Image (Screenshot)</SelectItem>
                  <SelectItem value="pdf">PDF (Bank Statement)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {proofType === 'text' ? (
              <div className="space-y-2">
                <Label htmlFor="proofText">Transaction Details</Label>
                <Textarea
                  id="proofText"
                  value={proofContent}
                  onChange={(e) => setProofContent(e.target.value)}
                  placeholder="Enter transaction ID, reference number, or other payment details..."
                  rows={4}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="proofFile">Upload File</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <input
                    id="proofFile"
                    type="file"
                    accept={proofType === 'image' ? 'image/*' : '.pdf'}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label htmlFor="proofFile" className="cursor-pointer">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      Click to upload {proofType === 'image' ? 'an image' : 'a PDF'}
                    </p>
                    {proofFile && (
                      <p className="text-xs text-blue-600 mt-2">
                        Selected: {proofFile.name}
                      </p>
                    )}
                  </label>
                </div>
              </div>
            )}

            <Button 
              onClick={handleSubmitProof} 
              className="w-full"
              disabled={!proofContent || isLoading}
            >
              {isLoading ? 'Submitting...' : 'Submit Proof'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TokenPurchase;
