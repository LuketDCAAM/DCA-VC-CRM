
import React, { useState } from 'react';
import { useReminders } from '@/hooks/useReminders';
import { ReminderCard } from '@/components/reminders/ReminderCard';
import { ReminderDialog } from '@/components/reminders/ReminderDialog';
import { OutlookIntegrationDialog } from '@/components/outlook/OutlookIntegrationDialog';
import { Button } from '@/components/ui/button';
import { Plus, Calendar } from 'lucide-react';

interface Reminder {
  id: string;
  title: string;
  description: string | null;
  reminder_date: string;
  is_completed: boolean;
  deal_id: string | null;
  portfolio_company_id: string | null;
  investor_id: string | null;
  outlook_task_id?: string | null;
  sync_status?: string | null;
}

export default function Reminders() {
  const { reminders, loading, createReminder, updateReminder, deleteReminder } = useReminders();
  const [showDialog, setShowDialog] = useState(false);
  const [showOutlookDialog, setShowOutlookDialog] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);

  const handleCreateReminder = async (data: {
    title: string;
    description?: string;
    reminder_date: string;
    deal_id?: string;
    portfolio_company_id?: string;
    investor_id?: string;
  }) => {
    await createReminder(data);
  };

  const handleEditReminder = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setShowDialog(true);
  };

  const handleUpdateReminder = async (data: {
    title: string;
    description?: string;
    reminder_date: string;
  }) => {
    if (editingReminder) {
      await updateReminder(editingReminder.id, data);
      setEditingReminder(null);
    }
  };

  const handleToggleComplete = async (id: string, completed: boolean) => {
    await updateReminder(id, { is_completed: completed });
  };

  const pendingReminders = reminders.filter(r => !r.is_completed);
  const completedReminders = reminders.filter(r => r.is_completed);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center">
          <div className="text-lg">Loading reminders...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Reminders</h1>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowOutlookDialog(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Calendar className="h-4 w-4" />
            Outlook Integration
          </Button>
          <Button
            onClick={() => {
              setEditingReminder(null);
              setShowDialog(true);
            }}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Reminder
          </Button>
        </div>
      </div>

      <div className="space-y-8">
        {/* Pending Reminders */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Pending ({pendingReminders.length})</h2>
          {pendingReminders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No pending reminders. Create one to get started!
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pendingReminders.map((reminder) => (
                <ReminderCard
                  key={reminder.id}
                  reminder={reminder}
                  onEdit={handleEditReminder}
                  onDelete={deleteReminder}
                  onToggleComplete={handleToggleComplete}
                />
              ))}
            </div>
          )}
        </div>

        {/* Completed Reminders */}
        {completedReminders.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Completed ({completedReminders.length})</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {completedReminders.map((reminder) => (
                <ReminderCard
                  key={reminder.id}
                  reminder={reminder}
                  onEdit={handleEditReminder}
                  onDelete={deleteReminder}
                  onToggleComplete={handleToggleComplete}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <ReminderDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        onSubmit={editingReminder ? handleUpdateReminder : handleCreateReminder}
        initialData={editingReminder ? {
          title: editingReminder.title,
          description: editingReminder.description || '',
          reminder_date: editingReminder.reminder_date,
        } : undefined}
      />

      <OutlookIntegrationDialog
        open={showOutlookDialog}
        onOpenChange={setShowOutlookDialog}
      />
    </div>
  );
}
