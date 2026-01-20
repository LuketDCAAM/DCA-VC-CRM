
import React, { useState } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { TaskEditDialog } from '@/components/tasks/TaskEditDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  User, 
  Calendar,
  AlertCircle,
  XCircle,
  PlayCircle,
  Pencil,
  UserCircle
} from 'lucide-react';
import { format } from 'date-fns';

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  reminder_date: string;
  is_completed: boolean;
  deal_id: string | null;
  portfolio_company_id: string | null;
  investor_id: string | null;
  created_by: string;
  created_at: string;
  assigned_to: string | null;
  task_type: string | null;
  priority: string | null;
  status: string | null;
  assignees?: UserProfile[];
  creator?: UserProfile;
}

const priorityConfig: Record<string, { color: string; label: string }> = {
  low: { color: 'bg-muted text-muted-foreground', label: 'Low' },
  medium: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300', label: 'Medium' },
  high: { color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300', label: 'High' },
  urgent: { color: 'bg-destructive/20 text-destructive', label: 'Urgent' },
};

const statusConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  pending: { icon: <Circle className="h-4 w-4" />, color: 'text-muted-foreground', label: 'Pending' },
  in_progress: { icon: <PlayCircle className="h-4 w-4" />, color: 'text-blue-600', label: 'In Progress' },
  completed: { icon: <CheckCircle2 className="h-4 w-4" />, color: 'text-green-600', label: 'Completed' },
  cancelled: { icon: <XCircle className="h-4 w-4" />, color: 'text-muted-foreground', label: 'Cancelled' },
};

export default function Tasks() {
  const { tasks, users, loading, updateTaskStatus, updateTask, deleteTask, getTasksByUser } = useTasks();
  const [view, setView] = useState<'by-person' | 'all'>('by-person');
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const tasksByUser = getTasksByUser();

  const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const cancelledTasks = tasks.filter(t => t.status === 'cancelled');

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    await updateTaskStatus(taskId, newStatus);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
  };

  const handleSaveTask = async (taskId: string, data: {
    title: string;
    description: string | null;
    reminder_date: string;
    priority: string;
    status: string;
    assignees: string[];
  }) => {
    return await updateTask(taskId, data);
  };

  const handleDeleteTask = async (taskId: string) => {
    return await deleteTask(taskId);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center">
          <div className="text-lg">Loading tasks...</div>
        </div>
      </div>
    );
  }

  const renderTaskCard = (task: Task) => {
    const priority = priorityConfig[task.priority || 'medium'];
    const status = statusConfig[task.status || 'pending'];
    const isOverdue = new Date(task.reminder_date) < new Date() && task.status !== 'completed' && task.status !== 'cancelled';

    return (
      <Card key={task.id} className={`${isOverdue ? 'border-destructive' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className={status.color}>{status.icon}</span>
                <h4 className="font-medium truncate">{task.title}</h4>
              </div>
              
              {task.description && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {task.description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span className={isOverdue ? 'text-destructive font-medium' : ''}>
                    {format(new Date(task.reminder_date), 'MMM d, yyyy')}
                  </span>
                  {isOverdue && <AlertCircle className="h-3 w-3 text-destructive" />}
                </div>
                
                <Badge variant="outline" className={priority.color}>
                  {priority.label}
                </Badge>
              </div>

              {/* Creator info */}
              {task.creator && (
                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                  <UserCircle className="h-3 w-3" />
                  <span>Created by {task.creator.name || task.creator.email}</span>
                </div>
              )}

              {task.assignees && task.assignees.length > 0 && view === 'all' && (
                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                  <User className="h-3 w-3" />
                  <span>Assigned to {task.assignees.map((a) => a.name || a.email).join(', ')}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0"
                onClick={() => handleEditTask(task)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              {task.status !== 'completed' && task.status !== 'cancelled' && (
                <>
                  {task.status === 'pending' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs"
                      onClick={() => handleStatusChange(task.id, 'in_progress')}
                    >
                      Start
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs text-green-600 hover:text-green-700"
                    onClick={() => handleStatusChange(task.id, 'completed')}
                  >
                    Complete
                  </Button>
                </>
              )}
              {task.status === 'completed' && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs"
                  onClick={() => handleStatusChange(task.id, 'pending')}
                >
                  Reopen
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Tasks</h1>
          <p className="text-muted-foreground mt-1">
            {pendingTasks.length} active tasks, {completedTasks.length} completed
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={view === 'by-person' ? 'default' : 'outline'}
            onClick={() => setView('by-person')}
          >
            <User className="h-4 w-4 mr-2" />
            By Person
          </Button>
          <Button
            variant={view === 'all' ? 'default' : 'outline'}
            onClick={() => setView('all')}
          >
            <Clock className="h-4 w-4 mr-2" />
            All Tasks
          </Button>
        </div>
      </div>

      {view === 'by-person' ? (
        <div className="space-y-6">
          {tasksByUser.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No tasks found. Tasks assigned to users will appear here.
              </CardContent>
            </Card>
          ) : (
            tasksByUser.map(({ user, tasks: userTasks }) => (
              <Card key={user.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <User className="h-5 w-5" />
                    {user.name || user.email || 'Unassigned'}
                    <Badge variant="secondary" className="ml-2">
                      {userTasks.length} task{userTasks.length !== 1 ? 's' : ''}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {userTasks.map(renderTaskCard)}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ) : (
        <Tabs defaultValue="active" className="space-y-4">
          <TabsList>
            <TabsTrigger value="active">
              Active ({pendingTasks.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({completedTasks.length})
            </TabsTrigger>
            <TabsTrigger value="cancelled">
              Cancelled ({cancelledTasks.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            {pendingTasks.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No active tasks.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pendingTasks.map(renderTaskCard)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed">
            {completedTasks.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No completed tasks.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {completedTasks.map(renderTaskCard)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="cancelled">
            {cancelledTasks.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No cancelled tasks.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {cancelledTasks.map(renderTaskCard)}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      <TaskEditDialog
        open={!!editingTask}
        onOpenChange={(open) => !open && setEditingTask(null)}
        task={editingTask}
        users={users}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
      />
    </div>
  );
}
