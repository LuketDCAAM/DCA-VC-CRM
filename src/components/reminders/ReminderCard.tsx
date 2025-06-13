
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, Edit, Trash2, Clock } from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';

interface Reminder {
  id: string;
  title: string;
  description: string | null;
  reminder_date: string;
  is_completed: boolean;
  deal_id: string | null;
  portfolio_company_id: string | null;
  investor_id: string | null;
}

interface ReminderCardProps {
  reminder: Reminder;
  onEdit: (reminder: Reminder) => void;
  onDelete: (id: string) => void;
  onToggleComplete: (id: string, completed: boolean) => void;
}

export function ReminderCard({ reminder, onEdit, onDelete, onToggleComplete }: ReminderCardProps) {
  const reminderDate = new Date(reminder.reminder_date);
  const isOverdue = isPast(reminderDate) && !isToday(reminderDate) && !reminder.is_completed;
  const isDueToday = isToday(reminderDate) && !reminder.is_completed;

  const getDateBadge = () => {
    if (reminder.is_completed) {
      return <Badge variant="secondary">Completed</Badge>;
    }
    if (isOverdue) {
      return <Badge variant="destructive">Overdue</Badge>;
    }
    if (isDueToday) {
      return <Badge variant="default">Due Today</Badge>;
    }
    return <Badge variant="outline">Upcoming</Badge>;
  };

  const getContextBadge = () => {
    if (reminder.deal_id) {
      return <Badge variant="outline" className="text-xs">Deal</Badge>;
    }
    if (reminder.portfolio_company_id) {
      return <Badge variant="outline" className="text-xs">Portfolio</Badge>;
    }
    if (reminder.investor_id) {
      return <Badge variant="outline" className="text-xs">Investor</Badge>;
    }
    return null;
  };

  return (
    <Card className={`transition-colors ${
      reminder.is_completed ? 'opacity-75' : ''
    } ${isOverdue ? 'border-red-200 bg-red-50' : ''} ${isDueToday ? 'border-blue-200 bg-blue-50' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={reminder.is_completed}
              onCheckedChange={(checked) => onToggleComplete(reminder.id, checked as boolean)}
            />
            <div className="flex-1">
              <h4 className={`font-medium ${reminder.is_completed ? 'line-through' : ''}`}>
                {reminder.title}
              </h4>
              <div className="flex items-center space-x-2 mt-1">
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="h-3 w-3 mr-1" />
                  {format(reminderDate, 'MMM d, yyyy')}
                </div>
                {getContextBadge()}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getDateBadge()}
          </div>
        </div>
      </CardHeader>

      {reminder.description && (
        <CardContent className="pt-0">
          <p className={`text-sm text-gray-600 ${reminder.is_completed ? 'line-through' : ''}`}>
            {reminder.description}
          </p>
        </CardContent>
      )}

      <CardContent className="pt-0">
        <div className="flex justify-end space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(reminder)}
            className="h-8 px-2"
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(reminder.id)}
            className="h-8 px-2 text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
