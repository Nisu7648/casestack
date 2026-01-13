import React, { useState, useEffect } from 'react';
import { Plus, Calendar, User, MessageSquare, CheckSquare } from 'lucide-react';
import { LoadingTable } from '../../components/ui/LoadingState';
import { showSuccess, showError } from '../../components/ui/Toast';

// ============================================
// TASKS KANBAN BOARD
// Drag-drop task management
// ============================================

export default function Tasks() {
  const [tasks, setTasks] = useState<any>({ TODO: [], IN_PROGRESS: [], DONE: [] });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  useEffect(() => {
    loadTasks();
    loadTeamMembers();
  }, []);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/tasks', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to load tasks');

      const data = await response.json();
      setTasks(data.grouped);
    } catch (error) {
      console.error('Load tasks error:', error);
      showError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const loadTeamMembers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/firm/team', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to load team');

      const data = await response.json();
      setTeamMembers(data.teamMembers);
    } catch (error) {
      console.error('Load team error:', error);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/tasks/${taskId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) throw new Error('Failed to update status');

      showSuccess('Task status updated');
      loadTasks();
    } catch (error) {
      console.error('Update status error:', error);
      showError('Failed to update status');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-100 text-red-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'LOW':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const TaskCard = ({ task }: { task: any }) => (
    <div
      onClick={() => setSelectedTask(task)}
      className="bg-white border border-gray-300 p-4 mb-3 cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-sm font-semibold text-gray-900 flex-1">
          {task.title}
        </h4>
        <span className={`px-2 py-0.5 text-xs font-medium rounded ${getPriorityColor(task.priority)}`}>
          {task.priority}
        </span>
      </div>

      {task.description && (
        <p className="text-xs text-gray-600 mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-3">
          {task.dueDate && (
            <div className={`flex items-center gap-1 ${isOverdue(task.dueDate) ? 'text-red-600' : ''}`}>
              <Calendar className="w-3 h-3" />
              {new Date(task.dueDate).toLocaleDateString()}
            </div>
          )}
          {task.assignedTo && (
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {task.assignedTo.firstName}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {task._count.comments > 0 && (
            <div className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              {task._count.comments}
            </div>
          )}
          {task._count.checklist > 0 && (
            <div className="flex items-center gap-1">
              <CheckSquare className="w-3 h-3" />
              {task._count.checklist}
            </div>
          )}
        </div>
      </div>

      {task.case && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            {task.case.caseNumber} • {task.case.client.name}
          </p>
        </div>
      )}
    </div>
  );

  const Column = ({ title, status, tasks: columnTasks }: { title: string; status: string; tasks: any[] }) => (
    <div className="flex-1 bg-gray-50 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">
          {title} ({columnTasks.length})
        </h3>
      </div>
      <div className="space-y-3">
        {columnTasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
            <p className="text-sm text-gray-600 mt-1">
              {loading ? 'Loading...' : `${tasks.TODO.length + tasks.IN_PROGRESS.length + tasks.DONE.length} total tasks`}
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Task
          </button>
        </div>

        {/* Kanban Board */}
        {loading ? (
          <LoadingTable rows={8} />
        ) : (
          <div className="grid grid-cols-3 gap-4">
            <Column title="To Do" status="TODO" tasks={tasks.TODO} />
            <Column title="In Progress" status="IN_PROGRESS" tasks={tasks.IN_PROGRESS} />
            <Column title="Done" status="DONE" tasks={tasks.DONE} />
          </div>
        )}

        {/* Task Detail Modal */}
        {selectedTask && (
          <TaskDetailModal
            task={selectedTask}
            onClose={() => {
              setSelectedTask(null);
              loadTasks();
            }}
            onStatusChange={handleStatusChange}
            teamMembers={teamMembers}
          />
        )}

        {/* Create Task Modal */}
        {showModal && (
          <CreateTaskModal
            onClose={() => setShowModal(false)}
            onSuccess={() => {
              setShowModal(false);
              loadTasks();
            }}
            teamMembers={teamMembers}
          />
        )}
      </div>
    </div>
  );
}

// ============================================
// CREATE TASK MODAL
// ============================================
function CreateTaskModal({ onClose, onSuccess, teamMembers }: any) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedTo: '',
    dueDate: '',
    priority: 'MEDIUM'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to create task');

      showSuccess('Task created successfully');
      onSuccess();
    } catch (error) {
      console.error('Create task error:', error);
      showError('Failed to create task');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">Create New Task</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="Task title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="Task description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assign To
              </label>
              <select
                value={formData.assignedTo}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="">Unassigned</option>
                {teamMembers.map((member: any) => (
                  <option key={member.id} value={member.id}>
                    {member.firstName} {member.lastName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Due Date
            </label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t border-gray-300">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-black text-white text-sm hover:bg-gray-800 disabled:opacity-50"
            >
              {saving ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================
// TASK DETAIL MODAL
// ============================================
function TaskDetailModal({ task, onClose, onStatusChange, teamMembers }: any) {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (task.comments) {
      setComments(task.comments);
    }
  }, [task]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    setAdding(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/tasks/${task.id}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ comment: newComment })
      });

      if (!response.ok) throw new Error('Failed to add comment');

      const data = await response.json();
      setComments([data.comment, ...comments]);
      setNewComment('');
      showSuccess('Comment added');
    } catch (error) {
      console.error('Add comment error:', error);
      showError('Failed to add comment');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
            {task.case && (
              <p className="text-sm text-gray-600 mt-1">
                {task.case.caseNumber} • {task.case.client.name}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* Status Buttons */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => onStatusChange(task.id, 'TODO')}
            className={`px-3 py-1 text-sm rounded ${task.status === 'TODO' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            To Do
          </button>
          <button
            onClick={() => onStatusChange(task.id, 'IN_PROGRESS')}
            className={`px-3 py-1 text-sm rounded ${task.status === 'IN_PROGRESS' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            In Progress
          </button>
          <button
            onClick={() => onStatusChange(task.id, 'DONE')}
            className={`px-3 py-1 text-sm rounded ${task.status === 'DONE' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            Done
          </button>
        </div>

        {/* Task Details */}
        <div className="space-y-4 mb-6">
          {task.description && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">Description</h4>
              <p className="text-sm text-gray-600">{task.description}</p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Priority</p>
              <p className="font-medium">{task.priority}</p>
            </div>
            <div>
              <p className="text-gray-500">Assigned To</p>
              <p className="font-medium">
                {task.assignedTo ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}` : 'Unassigned'}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Due Date</p>
              <p className="font-medium">
                {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
              </p>
            </div>
          </div>
        </div>

        {/* Comments */}
        <div className="border-t border-gray-300 pt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Comments</h4>

          <div className="mb-4">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="Add a comment..."
            />
            <button
              onClick={handleAddComment}
              disabled={adding || !newComment.trim()}
              className="mt-2 px-4 py-2 bg-black text-white text-sm hover:bg-gray-800 disabled:opacity-50"
            >
              {adding ? 'Adding...' : 'Add Comment'}
            </button>
          </div>

          <div className="space-y-3 max-h-60 overflow-y-auto">
            {comments.map((comment: any) => (
              <div key={comment.id} className="bg-gray-50 p-3 rounded">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-gray-900">
                    {comment.user.firstName} {comment.user.lastName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(comment.createdAt).toLocaleString()}
                  </p>
                </div>
                <p className="text-sm text-gray-700">{comment.comment}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
