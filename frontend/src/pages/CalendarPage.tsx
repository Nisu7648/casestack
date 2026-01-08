import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Users,
  Loader
} from 'lucide-react'

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<'month' | 'week' | 'day'>('month')
  const queryClient = useQueryClient()

  // Fetch all milestones and tasks with due dates
  const { data: eventsData, isLoading } = useQuery({
    queryKey: ['calendar-events', currentDate.getMonth(), currentDate.getFullYear()],
    queryFn: async () => {
      const response = await api.get('/cases', {
        params: {
          include: 'milestones,tasks'
        }
      })
      return response.data.data
    }
  })

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    return { daysInMonth, startingDayOfWeek, year, month }
  }

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate)

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const today = new Date()
  const isToday = (day: number) => {
    return day === today.getDate() && 
           month === today.getMonth() && 
           year === today.getFullYear()
  }

  // Process events for calendar
  const events = []
  if (eventsData) {
    eventsData.forEach(caseItem => {
      // Add milestones
      caseItem.milestones?.forEach(milestone => {
        events.push({
          id: milestone.id,
          type: 'milestone',
          title: milestone.title,
          date: new Date(milestone.dueDate),
          case: caseItem.title,
          status: milestone.status
        })
      })

      // Add tasks with due dates
      caseItem.tasks?.forEach(task => {
        if (task.dueDate) {
          events.push({
            id: task.id,
            type: 'task',
            title: task.title,
            date: new Date(task.dueDate),
            case: caseItem.title,
            status: task.status
          })
        }
      })
    })
  }

  const getEventsForDay = (day: number) => {
    return events.filter(event => {
      const eventDate = event.date
      return eventDate.getDate() === day &&
             eventDate.getMonth() === month &&
             eventDate.getFullYear() === year
    })
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
          <p className="text-gray-500 mt-1">
            View milestones, tasks, and deadlines
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="btn-group">
            <button
              onClick={() => setView('month')}
              className={`btn ${view === 'month' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Month
            </button>
            <button
              onClick={() => setView('week')}
              className={`btn ${view === 'week' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Week
            </button>
            <button
              onClick={() => setView('day')}
              className={`btn ${view === 'day' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Day
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Controls */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={previousMonth}
            className="btn btn-secondary"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <h2 className="text-xl font-bold text-gray-900">
            {monthNames[month]} {year}
          </h2>

          <button
            onClick={nextMonth}
            className="btn btn-secondary"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-lg overflow-hidden">
          {/* Day headers */}
          {dayNames.map(day => (
            <div
              key={day}
              className="bg-gray-50 p-3 text-center text-sm font-semibold text-gray-700"
            >
              {day}
            </div>
          ))}

          {/* Empty cells for days before month starts */}
          {Array.from({ length: startingDayOfWeek }).map((_, index) => (
            <div key={`empty-${index}`} className="bg-white p-3 min-h-[120px]" />
          ))}

          {/* Calendar days */}
          {Array.from({ length: daysInMonth }).map((_, index) => {
            const day = index + 1
            const dayEvents = getEventsForDay(day)
            const isTodayDate = isToday(day)

            return (
              <div
                key={day}
                className={`bg-white p-3 min-h-[120px] hover:bg-gray-50 transition-colors ${
                  isTodayDate ? 'ring-2 ring-primary-500 ring-inset' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-semibold ${
                    isTodayDate ? 'text-primary-600' : 'text-gray-900'
                  }`}>
                    {day}
                  </span>
                  {isTodayDate && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-primary-100 text-primary-700 rounded">
                      Today
                    </span>
                  )}
                </div>

                {/* Events */}
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map(event => (
                    <div
                      key={event.id}
                      className={`text-xs p-1.5 rounded cursor-pointer ${
                        event.type === 'milestone'
                          ? 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                          : event.status === 'DONE'
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : event.status === 'IN_PROGRESS'
                          ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                      title={`${event.case}: ${event.title}`}
                    >
                      <div className="flex items-center space-x-1">
                        {event.type === 'milestone' ? (
                          <CalendarIcon className="w-3 h-3 flex-shrink-0" />
                        ) : (
                          <Clock className="w-3 h-3 flex-shrink-0" />
                        )}
                        <span className="truncate">{event.title}</span>
                      </div>
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-gray-500 pl-1.5">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Upcoming Events
        </h3>
        <div className="space-y-3">
          {events
            .filter(event => event.date >= today)
            .sort((a, b) => a.date.getTime() - b.date.getTime())
            .slice(0, 10)
            .map(event => (
              <div
                key={event.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    event.type === 'milestone'
                      ? 'bg-purple-100 text-purple-600'
                      : 'bg-blue-100 text-blue-600'
                  }`}>
                    {event.type === 'milestone' ? (
                      <CalendarIcon className="w-5 h-5" />
                    ) : (
                      <Clock className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {event.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {event.case}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {event.date.toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    {Math.ceil((event.date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))} days
                  </p>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Legend */}
      <div className="card bg-gray-50">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Legend</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded bg-purple-100 border border-purple-200" />
            <span className="text-xs text-gray-700">Milestone</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded bg-blue-100 border border-blue-200" />
            <span className="text-xs text-gray-700">Task (In Progress)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded bg-green-100 border border-green-200" />
            <span className="text-xs text-gray-700">Task (Done)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded bg-gray-100 border border-gray-200" />
            <span className="text-xs text-gray-700">Task (Not Started)</span>
          </div>
        </div>
      </div>
    </div>
  )
}
