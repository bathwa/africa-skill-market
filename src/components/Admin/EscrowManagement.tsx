
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useAuthStore, SADC_COUNTRIES } from '@/stores/indexedDBAuth';
import { toast } from '@/hooks/use-toast';
import { Shield, Plus, Edit, Trash } from 'lucide-react';

export interface EscrowAccount {
  id: string;
  name: string;
  country: string;
  type: 'bank' | 'mobile_money' | 'crypto';
  details: string;
  is_active: boolean;
  created_at: string;
}

class EscrowDB {
  private dbName = 'skillzone-escrow';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = () => {
        const db = request.result;
        
        if (!db.objectStoreNames.contains('escrow_accounts')) {
          const escrowStore = db.createObjectStore('escrow_accounts', { keyPath: 'id' });
          escrowStore.createIndex('country', 'country');
          escrowStore.createIndex('is_active', 'is_active');
        }
      };
    });
  }

  async saveEscrowAccount(account: EscrowAccount): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const transaction = this.db.transaction(['escrow_accounts'], 'readwrite');
    const store = transaction.objectStore('escrow_accounts');
    await store.put(account);
  }

  async getAllEscrowAccounts(): Promise<EscrowAccount[]> {
    if (!this.db) throw new Error('Database not initialized');
    const transaction = this.db.transaction(['escrow_accounts'], 'readonly');
    const store = transaction.objectStore('escrow_accounts');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteEscrowAccount(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const transaction = this.db.transaction(['escrow_accounts'], 'readwrite');
    const store = transaction.objectStore('escrow_accounts');
    await store.delete(id);
  }
}

const escrowDB = new EscrowDB();

const EscrowManagement = () => {
  const { profile } = useAuthStore();
  const [escrowAccounts, setEscrowAccounts] = useState<EscrowAccount[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<EscrowAccount | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    country: '',
    type: 'bank' as EscrowAccount['type'],
    details: '',
  });

  useEffect(() => {
    loadEscrowAccounts();
  }, []);

  const loadEscrowAccounts = async () => {
    try {
      await escrowDB.init();
      const accounts = await escrowDB.getAllEscrowAccounts();
      setEscrowAccounts(accounts);
    } catch (error) {
      console.error('Error loading escrow accounts:', error);
      toast({
        title: "Error",
        description: "Failed to load escrow accounts",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.country || !formData.details) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      await escrowDB.init();
      
      const account: EscrowAccount = {
        id: editingAccount?.id || crypto.randomUUID(),
        ...formData,
        is_active: true,
        created_at: editingAccount?.created_at || new Date().toISOString(),
      };

      await escrowDB.saveEscrowAccount(account);
      
      if (editingAccount) {
        setEscrowAccounts(accounts => 
          accounts.map(a => a.id === account.id ? account : a)
        );
      } else {
        setEscrowAccounts(accounts => [...accounts, account]);
      }

      setShowForm(false);
      setEditingAccount(null);
      setFormData({ name: '', country: '', type: 'bank', details: '' });
      
      toast({
        title: "Success",
        description: `Escrow account ${editingAccount ? 'updated' : 'created'} successfully`
      });
    } catch (error) {
      console.error('Error saving escrow account:', error);
      toast({
        title: "Error",
        description: "Failed to save escrow account",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (account: EscrowAccount) => {
    setEditingAccount(account);
    setFormData({
      name: account.name,
      country: account.country,
      type: account.type,
      details: account.details,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this escrow account?')) {
      return;
    }

    try {
      await escrowDB.init();
      await escrowDB.deleteEscrowAccount(id);
      setEscrowAccounts(accounts => accounts.filter(a => a.id !== id));
      
      toast({
        title: "Success",
        description: "Escrow account deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting escrow account:', error);
      toast({
        title: "Error",
        description: "Failed to delete escrow account",
        variant: "destructive"
      });
    }
  };

  const toggleActive = async (account: EscrowAccount) => {
    try {
      await escrowDB.init();
      const updatedAccount = { ...account, is_active: !account.is_active };
      await escrowDB.saveEscrowAccount(updatedAccount);
      
      setEscrowAccounts(accounts => 
        accounts.map(a => a.id === account.id ? updatedAccount : a)
      );
      
      toast({
        title: "Success",
        description: `Escrow account ${updatedAccount.is_active ? 'activated' : 'deactivated'}`
      });
    } catch (error) {
      console.error('Error updating escrow account:', error);
      toast({
        title: "Error",
        description: "Failed to update escrow account",
        variant: "destructive"
      });
    }
  };

  if (!profile || profile.role !== 'super_admin') {
    return <div>Access denied. Super admin privileges required.</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Escrow Account Management
        </CardTitle>
        <CardDescription>Manage escrow accounts for different countries</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">Escrow Accounts</h3>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Escrow Account
          </Button>
        </div>

        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{editingAccount ? 'Edit' : 'Create'} Escrow Account</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Account Name</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g., FNB Zimbabwe Main Account"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Country</label>
                  <Select
                    value={formData.country}
                    onValueChange={(country) => setFormData({...formData, country})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {SADC_COUNTRIES.map(country => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Account Type</label>
                  <Select
                    value={formData.type}
                    onValueChange={(type) => setFormData({...formData, type: type as EscrowAccount['type']})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank">Bank Account</SelectItem>
                      <SelectItem value="mobile_money">Mobile Money</SelectItem>
                      <SelectItem value="crypto">Cryptocurrency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Account Details</label>
                  <Textarea
                    value={formData.details}
                    onChange={(e) => setFormData({...formData, details: e.target.value})}
                    placeholder="Bank name, account number, branch details, etc."
                    rows={4}
                    required
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Saving...' : (editingAccount ? 'Update' : 'Create')} Account
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setEditingAccount(null);
                      setFormData({ name: '', country: '', type: 'bank', details: '' });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {escrowAccounts.map((account) => (
              <TableRow key={account.id}>
                <TableCell>{account.name}</TableCell>
                <TableCell>{account.country}</TableCell>
                <TableCell className="capitalize">{account.type.replace('_', ' ')}</TableCell>
                <TableCell>
                  <Badge className={account.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {account.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(account.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(account)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleActive(account)}
                    >
                      <Shield className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(account.id)}
                    >
                      <Trash className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default EscrowManagement;
