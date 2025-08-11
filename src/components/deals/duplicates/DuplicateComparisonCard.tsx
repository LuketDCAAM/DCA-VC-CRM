import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Calendar, User, Mail, Globe, Linkedin } from 'lucide-react';
import { PotentialDuplicate } from '@/types/duplicates';
import { format } from 'date-fns';

interface DuplicateComparisonCardProps {
  duplicate: PotentialDuplicate;
  newDealData: {
    company_name: string;
    website?: string;
    linkedin_url?: string;
    contact_email?: string;
    contact_name?: string;
  };
}

export function DuplicateComparisonCard({ duplicate, newDealData }: DuplicateComparisonCardProps) {
  const getConfidenceBadgeVariant = (level: string) => {
    switch (level) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const handleViewDeal = () => {
    // Navigate to deal detail - you could implement this based on your routing
    window.open(`/deals/${duplicate.deal_id}`, '_blank');
  };

  return (
    <Card className="border-l-4 border-l-primary/20">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <h4 className="font-medium">{duplicate.company_name}</h4>
            <Badge variant={getConfidenceBadgeVariant(duplicate.confidence_level)}>
              {duplicate.confidence_level} confidence
            </Badge>
            <Badge variant="outline">
              {Math.round(duplicate.confidence_score * 100)}% match
            </Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={handleViewDeal}>
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <h5 className="font-medium text-muted-foreground mb-2">Existing Deal</h5>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <User className="h-3 w-3 text-muted-foreground" />
                <span>{duplicate.contact_name || 'No contact'}</span>
              </div>
              {duplicate.contact_email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-3 w-3 text-muted-foreground" />
                  <span className="truncate">{duplicate.contact_email}</span>
                </div>
              )}
              {duplicate.website && (
                <div className="flex items-center gap-2">
                  <Globe className="h-3 w-3 text-muted-foreground" />
                  <span className="truncate">{duplicate.website}</span>
                </div>
              )}
              {duplicate.linkedin_url && (
                <div className="flex items-center gap-2">
                  <Linkedin className="h-3 w-3 text-muted-foreground" />
                  <span className="truncate">LinkedIn</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <span>{format(new Date(duplicate.created_at), 'MMM d, yyyy')}</span>
              </div>
              <Badge variant="outline" className="text-xs">
                {duplicate.pipeline_stage}
              </Badge>
            </div>
          </div>

          <div>
            <h5 className="font-medium text-muted-foreground mb-2">New Deal</h5>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <User className="h-3 w-3 text-muted-foreground" />
                <span>{newDealData.contact_name || 'No contact'}</span>
              </div>
              {newDealData.contact_email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-3 w-3 text-muted-foreground" />
                  <span className="truncate">{newDealData.contact_email}</span>
                </div>
              )}
              {newDealData.website && (
                <div className="flex items-center gap-2">
                  <Globe className="h-3 w-3 text-muted-foreground" />
                  <span className="truncate">{newDealData.website}</span>
                </div>
              )}
              {newDealData.linkedin_url && (
                <div className="flex items-center gap-2">
                  <Linkedin className="h-3 w-3 text-muted-foreground" />
                  <span className="truncate">LinkedIn</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t">
          <div className="text-xs text-muted-foreground">
            <strong>Match reasons:</strong> {duplicate.match_reasons.filter(Boolean).join(', ')}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}