import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Investor } from '@/types/investor';
import { Separator } from '@/components/ui/separator';
import { EntityCallNotesManager } from '@/components/common/EntityCallNotesManager';
import { Mail, Phone, Building2, MapPin, TrendingUp, DollarSign, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface InvestorDetailDialogProps {
  investor: Investor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InvestorDetailDialog({ investor, open, onOpenChange }: InvestorDetailDialogProps) {
  if (!investor) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{investor.contact_name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Contact Information */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Contact Information</h3>
            <div className="grid gap-3">
              {investor.contact_email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${investor.contact_email}`} className="text-primary hover:underline">
                    {investor.contact_email}
                  </a>
                </div>
              )}
              {investor.contact_phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${investor.contact_phone}`} className="text-primary hover:underline">
                    {investor.contact_phone}
                  </a>
                </div>
              )}
              {investor.firm_name && (
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span>{investor.firm_name}</span>
                </div>
              )}
              {investor.location && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{investor.location}</span>
                </div>
              )}
            </div>
          </div>

          {/* Investment Preferences */}
          {(investor.preferred_investment_stage || investor.average_check_size || investor.preferred_sectors) && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Investment Preferences</h3>
                <div className="grid gap-3">
                  {investor.preferred_investment_stage && (
                    <div className="flex items-center gap-2 text-sm">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Stage:</span>
                      <Badge variant="secondary">{investor.preferred_investment_stage}</Badge>
                    </div>
                  )}
                  {investor.average_check_size && (
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Average Check:</span>
                      <span className="font-medium">
                        ${(investor.average_check_size / 100).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {investor.preferred_sectors && investor.preferred_sectors.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Tag className="h-4 w-4" />
                        <span>Preferred Sectors:</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {investor.preferred_sectors.map((sector) => (
                          <Badge key={sector} variant="outline">
                            {sector}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Tags */}
          {investor.tags && investor.tags.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {investor.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Call Notes */}
          <Separator />
          <EntityCallNotesManager entityId={investor.id} entityType="investor" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
