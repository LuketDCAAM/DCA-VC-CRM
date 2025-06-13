
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus } from 'lucide-react';

interface AddPortfolioDialogProps {
  onSuccess: () => void;
  children?: React.ReactNode;
}

export default function AddPortfolioDialog({ onSuccess, children }: AddPortfolioDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    company_name: '',
    status: 'Active' as const,
    tags: '',
    investment_date: '',
    amount_invested: '',
    post_money_valuation: '',
    ownership_percentage: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);

      // First, create the portfolio company
      const { data: company, error: companyError } = await supabase
        .from('portfolio_companies')
        .insert({
          company_name: formData.company_name,
          status: formData.status,
          tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : null,
          created_by: user.id,
        })
        .select()
        .single();

      if (companyError) throw companyError;

      // If investment details are provided, create the investment record
      if (formData.investment_date && formData.amount_invested) {
        const { error: investmentError } = await supabase
          .from('investments')
          .insert({
            portfolio_company_id: company.id,
            investment_date: formData.investment_date,
            amount_invested: Math.round(parseFloat(formData.amount_invested) * 100), // Convert to cents
            post_money_valuation: formData.post_money_valuation 
              ? Math.round(parseFloat(formData.post_money_valuation) * 100) 
              : null,
            ownership_percentage: formData.ownership_percentage 
              ? parseFloat(formData.ownership_percentage) / 100 
              : null,
          });

        if (investmentError) throw investmentError;

        // Update current valuation if provided
        if (formData.post_money_valuation || formData.ownership_percentage) {
          await supabase
            .from('current_valuations')
            .upsert({
              portfolio_company_id: company.id,
              last_round_post_money_valuation: formData.post_money_valuation 
                ? Math.round(parseFloat(formData.post_money_valuation) * 100) 
                : null,
              current_ownership_percentage: formData.ownership_percentage 
                ? parseFloat(formData.ownership_percentage) / 100 
                : null,
            });
        }
      }

      toast({
        title: "Portfolio company added",
        description: `${formData.company_name} has been added to your portfolio.`,
      });

      setFormData({
        company_name: '',
        status: 'Active',
        tags: '',
        investment_date: '',
        amount_invested: '',
        post_money_valuation: '',
        ownership_percentage: '',
      });
      setOpen(false);
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error adding portfolio company",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Portfolio Company
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Portfolio Company</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="company_name">Company Name *</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Exited">Exited</SelectItem>
                  <SelectItem value="Dissolved">Dissolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="e.g., SaaS, B2B, Series A"
            />
          </div>

          <div className="border-t pt-4">
            <h3 className="text-lg font-medium mb-3">Investment Details (Optional)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="investment_date">Investment Date</Label>
                <Input
                  id="investment_date"
                  type="date"
                  value={formData.investment_date}
                  onChange={(e) => setFormData({ ...formData, investment_date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="amount_invested">Amount Invested ($)</Label>
                <Input
                  id="amount_invested"
                  type="number"
                  step="0.01"
                  value={formData.amount_invested}
                  onChange={(e) => setFormData({ ...formData, amount_invested: e.target.value })}
                  placeholder="100000"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <Label htmlFor="post_money_valuation">Post-Money Valuation ($)</Label>
                <Input
                  id="post_money_valuation"
                  type="number"
                  step="0.01"
                  value={formData.post_money_valuation}
                  onChange={(e) => setFormData({ ...formData, post_money_valuation: e.target.value })}
                  placeholder="10000000"
                />
              </div>
              <div>
                <Label htmlFor="ownership_percentage">Ownership Percentage (%)</Label>
                <Input
                  id="ownership_percentage"
                  type="number"
                  step="0.01"
                  value={formData.ownership_percentage}
                  onChange={(e) => setFormData({ ...formData, ownership_percentage: e.target.value })}
                  placeholder="5.0"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Company'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
