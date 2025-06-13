
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Filter, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useReminders } from '@/hooks/useReminders';
import { ReminderCard } from '@/components/reminders/ReminderCard';
import { ReminderDialog } from '@/components/reminders/ReminderDialog';
import { isToday, isPast } from 'date-fns';

export default function Reminders() {
  const { reminders, loading, createReminder, updateReminder, deleteReminder } = useReminders();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showDialog, setShowDialog] = useState(false);
  const [editingReminder, setEditingReminder] = useState<any>(null);

  const filteredReminders = reminders.filter(reminder => {
    const matchesSearch = reminder.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reminder.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesStatus = true;
    if (statusFilter === 'completed') {
      matchesStatus = reminder.is_completed;
    } else if (statusFilter === 'pending') {
      matchesStatus = !reminder.is_completed;
    } else if (statusFilter === 'overdue') {
      const reminderDate = new Date(reminder.reminder_date);
      matchesStatus = !reminder.is_completed && isPast(reminderDate) && !isToday(reminderDate);
    } else if (statusFilter === 'today') {
      matchesStatus = !reminder.is_completed && isToday(new Date(reminder.reminder_date));
    }
    
    return matchesSearch && matchesStatus;
  });

  const totalReminders = reminders.length;
  const completedReminders = reminders.filter(r => r.is_completed).length;
  const overdueReminders = reminders.filter(r => {
    const reminderDate = new Date(r.reminder_date);
    return !r.is_completed && isPast(reminderDate) && !isToday(reminderDate);
  }).length;
  const todayReminders = reminders.filter(r => {
    return !r.is_completed && isToday(new Date(r.reminder_date));
  }).length;

  const handleEdit = (reminder: any) => {
    setEditingReminder(reminder);
    setShowDialog(true);
  };

  const handleSubmit = (data: any) => {
    if (editingReminder) {
      updateReminder(editingReminder.id, data);
    } else {
      createReminder(data);
    }
    setEditingReminder(null);
  };

  const handleToggleComplete = (id: string, completed: boolean) => {
    updateReminder(id, { is_completed: completed });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading reminders...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Tasks & Reminders</h1>
          <p className="text-gray-600">Keep track of your important follow-ups</p>
        </div>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Reminder
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Reminders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReminders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Due Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{todayReminders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overdueReminders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedReminders}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search reminders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Reminders</SelectItem>
            <SelectItem value="today">Due Today</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reminders List */}
      {filteredReminders.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Reminders</CardTitle>
            <CardDescription>
              {totalReminders === 0 
                ? "You haven't created any reminders yet."
                : "No reminders match your current filters."
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">
                {totalReminders === 0 
                  ? "Create your first reminder to stay on top of important tasks."
                  : "Try adjusting your search or filter criteria."
                }
              </p>
              {totalReminders === 0 && (
                <Button onClick={() => setShowDialog(true)} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Create your first reminder
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredReminders.map((reminder) => (
            <ReminderCard
              key={reminder.id}
              reminder={reminder}
              onEdit={handleEdit}
              onDelete={deleteReminder}
              onToggleComplete={handleToggleComplete}
            />
          ))}
        </div>
      )}

      <ReminderDialog
        open={showDialog}
        onOpenChange={(open) => {
          setShowDialog(open);
          if (!open) setEditingReminder(null);
        }}
        onSubmit={handleSubmit}
        initialData={editingReminder ? {
          title: editingReminder.title,
          description: editingReminder.description,
          reminder_date: editingReminder.reminder_date,
        } : undefined}
      />
    </div>
  );
}
