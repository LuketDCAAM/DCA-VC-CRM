
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LPEngagement } from '@/types/lpEngagement';

interface AddLPEngagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (engagement: Omit<LPEngagement, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => Promise<void>;
}

export function AddLPEngagementDialog({ open, onOpenChange, onSubmit }: AddLPEngagementDialogProps) {
  const [formData, setFormData] = useState({
    lp_name: '',
    lp_type: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    linkedin_url: '',
    commitment_amount: '',
    committed_date: '',
    engagement_stage: 'Prospect' as const,
    location: '',
    investment_focus: [] as string[],
    ticket_size_min: '',
    ticket_size_max: '',
    last_interaction_date: '',
    next_steps: '',
    notes: '',
    tags: [] as string[],
    capital_called: 0,
    capital_returned: 0,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const engagement = {
        ...formData,
        commitment_amount: formData.commitment_amount ? Number(formData.commitment_amount) : undefined,
        ticket_size_min: formData.ticket_size_min ? Number(formData.ticket_size_min) : undefined,
        ticket_size_max: formData.ticket_size_max ? Number(formData.ticket_size_max) : undefined,
        committed_date: formData.committed_date || undefined,
        last_interaction_date: formData.last_interaction_date || undefined,
        linkedin_url: formData.linkedin_url || undefined,
      };

      await onSubmit(engagement);
      onOpenChange(false);
      
      // Reset form
      setFormData({
        lp_name: '',
        lp_type: '',
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        linkedin_url: '',
        commitment_amount: '',
        committed_date: '',
        engagement_stage: 'Prospect' as const,
        location: '',
        investment_focus: [],
        ticket_size_min: '',
        ticket_size_max: '',
        last_interaction_date: '',
        next_steps: '',
        notes: '',
        tags: [],
        capital_called: 0,
        capital_returned: 0,
      });
    } catch (error) {
      console.error('Error submitting LP engagement:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add LP Engagement</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="lp_name">LP Name *</Label>
              <Input
                id="lp_name"
                value={formData.lp_name}
                onChange={(e) => handleInputChange('lp_name', e.target.value)}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="lp_type">LP Type</Label>
              <Select onValueChange={(value) => handleInputChange('lp_type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select LP type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Individual">Individual</SelectItem>
                  <SelectItem value="Family Office">Family Office</SelectItem>
                  <SelectItem value="Institution">Institution</SelectItem>
                  <SelectItem value="Fund of Funds">Fund of Funds</SelectItem>
                  <SelectItem value="Corporate">Corporate</SelectItem>
                  <SelectItem value="Government">Government</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contact_name">Contact Name</Label>
              <Input
                id="contact_name"
                value={formData.contact_name}
                onChange={(e) => handleInputChange('contact_name', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="contact_email">Contact Email</Label>
              <Input
                id="contact_email"
                type="email"
                value={formData.contact_email}
                onChange={(e) => handleInputChange('contact_email', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contact_phone">Contact Phone</Label>
              <Input
                id="contact_phone"
                value={formData.contact_phone}
                onChange={(e) => handleInputChange('contact_phone', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="linkedin_url">LinkedIn URL</Label>
              <Input
                id="linkedin_url"
                value={formData.linkedin_url}
                onChange={(e) => handleInputChange('linkedin_url', e.target.value)}
                placeholder="https://linkedin.com/in/..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="engagement_stage">Engagement Stage</Label>
              <Select 
                value={formData.engagement_stage}
                onValueChange={(value) => handleInputChange('engagement_stage', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Prospect">Prospect</SelectItem>
                  <SelectItem value="Initial Contact">Initial Contact</SelectItem>
                  <SelectItem value="Due Diligence">Due Diligence</SelectItem>
                  <SelectItem value="Negotiation">Negotiation</SelectItem>
                  <SelectItem value="Committed">Committed</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Declined">Declined</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="commitment_amount">Commitment Amount</Label>
              <Input
                id="commitment_amount"
                type="number"
                value={formData.commitment_amount}
                onChange={(e) => handleInputChange('commitment_amount', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="committed_date">Committed Date</Label>
              <Input
                id="committed_date"
                type="date"
                value={formData.committed_date}
                onChange={(e) => handleInputChange('committed_date', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="last_interaction_date">Last Interaction Date</Label>
              <Input
                id="last_interaction_date"
                type="date"
                value={formData.last_interaction_date}
                onChange={(e) => handleInputChange('last_interaction_date', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="ticket_size_min">Min Ticket Size</Label>
              <Input
                id="ticket_size_min"
                type="number"
                value={formData.ticket_size_min}
                onChange={(e) => handleInputChange('ticket_size_min', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ticket_size_max">Max Ticket Size</Label>
              <Input
                id="ticket_size_max"
                type="number"
                value={formData.ticket_size_max}
                onChange={(e) => handleInputChange('ticket_size_max', e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="next_steps">Next Steps</Label>
            <Textarea
              id="next_steps"
              value={formData.next_steps}
              onChange={(e) => handleInputChange('next_steps', e.target.value)}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create LP Engagement'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
