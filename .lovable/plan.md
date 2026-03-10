

## Plan: User-Specific Task Popup + Filter Tasks Page to Logged-In User

### What We're Building

1. **Task notification popup** — When a logged-in user has outstanding tasks (pending/in_progress) assigned to them, show a dismissable dialog on app load with a message like "You have 3 outstanding tasks" and a button to navigate to the Tasks page.

2. **Filter Tasks page to current user** — The Tasks page will default to showing only tasks assigned to or created by the logged-in user, instead of all tasks.

### Technical Approach

#### 1. Create `TaskNotificationPopup` component
- New file: `src/components/tasks/TaskNotificationPopup.tsx`
- Uses `useAuth()` to get the current user ID
- Queries `reminders` table filtered by `assigned_to = auth.uid()` (or via `task_assignments`) where `status` is `pending` or `in_progress` and `task_type = 'task'`
- Shows a Dialog with the count and a "View Tasks" button that navigates to `/tasks`
- Uses `sessionStorage` to only show once per session (so it doesn't keep popping up on every page nav)
- Rendered inside `Layout.tsx` so it appears after login on any page

#### 2. Update `useOpenTaskCount` hook
- Filter the count query to only count tasks assigned to the current user (`assigned_to` column or `task_assignments` table)

#### 3. Update `useTasks` hook
- Add a filter so `fetchTasks` only returns tasks where the user is an assignee (via `task_assignments` or `assigned_to`) or the creator (`created_by`)

#### 4. Update Tasks page
- Remove the "By Person" / "All Tasks" toggle (since tasks are already user-scoped)
- Or keep it but default to showing the user's own tasks only

### Files to Create/Modify
- **Create**: `src/components/tasks/TaskNotificationPopup.tsx`
- **Modify**: `src/components/layout/Layout.tsx` — render the popup
- **Modify**: `src/hooks/useTasks.tsx` — filter tasks to current user
- **Modify**: `src/hooks/useOpenTaskCount.tsx` — filter count to current user
- **Modify**: `src/pages/Tasks.tsx` — adjust UI for user-scoped view

