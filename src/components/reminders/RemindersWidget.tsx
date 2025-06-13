
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Plus, Eye, Clock, AlertCircle } from 'lucide-react';
import { useReminders } from '@/hooks/useReminders';
import { ReminderDialog } from './ReminderDialog';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, isToday, isPast } from 'date-fns';

export function RemindersWidget() {
  const { reminders, loading, createReminder } = useReminders();
  const [showDialog, setShowDialog] = useState(false);
  const navigate = useNavigate();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Reminders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading reminders...</div>
        </CardContent>
      </Card>
    );
  }

  const upcomingReminders = reminders
    .filter(r => !r.is_completed)
    .sort((a, b) => new Date(a.reminder_date).getTime() - new Date(b.reminder_date).getTime())
    .slice(0, 5);

  const overdueCount = reminders.filter(r => {
    const reminderDate = new Date(r.reminder_date);
    return !r.is_completed && isPast(reminderDate) && !isToday(reminderDate);
  }).length;

  const todayCount = reminders.filter(r => {
    return !r.is_completed && isToday(new Date(r.reminder_date));
  }).length;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Upcoming Reminders
            </CardTitle>
            <CardDescription>Stay on top of your important tasks</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/reminders')}>
              <Eye className="h-4 w-4 mr-2" />
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Quick stats */}
          {(todayCount > 0 || overdueCount > 0) && (
            <div className="flex gap-2 mb-4">
              {todayCount > 0 && (
                <Badge variant="default" className="text-xs">
                  {todayCount} due today
                </Badge>
              )}
              {overdueCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {overdueCount} overdue
                </Badge>
              )}
            </div>
          )}

          {upcomingReminders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No upcoming reminders</p>
              <Button variant="outline" onClick={() => setShowDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create your first reminder
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingReminders.map((reminder) => {
                const reminderDate = new Date(reminder.reminder_date);
                const isOverdue = isPast(reminderDate) && !isToday(reminderDate);
                const isDueToday = isToday(reminderDate);

                return (
                  <div
                    key={reminder.id}
                    className={`p-3 rounded-lg border ${
                      isOverdue ? 'border-red-200 bg-red-50' :
                      isDueToday ? 'border-blue-200 bg-blue-50' :
                      'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{reminder.title}</h4>
                        <div className="flex items-center text-xs text-gray-500 mt-1">
                          <Calendar className="h-3 w-3 mr-1" />
                          {format(reminderDate, 'MMM d, yyyy')}
                        </div>
                      </div>
                      <div className="ml-2">
                        {isOverdue && (
                          <Badge variant="destructive" className="text-xs">Overdue</Badge>
                        )}
                        {isDueToday && (
                          <Badge variant="default" className="text-xs">Today</Badge>
                        )}
                        {!isOverdue && !isDueToday && (
                          <Badge variant="outline" className="text-xs">Upcoming</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <ReminderDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        onSubmit={(data) => {
          createReminder(data);
          setShowDialog(false);
        }}
      />
    </>
  );
}
