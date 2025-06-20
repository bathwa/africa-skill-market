
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useTokenStore, TokenPurchase } from '@/stores/tokenStore';
import { useAuthStore } from '@/stores/indexedDBAuth';
import { toast } from '@/hooks/use-toast';
import { Coins, Check, X, Eye } from 'lucide-react';

const TokenManagement = () => {
  const { profile } = useAuthStore();
  const { purchases, loadPurchases, processPurchase, getPendingPurchases } = useTokenStore();
  const [selectedPurchase, setSelectedPurchase] = useState<TokenPurchase | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadPurchases();
  }, [loadPurchases]);

  const handleProcessPurchase = async (purchaseId: string, approved: boolean) => {
    if (!profile) return;

    setIsLoading(true);
    try {
      const result = await processPurchase(purchaseId, approved, profile.id);
      if (result.success) {
        toast({
          title: "Success",
          description: `Purchase ${approved ? 'approved' : 'rejected'} successfully`
        });
        
        // If approved, we would need to add tokens to user's account
        // This would require updating the user's profile in the auth store
        if (approved) {
          const purchase = purchases.find(p => p.id === purchaseId);
          if (purchase) {
            // Here we would update the user's token balance
            // For now, we'll just show a success message
            console.log(`Should add ${purchase.tokens} tokens to user ${purchase.user_id}`);
          }
        }
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process purchase",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const pendingPurchases = getPendingPurchases();

  if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
    return <div>Access denied</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Token Purchase Management
          </CardTitle>
          <CardDescription>Review and process token purchases</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Pending Purchases ({pendingPurchases.length})</h3>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead>Tokens</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchases.map((purchase) => (
                <TableRow key={purchase.id}>
                  <TableCell className="font-mono text-sm">
                    {purchase.reference_number}
                  </TableCell>
                  <TableCell>{purchase.currency} {purchase.amount}</TableCell>
                  <TableCell>{purchase.currency}</TableCell>
                  <TableCell>{purchase.tokens}</TableCell>
                  <TableCell>
                    <Badge className={getStatusBadgeColor(purchase.status)}>
                      {purchase.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(purchase.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedPurchase(purchase)}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      {purchase.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleProcessPurchase(purchase.id, true)}
                            disabled={isLoading}
                            className="text-green-600 hover:text-green-700"
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleProcessPurchase(purchase.id, false)}
                            disabled={isLoading}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedPurchase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Purchase Details</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Reference Number</label>
                <p className="font-mono text-sm">{selectedPurchase.reference_number}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Amount</label>
                  <p>{selectedPurchase.currency} {selectedPurchase.amount}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tokens</label>
                  <p>{selectedPurchase.tokens}</p>
                </div>
              </div>

              {selectedPurchase.proof_of_payment && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Proof of Payment</label>
                  <div className="border rounded p-4">
                    <p className="text-sm text-gray-600 mb-2">
                      Type: {selectedPurchase.proof_of_payment.type}
                    </p>
                    {selectedPurchase.proof_of_payment.type === 'text' ? (
                      <p className="text-sm">{selectedPurchase.proof_of_payment.content}</p>
                    ) : selectedPurchase.proof_of_payment.type === 'image' ? (
                      <img 
                        src={selectedPurchase.proof_of_payment.content} 
                        alt="Proof of payment" 
                        className="max-w-full h-auto rounded"
                      />
                    ) : (
                      <p className="text-sm">PDF: {selectedPurchase.proof_of_payment.filename}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="block font-medium text-gray-700">Created</label>
                  <p>{new Date(selectedPurchase.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <label className="block font-medium text-gray-700">Status</label>
                  <Badge className={getStatusBadgeColor(selectedPurchase.status)}>
                    {selectedPurchase.status}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              {selectedPurchase.status === 'pending' && (
                <>
                  <Button
                    onClick={() => {
                      handleProcessPurchase(selectedPurchase.id, true);
                      setSelectedPurchase(null);
                    }}
                    disabled={isLoading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Approve
                  </Button>
                  <Button
                    onClick={() => {
                      handleProcessPurchase(selectedPurchase.id, false);
                      setSelectedPurchase(null);
                    }}
                    disabled={isLoading}
                    variant="outline"
                    className="text-red-600 hover:text-red-700"
                  >
                    Reject
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                onClick={() => setSelectedPurchase(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TokenManagement;
