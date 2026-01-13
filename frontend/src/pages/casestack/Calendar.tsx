import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight, Download, Clock, MapPin, Users } from 'lucide-react';
import { LoadingTable } from '../../components/ui/LoadingState';
import { showSuccess, showError } from '../../components/ui/Toast';

// ============================================
// CALENDAR PAGE
// Better than Clio: Smart availability check, iCal export, beautiful UI
// ============================================

export default function Calendar() {
  const [events, setEvents] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  useEffect(() => {
    loadEvents();
    loadTeamMembers();
  }, [view, currentDate]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/calendar/events?view=${view}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to load events');

      const data = await response.json();
      setEvents(data.grouped);
    } catch (error) {
      console.error('Load events error:', error);
      showError('Failed to load events');
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

  const handleExportICal = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/calendar/export/ical', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to export calendar');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'casestack-calendar.ics';
      a.click();

      showSuccess('Calendar exported successfully');
    } catch (error) {
      console.error('Export calendar error:', error);
      showError('Failed to export calendar');
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    
    if (view === 'month') {
      newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else if (view === 'week') {
      newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
    }
    
    setCurrentDate(newDate);
  };

  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Previous month days
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const formatDateKey = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
            
            {/* View Switcher */}
            <div className="flex border border-gray-300">
              <button
                onClick={() => setView('month')}
                className={`px-3 py-1 text-sm ${view === 'month' ? 'bg-black text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              >
                Month
              </button>
              <button
                onClick={() => setView('week')}
                className={`px-3 py-1 text-sm border-l border-gray-300 ${view === 'week' ? 'bg-black text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              >
                Week
              </button>
              <button
                onClick={() => setView('day')}
                className={`px-3 py-1 text-sm border-l border-gray-300 ${view === 'day' ? 'bg-black text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              >
                Day
              </button>
            </div>

            {/* Date Navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateDate('prev')}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm font-medium min-w-[150px] text-center">
                {currentDate.toLocaleDateString('en-US', { 
                  month: 'long', 
                  year: 'numeric',
                  ...(view === 'day' && { day: 'numeric' })
                })}
              </span>
              <button
                onClick={() => navigateDate('next')}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="ml-2 px-3 py-1 text-sm border border-gray-300 hover:bg-gray-50"
              >
                Today
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleExportICal}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-sm hover:bg-gray-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export iCal
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Event
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        {loading ? (
          <LoadingTable rows={6} />
        ) : view === 'month' ? (
          <div className="bg-white border border-gray-300">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 border-b border-gray-300">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-2 text-center text-xs font-semibold text-gray-700 border-r border-gray-300 last:border-r-0">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7">
              {getMonthDays().map((date, index) => {
                const dateKey = date ? formatDateKey(date) : null;
                const dayEvents = dateKey ? (events[dateKey] || []) : [];

                return (
                  <div
                    key={index}
                    className={`min-h-[120px] p-2 border-r border-b border-gray-300 last:border-r-0 ${
                      !date ? 'bg-gray-50' : isToday(date) ? 'bg-blue-50' : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    {date && (
                      <>
                        <div className={`text-sm font-medium mb-2 ${isToday(date) ? 'text-blue-600' : 'text-gray-900'}`}>
                          {date.getDate()}
                        </div>
                        <div className="space-y-1">
                          {dayEvents.slice(0, 3).map((event: any) => (
                            <div
                              key={event.id}
                              onClick={() => setSelectedEvent(event)}
                              className="text-xs p-1 bg-blue-100 text-blue-800 rounded cursor-pointer hover:bg-blue-200 truncate"
                            >
                              {new Date(event.startTime).toLocaleTimeString('en-US', { 
                                hour: 'numeric', 
                                minute: '2-digit' 
                              })} {event.title}
                            </div>
                          ))}
                          {dayEvents.length > 3 && (
                            <div className="text-xs text-gray-500 pl-1">
                              +{dayEvents.length - 3} more
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-white border border-gray-300 p-6">
            <p className="text-center text-gray-600">
              Week and Day views coming soon!
            </p>
          </div>
        )}

        {/* Create Event Modal */}
        {showModal && (
          <CreateEventModal
            onClose={() => setShowModal(false)}
            onSuccess={() => {
              setShowModal(false);
              loadEvents();
            }}
            teamMembers={teamMembers}
          />
        )}

        {/* Event Detail Modal */}
        {selectedEvent && (
          <EventDetailModal
            event={selectedEvent}
            onClose={() => setSelectedEvent(null)}
            onUpdate={() => {
              setSelectedEvent(null);
              loadEvents();
            }}
          />
        )}
      </div>
    </div>
  );
}

// ============================================
// CREATE EVENT MODAL
// ============================================
function CreateEventModal({ onClose, onSuccess, teamMembers }: any) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    location: '',
    attendees: [] as string[],
    reminderMinutes: 30
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to create event');

      showSuccess('Event created successfully');
      onSuccess();
    } catch (error) {
      console.error('Create event error:', error);
      showError('Failed to create event');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">Create New Event</h3>

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
              placeholder="Event title"
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
              placeholder="Event description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Time <span className="text-red-600">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Time <span className="text-red-600">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="Meeting location"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Attendees
            </label>
            <select
              multiple
              value={formData.attendees}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, option => option.value);
                setFormData({ ...formData, attendees: selected });
              }}
              className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black"
              size={4}
            >
              {teamMembers.map((member: any) => (
                <option key={member.id} value={member.id}>
                  {member.firstName} {member.lastName}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reminder
            </label>
            <select
              value={formData.reminderMinutes}
              onChange={(e) => setFormData({ ...formData, reminderMinutes: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value={0}>No reminder</option>
              <option value={15}>15 minutes before</option>
              <option value={30}>30 minutes before</option>
              <option value={60}>1 hour before</option>
              <option value={1440}>1 day before</option>
            </select>
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
              {saving ? 'Creating...' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================
// EVENT DETAIL MODAL
// ============================================
function EventDetailModal({ event, onClose, onUpdate }: any) {
  const handleDelete = async () => {
    if (!confirm('Delete this event?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/calendar/events/${event.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to delete event');

      showSuccess('Event deleted successfully');
      onUpdate();
    } catch (error) {
      console.error('Delete event error:', error);
      showError('Failed to delete event');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 max-w-lg w-full">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {event.description && (
            <div>
              <p className="text-sm text-gray-600">{event.description}</p>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Clock className="w-4 h-4" />
            <span>
              {new Date(event.startTime).toLocaleString()} - {new Date(event.endTime).toLocaleTimeString()}
            </span>
          </div>

          {event.location && (
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <MapPin className="w-4 h-4" />
              <span>{event.location}</span>
            </div>
          )}

          {event.attendees && event.attendees.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Users className="w-4 h-4" />
              <span>{event.attendees.length} attendee{event.attendees.length !== 1 ? 's' : ''}</span>
            </div>
          )}

          {event.case && (
            <div className="p-3 bg-gray-50 rounded">
              <p className="text-xs text-gray-500">Related Case</p>
              <p className="text-sm font-medium text-gray-900">
                {event.case.caseNumber} • {event.case.client.name}
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-2 justify-end mt-6 pt-4 border-t border-gray-300">
          <button
            onClick={handleDelete}
            className="px-4 py-2 border border-red-300 text-red-600 text-sm hover:bg-red-50"
          >
            Delete
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-black text-white text-sm hover:bg-gray-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
