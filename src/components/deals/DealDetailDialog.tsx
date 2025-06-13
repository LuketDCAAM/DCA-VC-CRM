
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Building2, User, Mail, Phone, Globe, MapPin, DollarSign, Calendar, Edit, Save, X } from 'lucide-react';

interface Deal {
  id: string;
  company_name: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website: string | null;
  location: string | null;
  pipeline_stage: string;
  round_stage: string | null;
  round_size: number | null;
  post_money_valuation: number | null;
  revenue: number | null;
  created_at: string;
  updated_at: string;
}

interface DealDetailDialogProps {
  deal: Deal;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDealUpdated: () => void;
}

const formatCurrency = (amount: number | null) => {
  if (!amount) return '';
  return (amount / 100).toString(); // Convert from cents to dollars for editing
};

const parseCurrency = (value: string) => {
  const num = parseFloat(value);
  return isNaN(num) ? null : Math.round(num * 100); // Convert to cents
};

const getStageColor = (stage: string) => {
  const colors = {
    'Initial Contact': 'bg-gray-100 text-gray-800',
    'First Meeting': 'bg-blue-100 text-blue-800',
    'Due Diligence': 'bg-yellow-100 text-yellow-800',
    'Term Sheet': 'bg-purple-100 text-purple-800',
    'Legal Review': 'bg-orange-100 text-orange-800',
    'Invested': 'bg-green-100 text-green-800',
    'Passed': 'bg-red-100 text-red-800',
  };
  return colors[stage as keyof typeof colors] || 'bg-gray-100 text-gray-800';
};

export function DealDetailDialog({ deal, open, onOpenChange, onDealUpdated }: DealDetailDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    company_name: deal.company_name,
    contact_name: deal.contact_name || '',
    contact_email: deal.contact_email || '',
    contact_phone: deal.contact_phone || '',
    website: deal.website || '',
    location: deal.location || '',
    pipeline_stage: deal.pipeline_stage,
    round_stage: deal.round_stage || '',
    round_size: formatCurrency(deal.round_size),
    post_money_valuation: formatCurrency(deal.post_money_valuation),
    revenue: formatCurrency(deal.revenue),
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

      setIsEditing(false);
      onDealUpdated();
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

  const handleCancel = () => {
    setFormData({
      company_name: deal.company_name,
      contact_name: deal.contact_name || '',
      contact_email: deal.contact_email || '',
      contact_phone: deal.contact_phone || '',
      website: deal.website || '',
      location: deal.location || '',
      pipeline_stage: deal.pipeline_stage,
      round_stage: deal.round_stage || '',
      round_size: formatCurrency(deal.round_size),
      post_money_valuation: formatCurrency(deal.post_money_valuation),
      revenue: formatCurrency(deal.revenue),
    });
    setIsEditing(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-6 w-6" />
              {isEditing ? (
                <Input
                  value={formData.company_name}
                  onChange={(e) => handleInputChange('company_name', e.target.value)}
                  className="text-lg font-semibold"
                />
              ) : (
                deal.company_name
              )}
            </DialogTitle>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button onClick={handleSave} disabled={isLoading} size="sm">
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button onClick={handleCancel} variant="outline" size="sm">
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)} size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Deal Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Deal Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Pipeline Stage</Label>
                {isEditing ? (
                  <Select value={formData.pipeline_stage} onValueChange={(value) => handleInputChange('pipeline_stage', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Initial Contact">Initial Contact</SelectItem>
                      <SelectItem value="First Meeting">First Meeting</SelectItem>
                      <SelectItem value="Due Diligence">Due Diligence</SelectItem>
                      <SelectItem value="Term Sheet">Term Sheet</SelectItem>
                      <SelectItem value="Legal Review">Legal Review</SelectItem>
                      <SelectItem value="Invested">Invested</SelectItem>
                      <SelectItem value="Passed">Passed</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="mt-1">
                    <Badge className={getStageColor(deal.pipeline_stage)}>
                      {deal.pipeline_stage}
                    </Badge>
                  </div>
                )}
              </div>

              <div>
                <Label>Round Stage</Label>
                {isEditing ? (
                  <Select value={formData.round_stage} onValueChange={(value) => handleInputChange('round_stage', value)}>
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
                ) : (
                  <div className="mt-1">
                    {deal.round_stage ? (
                      <Badge variant="outline">{deal.round_stage}</Badge>
                    ) : (
                      <span className="text-gray-500">Not specified</span>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Contact Name</Label>
                {isEditing ? (
                  <Input
                    value={formData.contact_name}
                    onChange={(e) => handleInputChange('contact_name', e.target.value)}
                    placeholder="Contact name"
                  />
                ) : (
                  <div className="flex items-center gap-2 mt-1">
                    <User className="h-4 w-4 text-gray-500" />
                    {deal.contact_name || 'Not provided'}
                  </div>
                )}
              </div>

              <div>
                <Label>Email</Label>
                {isEditing ? (
                  <Input
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => handleInputChange('contact_email', e.target.value)}
                    placeholder="email@example.com"
                  />
                ) : (
                  <div className="flex items-center gap-2 mt-1">
                    <Mail className="h-4 w-4 text-gray-500" />
                    {deal.contact_email ? (
                      <a href={`mailto:${deal.contact_email}`} className="text-blue-600 hover:underline">
                        {deal.contact_email}
                      </a>
                    ) : (
                      'Not provided'
                    )}
                  </div>
                )}
              </div>

              <div>
                <Label>Phone</Label>
                {isEditing ? (
                  <Input
                    value={formData.contact_phone}
                    onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                    placeholder="Phone number"
                  />
                ) : (
                  <div className="flex items-center gap-2 mt-1">
                    <Phone className="h-4 w-4 text-gray-500" />
                    {deal.contact_phone ? (
                      <a href={`tel:${deal.contact_phone}`} className="text-blue-600 hover:underline">
                        {deal.contact_phone}
                      </a>
                    ) : (
                      'Not provided'
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Company Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Company Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Website</Label>
                {isEditing ? (
                  <Input
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    placeholder="https://example.com"
                  />
                ) : (
                  <div className="flex items-center gap-2 mt-1">
                    <Globe className="h-4 w-4 text-gray-500" />
                    {deal.website ? (
                      <a href={deal.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {deal.website}
                      </a>
                    ) : (
                      'Not provided'
                    )}
                  </div>
                )}
              </div>

              <div>
                <Label>Location</Label>
                {isEditing ? (
                  <Input
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="City, State/Country"
                  />
                ) : (
                  <div className="flex items-center gap-2 mt-1">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    {deal.location || 'Not provided'}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Financial Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Financial Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Round Size ($)</Label>
                {isEditing ? (
                  <Input
                    type="number"
                    value={formData.round_size}
                    onChange={(e) => handleInputChange('round_size', e.target.value)}
                    placeholder="1000000"
                  />
                ) : (
                  <div className="flex items-center gap-2 mt-1">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    {deal.round_size ? 
                      new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(deal.round_size / 100) 
                      : 'Not provided'
                    }
                  </div>
                )}
              </div>

              <div>
                <Label>Post-Money Valuation ($)</Label>
                {isEditing ? (
                  <Input
                    type="number"
                    value={formData.post_money_valuation}
                    onChange={(e) => handleInputChange('post_money_valuation', e.target.value)}
                    placeholder="10000000"
                  />
                ) : (
                  <div className="flex items-center gap-2 mt-1">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    {deal.post_money_valuation ? 
                      new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(deal.post_money_valuation / 100) 
                      : 'Not provided'
                    }
                  </div>
                )}
              </div>

              <div>
                <Label>Revenue ($)</Label>
                {isEditing ? (
                  <Input
                    type="number"
                    value={formData.revenue}
                    onChange={(e) => handleInputChange('revenue', e.target.value)}
                    placeholder="500000"
                  />
                ) : (
                  <div className="flex items-center gap-2 mt-1">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    {deal.revenue ? 
                      new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(deal.revenue / 100) 
                      : 'Not provided'
                    }
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Metadata */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Created: {new Date(deal.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Updated: {new Date(deal.updated_at).toLocaleDateString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
