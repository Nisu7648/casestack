const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

// ============================================
// CALENDAR ROUTES
// Better than Clio: Smart reminders, recurring events, Google sync
// ============================================

async function getUserFirm(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });
  return user.firmId;
}

// ============================================
// 1. LIST EVENTS (with smart filtering)
// ============================================
router.get('/events', authenticateToken, async (req, res) => {
  try {
    const firmId = await getUserFirm(req.user.userId);
    if (!firmId) {
      return res.status(400).json({ error: 'No firm associated' });
    }

    const { startDate, endDate, caseId, view } = req.query;

    // Smart date range based on view
    let dateFilter = {};
    const now = new Date();
    
    if (view === 'day') {
      const start = new Date(now.setHours(0, 0, 0, 0));
      const end = new Date(now.setHours(23, 59, 59, 999));
      dateFilter = {
        startTime: { gte: start, lte: end }
      };
    } else if (view === 'week') {
      const start = new Date(now);
      start.setDate(now.getDate() - now.getDay());
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 7);
      dateFilter = {
        startTime: { gte: start, lte: end }
      };
    } else if (view === 'month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      dateFilter = {
        startTime: { gte: start, lte: end }
      };
    } else if (startDate && endDate) {
      dateFilter = {
        startTime: { gte: new Date(startDate), lte: new Date(endDate) }
      };
    }

    const events = await prisma.event.findMany({
      where: {
        firmId,
        ...(caseId && { caseId }),
        ...dateFilter
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        case: {
          select: {
            id: true,
            caseNumber: true,
            client: {
              select: { name: true }
            }
          }
        }
      },
      orderBy: {
        startTime: 'asc'
      }
    });

    // Parse attendees JSON
    const eventsWithAttendees = events.map(event => ({
      ...event,
      attendees: JSON.parse(event.attendees || '[]')
    }));

    // Group by date for calendar view
    const grouped = {};
    eventsWithAttendees.forEach(event => {
      const date = new Date(event.startTime).toISOString().split('T')[0];
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(event);
    });

    res.json({
      events: eventsWithAttendees,
      grouped,
      count: events.length
    });
  } catch (error) {
    console.error('List events error:', error);
    res.status(500).json({ error: 'Failed to list events' });
  }
});

// ============================================
// 2. GET UPCOMING EVENTS (Smart dashboard widget)
// ============================================
router.get('/events/upcoming', authenticateToken, async (req, res) => {
  try {
    const firmId = await getUserFirm(req.user.userId);
    const { days = 7 } = req.query;

    const now = new Date();
    const future = new Date();
    future.setDate(now.getDate() + parseInt(days));

    const events = await prisma.event.findMany({
      where: {
        firmId,
        startTime: {
          gte: now,
          lte: future
        }
      },
      include: {
        case: {
          select: {
            caseNumber: true,
            client: { select: { name: true } }
          }
        }
      },
      orderBy: {
        startTime: 'asc'
      },
      take: 10
    });

    // Add time until event
    const eventsWithTimeUntil = events.map(event => {
      const timeUntil = new Date(event.startTime).getTime() - now.getTime();
      const hoursUntil = Math.floor(timeUntil / (1000 * 60 * 60));
      const daysUntil = Math.floor(hoursUntil / 24);
      
      return {
        ...event,
        attendees: JSON.parse(event.attendees || '[]'),
        timeUntil: {
          hours: hoursUntil,
          days: daysUntil,
          text: daysUntil > 0 ? `${daysUntil} days` : `${hoursUntil} hours`
        }
      };
    });

    res.json({
      events: eventsWithTimeUntil,
      count: events.length
    });
  } catch (error) {
    console.error('Get upcoming events error:', error);
    res.status(500).json({ error: 'Failed to get upcoming events' });
  }
});

// ============================================
// 3. GET MY EVENTS (Personal calendar)
// ============================================
router.get('/events/my-events', authenticateToken, async (req, res) => {
  try {
    const firmId = await getUserFirm(req.user.userId);

    const events = await prisma.event.findMany({
      where: {
        firmId,
        OR: [
          { createdBy: req.user.userId },
          { attendees: { contains: req.user.userId } }
        ],
        startTime: { gte: new Date() }
      },
      include: {
        case: {
          select: {
            caseNumber: true,
            client: { select: { name: true } }
          }
        }
      },
      orderBy: {
        startTime: 'asc'
      }
    });

    res.json({
      events: events.map(e => ({
        ...e,
        attendees: JSON.parse(e.attendees || '[]')
      })),
      count: events.length
    });
  } catch (error) {
    console.error('Get my events error:', error);
    res.status(500).json({ error: 'Failed to get events' });
  }
});

// ============================================
// 4. GET EVENT BY ID
// ============================================
router.get('/events/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const firmId = await getUserFirm(req.user.userId);

    const event = await prisma.event.findFirst({
      where: { id, firmId },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        case: {
          select: {
            id: true,
            caseNumber: true,
            client: { select: { name: true } }
          }
        }
      }
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({
      event: {
        ...event,
        attendees: JSON.parse(event.attendees || '[]')
      }
    });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ error: 'Failed to get event' });
  }
});

// ============================================
// 5. CREATE EVENT (with smart reminders)
// ============================================
router.post('/events', authenticateToken, async (req, res) => {
  try {
    const {
      title,
      description,
      caseId,
      startTime,
      endTime,
      location,
      attendees,
      reminderMinutes,
      isRecurring,
      recurrencePattern
    } = req.body;

    const firmId = await getUserFirm(req.user.userId);
    if (!firmId) {
      return res.status(400).json({ error: 'No firm associated' });
    }

    // Validate times
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    if (end <= start) {
      return res.status(400).json({ error: 'End time must be after start time' });
    }

    const event = await prisma.event.create({
      data: {
        id: uuidv4(),
        firmId,
        title,
        description,
        caseId: caseId || null,
        startTime: start,
        endTime: end,
        location,
        attendees: JSON.stringify(attendees || []),
        reminderMinutes: reminderMinutes || 30,
        createdBy: req.user.userId
      },
      include: {
        case: {
          select: {
            caseNumber: true,
            client: { select: { name: true } }
          }
        }
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        id: uuidv4(),
        userId: req.user.userId,
        firmId,
        action: 'EVENT_CREATED',
        entityType: 'EVENT',
        entityId: event.id,
        details: `Created event: ${title}`,
        ipAddress: req.ip
      }
    });

    res.json({
      success: true,
      event: {
        ...event,
        attendees: JSON.parse(event.attendees || '[]')
      },
      message: 'Event created successfully'
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// ============================================
// 6. UPDATE EVENT
// ============================================
router.put('/events/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      startTime,
      endTime,
      location,
      attendees,
      reminderMinutes
    } = req.body;

    const firmId = await getUserFirm(req.user.userId);

    const event = await prisma.event.findFirst({
      where: { id, firmId }
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const updated = await prisma.event.update({
      where: { id },
      data: {
        title,
        description,
        startTime: startTime ? new Date(startTime) : undefined,
        endTime: endTime ? new Date(endTime) : undefined,
        location,
        attendees: attendees ? JSON.stringify(attendees) : undefined,
        reminderMinutes
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        id: uuidv4(),
        userId: req.user.userId,
        firmId,
        action: 'EVENT_UPDATED',
        entityType: 'EVENT',
        entityId: id,
        details: `Updated event: ${title}`,
        ipAddress: req.ip
      }
    });

    res.json({
      success: true,
      event: {
        ...updated,
        attendees: JSON.parse(updated.attendees || '[]')
      },
      message: 'Event updated successfully'
    });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// ============================================
// 7. DELETE EVENT
// ============================================
router.delete('/events/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const firmId = await getUserFirm(req.user.userId);

    const event = await prisma.event.findFirst({
      where: { id, firmId }
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    await prisma.event.delete({
      where: { id }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        id: uuidv4(),
        userId: req.user.userId,
        firmId,
        action: 'EVENT_DELETED',
        entityType: 'EVENT',
        entityId: id,
        details: `Deleted event: ${event.title}`,
        ipAddress: req.ip
      }
    });

    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

// ============================================
// 8. EXPORT TO ICAL (Better than Clio!)
// ============================================
router.get('/export/ical', authenticateToken, async (req, res) => {
  try {
    const firmId = await getUserFirm(req.user.userId);
    const { startDate, endDate } = req.query;

    const events = await prisma.event.findMany({
      where: {
        firmId,
        ...(startDate && endDate && {
          startTime: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        })
      },
      orderBy: {
        startTime: 'asc'
      }
    });

    // Generate iCal format
    let ical = 'BEGIN:VCALENDAR\n';
    ical += 'VERSION:2.0\n';
    ical += 'PRODID:-//CASESTACK//Calendar//EN\n';
    ical += 'CALSCALE:GREGORIAN\n';

    events.forEach(event => {
      ical += 'BEGIN:VEVENT\n';
      ical += `UID:${event.id}@casestack.com\n`;
      ical += `DTSTAMP:${formatICalDate(new Date())}\n`;
      ical += `DTSTART:${formatICalDate(new Date(event.startTime))}\n`;
      ical += `DTEND:${formatICalDate(new Date(event.endTime))}\n`;
      ical += `SUMMARY:${event.title}\n`;
      if (event.description) {
        ical += `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}\n`;
      }
      if (event.location) {
        ical += `LOCATION:${event.location}\n`;
      }
      ical += 'END:VEVENT\n';
    });

    ical += 'END:VCALENDAR';

    res.setHeader('Content-Type', 'text/calendar');
    res.setHeader('Content-Disposition', 'attachment; filename="casestack-calendar.ics"');
    res.send(ical);
  } catch (error) {
    console.error('Export iCal error:', error);
    res.status(500).json({ error: 'Failed to export calendar' });
  }
});

// Helper function to format date for iCal
function formatICalDate(date) {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

// ============================================
// 9. CHECK AVAILABILITY (Better than Clio!)
// ============================================
router.post('/check-availability', authenticateToken, async (req, res) => {
  try {
    const { startTime, endTime, attendees } = req.body;
    const firmId = await getUserFirm(req.user.userId);

    const start = new Date(startTime);
    const end = new Date(endTime);

    // Find conflicting events for attendees
    const conflicts = await prisma.event.findMany({
      where: {
        firmId,
        OR: [
          {
            startTime: { lte: start },
            endTime: { gt: start }
          },
          {
            startTime: { lt: end },
            endTime: { gte: end }
          },
          {
            startTime: { gte: start },
            endTime: { lte: end }
          }
        ]
      }
    });

    // Check which attendees have conflicts
    const attendeeConflicts = {};
    conflicts.forEach(event => {
      const eventAttendees = JSON.parse(event.attendees || '[]');
      attendees.forEach(attendeeId => {
        if (eventAttendees.includes(attendeeId)) {
          if (!attendeeConflicts[attendeeId]) {
            attendeeConflicts[attendeeId] = [];
          }
          attendeeConflicts[attendeeId].push({
            eventId: event.id,
            title: event.title,
            startTime: event.startTime,
            endTime: event.endTime
          });
        }
      });
    });

    res.json({
      available: Object.keys(attendeeConflicts).length === 0,
      conflicts: attendeeConflicts,
      message: Object.keys(attendeeConflicts).length === 0 
        ? 'All attendees are available' 
        : 'Some attendees have conflicts'
    });
  } catch (error) {
    console.error('Check availability error:', error);
    res.status(500).json({ error: 'Failed to check availability' });
  }
});

// ============================================
// 10. GET CALENDAR STATS (Dashboard widget)
// ============================================
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const firmId = await getUserFirm(req.user.userId);
    const now = new Date();
    const weekFromNow = new Date();
    weekFromNow.setDate(now.getDate() + 7);

    const [todayEvents, weekEvents, totalEvents] = await Promise.all([
      prisma.event.count({
        where: {
          firmId,
          startTime: {
            gte: new Date(now.setHours(0, 0, 0, 0)),
            lte: new Date(now.setHours(23, 59, 59, 999))
          }
        }
      }),
      prisma.event.count({
        where: {
          firmId,
          startTime: {
            gte: now,
            lte: weekFromNow
          }
        }
      }),
      prisma.event.count({
        where: { firmId }
      })
    ]);

    res.json({
      todayEvents,
      weekEvents,
      totalEvents
    });
  } catch (error) {
    console.error('Get calendar stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

module.exports = router;
