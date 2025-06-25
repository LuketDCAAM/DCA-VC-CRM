import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DialogFooter } from '@/components/ui/dialog';

import { useAddDeal, AddDealFormData, defaultFormData } from '../hooks/useAddDeal';
import { PipelineStage, RoundStage } from '@/types/deal'; 

interface AddDealFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function AddDealForm({ onSuccess, onCancel }: AddDealFormProps) {
  const { createDeal, loading, pipelineStages, roundStages } = useAddDeal();
  const [formData, setFormData] = useState<AddDealFormData>(defaultFormData);
  const [pitchDeckFile, setPitchDeckFile] = useState<File | null>(null); // State for the file input

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (id: keyof AddDealFormData) => (value: string) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPitchDeckFile(e.target.files[0]);
    } else {
      setPitchDeckFile(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Pass pitchDeckFile and pitchDeckUrl from formData to createDeal
    await createDeal({ ...formData, pitchDeckFile }, () => { // Pass pitchDeckFile directly
      setFormData(defaultFormData); // Reset form on success
      setPitchDeckFile(null); // Clear file input
      onSuccess();
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="company_name">Company Name *</Label>
          <Input id="company_name" value={formData.company_name} onChange={handleChange} required />
        </div>
        <div>
          <Label htmlFor="pipeline_stage">Pipeline Stage *</Label>
          <Select
            value={formData.pipeline_stage}
            onValueChange={handleSelectChange('pipeline_stage') as (value: PipelineStage) => void}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select stage" />
            </SelectTrigger>
            <SelectContent>
              {pipelineStages.map((stage) => (
                <SelectItem key={stage} value={stage}>
                  {stage}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="round_stage">Round Stage</Label>
          <Select
            value={formData.round_stage}
            onValueChange={handleSelectChange('round_stage') as (value: RoundStage | '') => void}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select round" />
            </SelectTrigger>
            <SelectContent>
              {roundStages.map((stage) => (
                <SelectItem key={stage} value={stage}>
                  {stage}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="round_size">Round Size (USD)</Label>
          <Input id="round_size" type="number" value={formData.round_size} onChange={handleChange} />
        </div>
        <div>
          <Label htmlFor="post_money_valuation">Post-Money Valuation (USD)</Label>
          <Input id="post_money_valuation" type="number" value={formData.post_money_valuation} onChange={handleChange} />
        </div>
        <div>
          <Label htmlFor="revenue">Revenue (USD)</Label>
          <Input id="revenue" type="number" value={formData.revenue} onChange={handleChange} />
        </div>
        <div>
          <Label htmlFor="sector">Sector</Label>
          <Input id="sector" value={formData.sector} onChange={handleChange} />
        </div>
        <div>
          <Label htmlFor="location">Location</Label>
          <Input id="location" value={formData.location} onChange={handleChange} />
        </div>
        <div>
          <Label htmlFor="contact_name">Contact Name</Label>
          <Input id="contact_name" value={formData.contact_name} onChange={handleChange} />
        </div>
        <div>
          <Label htmlFor="contact_email">Contact Email</Label>
          <Input id="contact_email" type="email" value={formData.contact_email} onChange={handleChange} />
        </div>
        <div>
          <Label htmlFor="contact_phone">Contact Phone</Label>
          <Input id="contact_phone" value={formData.contact_phone} onChange={handleChange} />
        </div>
        <div>
          <Label htmlFor="website">Website</Label>
          <Input id="website" type="url" value={formData.website} onChange={handleChange} />
        </div>
        <div>
          <Label htmlFor="deal_score">Deal Score</Label>
          <Input id="deal_score" type="number" value={formData.deal_score === null ? '' : formData.deal_score} onChange={handleChange} />
        </div>
        <div>
          <Label htmlFor="deal_lead">Deal Lead</Label>
          <Input id="deal_lead" value={formData.deal_lead} onChange={handleChange} />
        </div>
        <div>
          <Label htmlFor="deal_source">Deal Source</Label>
          <Input id="deal_source" value={formData.deal_source} onChange={handleChange} />
        </div>
        <div>
          <Label htmlFor="source_date">Source Date</Label>
          <Input id="source_date" type="date" value={formData.source_date} onChange={handleChange} />
        </div>
        {/* New fields for Pitch Deck */}
        <div className="md:col-span-2"> {/* Span full width for file input */}
          <Label htmlFor="pitch_deck_file">Pitch Deck (File Upload)</Label>
          <Input id="pitch_deck_file" type="file" accept=".pdf,.doc,.docx,.ppt,.pptx" onChange={handleFileChange} />
          {pitchDeckFile && <p className="text-sm text-gray-500 mt-1">Selected: {pitchDeckFile.name}</p>}
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="pitch_deck_url">Pitch Deck (Link)</Label>
          <Input id="pitch_deck_url" type="url" value={formData.pitch_deck_url || ''} onChange={handleChange} placeholder="e.g., https://docs.google.com/presentation/..." />
        </div>
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" value={formData.description} onChange={handleChange} />
      </div>

      <DialogFooter className="mt-6">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Adding...' : 'Add Deal'}
        </Button>
      </DialogFooter>
    </form>
  );
}
