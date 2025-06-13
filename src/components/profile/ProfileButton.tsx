
import React from 'react';
import { Button } from '@/components/ui/button';
import { User } from 'lucide-react';
import { useProfiles } from '@/hooks/useProfiles';
import ProfileDialog from './ProfileDialog';

export default function ProfileButton() {
  const { profile, loading } = useProfiles();

  if (loading) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <User className="h-4 w-4" />
      </Button>
    );
  }

  const displayName = profile?.name || profile?.email || 'User';

  return (
    <ProfileDialog>
      <Button variant="ghost" size="sm" className="gap-2">
        <User className="h-4 w-4" />
        <span className="hidden sm:inline">{displayName}</span>
      </Button>
    </ProfileDialog>
  );
}
