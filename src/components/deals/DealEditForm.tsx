import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Save, X } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';
import { Textarea } from '@/components/ui/textarea';

type PipelineStage = Database['public']['Enums']['pipeline_stage'];
type RoundStage = Database['public']['Enums']['round_stage'];

interface Deal {
  id: string;
  company_name: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website: string | null;
  location: string | null;
  description: string | null;
  pipeline_stage: PipelineStage;
  round_stage: RoundStage | null;
  round_size: number | null;
  post_money_valuation: number | null;
  revenue: number | null;
  created_at: string;
  updated_at: string;
  deal_score: number | null;
  source_date: string | null;
  deal_source: string | null;
  deal_lead: string | null;
}

interface DealEditFormProps {
  deal: Deal;
  onSave: () => void;
  onCancel: () => void;
}

const formatCurrency = (amount: number | null) => {
  if (!amount) return '';
  return (amount / 100).toString();
};

const parseCurrency = (value: string) => {
  const num = parseFloat(value);
  return isNaN(num) ? null : Math.round(num * 100);
};

export function DealEditForm({ deal, onSave, onCancel }: DealEditFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    company_name: deal.company_name,
    contact_name: deal.contact_name || '',
    contact_email: deal.contact_email || '',
    contact_phone: deal.contact_phone || '',
    website: deal.website || '',
    location: deal.location || '',
    pipeline_stage: deal.pipeline_stage as PipelineStage,
    round_stage: deal.round_stage || '' as RoundStage | '',
    round_size: formatCurrency(deal.round_size),
    post_money_valuation: formatCurrency(deal.post_money_valuation),
    revenue: formatCurrency(deal.revenue),
    description: deal.description || '',
    deal_score: deal.deal_score?.toString() || '',
    source_date: deal.source_date || '',
    deal_source: deal.deal_source || '',
    deal_lead: deal.deal_lead || '',
  });
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const updateData = {
        company_name: formData.company_name,
        contact_name: formData.contact_name || null,
        contact_email: formData.contact_email || null,
        contact_phone: formData.contact_phone || null,
        website: formData.website || null,
        location: formData.location || null,
        pipeline_stage: formData.pipeline_stage,
        round_stage: formData.round_stage || null,
        round_size: parseCurrency(formData.round_size),
        post_money_valuation: parseCurrency(formData.post_money_valuation),
        revenue: parseCurrency(formData.revenue),
        description: formData.description || null,
        deal_score: formData.deal_score ? parseInt(formData.deal_score, 10) : null,
        source_date: formData.source_date || null,
        deal_source: formData.deal_source || null,
        deal_lead: formData.deal_lead || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('deals')
        .update(updateData)
        .eq('id', deal.id);

      if (error) throw error;

      toast({
        title: "Deal updated",
        description: "The deal has been successfully updated.",
      });

      onSave();
    } catch (error: any) {
      toast({
        title: "Error updating deal",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Edit Deal</h3>
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={isLoading}>
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button onClick={onCancel} variant="outline">
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Information */}
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="company_name">Company Name *</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => handleInputChange('company_name', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                placeholder="https://example.com"
              />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="City, State/Country"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Enter a description for the company..."
                className="min-h-[100px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="contact_name">Contact Name</Label>
              <Input
                id="contact_name"
                value={formData.contact_name}
                onChange={(e) => handleInputChange('contact_name', e.target.value)}
                placeholder="Contact name"
              />
            </div>
            <div>
              <Label htmlFor="contact_email">Email</Label>
              <Input
                id="contact_email"
                type="email"
                value={formData.contact_email}
                onChange={(e) => handleInputChange('contact_email', e.target.value)}
                placeholder="email@example.com"
              />
            </div>
            <div>
              <Label htmlFor="contact_phone">Phone</Label>
              <Input
                id="contact_phone"
                value={formData.contact_phone}
                onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                placeholder="Phone number"
              />
            </div>
          </CardContent>
        </Card>

        {/* Deal Status */}
        <Card>
          <CardHeader>
            <CardTitle>Deal Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="pipeline_stage">Pipeline Stage</Label>
              <Select value={formData.pipeline_stage} onValueChange={(value: PipelineStage) => handleInputChange('pipeline_stage', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Seen Not Reviewed">Seen Not Reviewed</SelectItem>
                  <SelectItem value="Initial Review">Initial Review</SelectItem>
                  <SelectItem value="Initial Contact">Initial Contact</SelectItem>
                  <SelectItem value="First Meeting">First Meeting</SelectItem>
                  <SelectItem value="Due Diligence">Due Diligence</SelectItem>
                  <SelectItem value="Term Sheet">Term Sheet</SelectItem>
                  <SelectItem value="Legal Review">Legal Review</SelectItem>
                  <SelectItem value="Invested">Invested</SelectItem>
                  <SelectItem value="Passed">Passed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="round_stage">Round Stage</Label>
              <Select value={formData.round_stage} onValueChange={(value: RoundStage) => handleInputChange('round_stage', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select round stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pre-Seed">Pre-Seed</SelectItem>
                  <SelectItem value="Seed">Seed</SelectItem>
                  <SelectItem value="Series A">Series A</SelectItem>
                  <SelectItem value="Series B">Series B</SelectItem>
                  <SelectItem value="Series C">Series C</SelectItem>
                  <SelectItem value="Bridge">Bridge</SelectItem>
                  <SelectItem value="Growth">Growth</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="deal_score">Deal Score (0-100)</Label>
              <Input
                id="deal_score"
                type="number"
                min="0"
                max="100"
                value={formData.deal_score}
                onChange={(e) => handleInputChange('deal_score', e.target.value)}
                placeholder="Enter a score from 0 to 100"
              />
            </div>
            <div>
              <Label htmlFor="deal_lead">Deal Lead</Label>
              <Input
                id="deal_lead"
                value={formData.deal_lead}
                onChange={(e) => handleInputChange('deal_lead', e.target.value)}
                placeholder="Name of the deal lead"
              />
            </div>
            <div>
              <Label htmlFor="deal_source">Deal Source</Label>
              <Input
                id="deal_source"
                value={formData.deal_source}
                onChange={(e) => handleInputChange('deal_source', e.target.value)}
                placeholder="e.g. Referral, Conference, Cold Outreach"
              />
            </div>
            <div>
              <Label htmlFor="source_date">Source Date</Label>
              <Input
                id="source_date"
                type="date"
                value={formData.source_date.split('T')[0]}
                onChange={(e) => handleInputChange('source_date', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Financial Information */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="round_size">Round Size ($)</Label>
              <Input
                id="round_size"
                type="number"
                value={formData.round_size}
                onChange={(e) => handleInputChange('round_size', e.target.value)}
                placeholder="1000000"
              />
            </div>
            <div>
              <Label htmlFor="post_money_valuation">Post-Money Valuation ($)</Label>
              <Input
                id="post_money_valuation"
                type="number"
                value={formData.post_money_valuation}
                onChange={(e) => handleInputChange('post_money_valuation', e.target.value)}
                placeholder="10000000"
              />
            </div>
            <div>
              <Label htmlFor="revenue">Revenue ($)</Label>
              <Input
                id="revenue"
                type="number"
                value={formData.revenue}
                onChange={(e) => handleInputChange('revenue', e.target.value)}
                placeholder="500000"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
