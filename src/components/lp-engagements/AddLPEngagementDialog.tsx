
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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

const LP_TYPES = [
  'Individual',
  'Family Office',
  'Institution',
  'Fund of Funds',
  'Pension Fund',
  'Insurance Company',
  'Sovereign Wealth Fund',
  'Endowment',
  'Foundation',
  'Corporate',
];

const ENGAGEMENT_STAGES = [
  'Prospect',
  'Initial Contact',
  'Due Diligence',
  'Negotiation',
  'Committed',
  'Active',
  'Inactive',
  'Declined',
];

export function AddLPEngagementDialog({ open, onOpenChange, onSubmit }: AddLPEngagementDialogProps) {
  const [formData, setFormData] = useState({
    lp_name: '',
    lp_type: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    commitment_amount: '',
    committed_date: '',
    capital_called: '0',
    capital_returned: '0',
    engagement_stage: 'Prospect' as const,
    location: '',
    ticket_size_min: '',
    ticket_size_max: '',
    last_interaction_date: '',
    next_steps: '',
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.lp_name.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        lp_name: formData.lp_name,
        lp_type: formData.lp_type || undefined,
        contact_name: formData.contact_name || undefined,
        contact_email: formData.contact_email || undefined,
        contact_phone: formData.contact_phone || undefined,
        commitment_amount: formData.commitment_amount ? parseInt(formData.commitment_amount) : undefined,
        committed_date: formData.committed_date || undefined,
        capital_called: parseInt(formData.capital_called) || 0,
        capital_returned: parseInt(formData.capital_returned) || 0,
        engagement_stage: formData.engagement_stage,
        location: formData.location || undefined,
        ticket_size_min: formData.ticket_size_min ? parseInt(formData.ticket_size_min) : undefined,
        ticket_size_max: formData.ticket_size_max ? parseInt(formData.ticket_size_max) : undefined,
        last_interaction_date: formData.last_interaction_date || undefined,
        next_steps: formData.next_steps || undefined,
        notes: formData.notes || undefined,
      });
      
      // Reset form
      setFormData({
        lp_name: '',
        lp_type: '',
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        commitment_amount: '',
        committed_date: '',
        capital_called: '0',
        capital_returned: '0',
        engagement_stage: 'Prospect',
        location: '',
        ticket_size_min: '',
        ticket_size_max: '',
        last_interaction_date: '',
        next_steps: '',
        notes: '',
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting LP engagement:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add LP Engagement</DialogTitle>
          <DialogDescription>
            Create a new LP engagement to track fund relationships.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lp_name">LP Name *</Label>
              <Input
                id="lp_name"
                value={formData.lp_name}
                onChange={(e) => setFormData(prev => ({ ...prev, lp_name: e.target.value }))}
                placeholder="Enter LP name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lp_type">LP Type</Label>
              <Select 
                value={formData.lp_type} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, lp_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select LP type" />
                </SelectTrigger>
                <SelectContent>
                  {LP_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_name">Contact Name</Label>
              <Input
                id="contact_name"
                value={formData.contact_name}
                onChange={(e) => setFormData(prev => ({ ...prev, contact_name: e.target.value }))}
                placeholder="Enter contact name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_email">Contact Email</Label>
              <Input
                id="contact_email"
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                placeholder="Enter contact email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_phone">Contact Phone</Label>
              <Input
                id="contact_phone"
                value={formData.contact_phone}
                onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                placeholder="Enter contact phone"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Enter location"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="engagement_stage">Engagement Stage</Label>
              <Select 
                value={formData.engagement_stage} 
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, engagement_stage: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ENGAGEMENT_STAGES.map((stage) => (
                    <SelectItem key={stage} value={stage}>
                      {stage}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="commitment_amount">Commitment Amount</Label>
              <Input
                id="commitment_amount"
                type="number"
                value={formData.commitment_amount}
                onChange={(e) => setFormData(prev => ({ ...prev, commitment_amount: e.target.value }))}
                placeholder="Enter commitment amount"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="committed_date">Committed Date</Label>
              <Input
                id="committed_date"
                type="date"
                value={formData.committed_date}
                onChange={(e) => setFormData(prev => ({ ...prev, committed_date: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ticket_size_min">Min Ticket Size</Label>
              <Input
                id="ticket_size_min"
                type="number"
                value={formData.ticket_size_min}
                onChange={(e) => setFormData(prev => ({ ...prev, ticket_size_min: e.target.value }))}
                placeholder="Enter minimum ticket size"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ticket_size_max">Max Ticket Size</Label>
              <Input
                id="ticket_size_max"
                type="number"
                value={formData.ticket_size_max}
                onChange={(e) => setFormData(prev => ({ ...prev, ticket_size_max: e.target.value }))}
                placeholder="Enter maximum ticket size"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_interaction_date">Last Interaction</Label>
              <Input
                id="last_interaction_date"
                type="date"
                value={formData.last_interaction_date}
                onChange={(e) => setFormData(prev => ({ ...prev, last_interaction_date: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="next_steps">Next Steps</Label>
            <Textarea
              id="next_steps"
              value={formData.next_steps}
              onChange={(e) => setFormData(prev => ({ ...prev, next_steps: e.target.value }))}
              placeholder="Enter next steps"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Enter additional notes"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.lp_name.trim()}>
              {isSubmitting ? 'Creating...' : 'Create LP Engagement'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
