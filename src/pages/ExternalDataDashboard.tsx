
import React from 'react';
import { ExternalDataDashboard as Dashboard } from '@/components/external-data/ExternalDataDashboard';

export default function ExternalDataDashboard() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">External Data Management</h1>
        <p className="text-muted-foreground">
          Monitor and manage external data synchronization across all providers.
        </p>
      </div>
      
      <Dashboard />
    </div>
  );
}
