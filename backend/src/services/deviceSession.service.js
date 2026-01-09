const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const { logger } = require('../utils/logger');

const prisma = new PrismaClient();

// ============================================
// DEVICE SESSION SERVICE
// Manages device sessions with max 3 devices per user
// ============================================

class DeviceSessionService {
  /**
   * Generate unique device ID from user agent and other factors
   */
  generateDeviceId(userAgent, ipAddress) {
    const hash = crypto
      .createHash('sha256')
      .update(`${userAgent}-${ipAddress}-${Date.now()}`)
      .digest('hex');
    return hash.substring(0, 32);
  }

  /**
   * Parse user agent to extract device information
   */
  parseUserAgent(userAgent) {
    if (!userAgent) {
      return {
        deviceName: 'Unknown Device',
        deviceType: 'unknown',
        browser: 'Unknown',
        os: 'Unknown'
      };
    }

    // Detect device type
    let deviceType = 'desktop';
    if (/mobile/i.test(userAgent)) deviceType = 'mobile';
    else if (/tablet|ipad/i.test(userAgent)) deviceType = 'tablet';

    // Detect browser
    let browser = 'Unknown';
    if (/chrome/i.test(userAgent) && !/edg/i.test(userAgent)) browser = 'Chrome';
    else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) browser = 'Safari';
    else if (/firefox/i.test(userAgent)) browser = 'Firefox';
    else if (/edg/i.test(userAgent)) browser = 'Edge';
    else if (/opera|opr/i.test(userAgent)) browser = 'Opera';

    // Detect OS
    let os = 'Unknown';
    if (/windows/i.test(userAgent)) os = 'Windows';
    else if (/mac/i.test(userAgent)) os = 'macOS';
    else if (/linux/i.test(userAgent)) os = 'Linux';
    else if (/android/i.test(userAgent)) os = 'Android';
    else if (/ios|iphone|ipad/i.test(userAgent)) os = 'iOS';

    const deviceName = `${browser} on ${os}`;

    return { deviceName, deviceType, browser, os };
  }

  /**
   * Check if user has reached device limit
   */
  async checkDeviceLimit(userId) {
    const activeSessions = await prisma.deviceSession.count({
      where: {
        userId,
        isActive: true,
        expiresAt: { gt: new Date() }
      }
    });

    // Get max devices from firm settings (default 3)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        firm: {
          include: { settings: true }
        }
      }
    });

    const maxDevices = user?.firm?.settings?.maxDevicesPerUser || 3;

    return {
      current: activeSessions,
      max: maxDevices,
      canAddDevice: activeSessions < maxDevices
    };
  }

  /**
   * Create new device session
   */
  async createSession(userId, token, req) {
    const userAgent = req.get('user-agent') || '';
    const ipAddress = req.ip || req.connection.remoteAddress;

    // Check device limit
    const deviceLimit = await this.checkDeviceLimit(userId);
    
    if (!deviceLimit.canAddDevice) {
      logger.warn('Device limit exceeded', { userId, current: deviceLimit.current, max: deviceLimit.max });
      
      // Log audit event
      await prisma.auditLog.create({
        data: {
          firmId: (await prisma.user.findUnique({ where: { id: userId } })).firmId,
          userId,
          action: 'DEVICE_LIMIT_EXCEEDED',
          resourceType: 'DEVICE',
          metadata: {
            attemptedFrom: ipAddress,
            userAgent,
            currentDevices: deviceLimit.current,
            maxDevices: deviceLimit.max
          },
          ipAddress,
          userAgent
        }
      });

      throw new Error(`Device limit exceeded. Maximum ${deviceLimit.max} devices allowed. Please logout from another device.`);
    }

    // Parse device info
    const deviceInfo = this.parseUserAgent(userAgent);
    const deviceId = this.generateDeviceId(userAgent, ipAddress);

    // Check if device already exists (same deviceId)
    const existingDevice = await prisma.deviceSession.findFirst({
      where: {
        userId,
        deviceId,
        isActive: true
      }
    });

    if (existingDevice) {
      // Update existing session
      const updated = await prisma.deviceSession.update({
        where: { id: existingDevice.id },
        data: {
          token,
          ipAddress,
          userAgent,
          lastActivityAt: new Date(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        }
      });

      logger.info('Device session updated', { userId, deviceId, sessionId: updated.id });
      return updated;
    }

    // Create new session
    const session = await prisma.deviceSession.create({
      data: {
        userId,
        deviceId,
        deviceName: deviceInfo.deviceName,
        deviceType: deviceInfo.deviceType,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        token,
        ipAddress,
        userAgent,
        isActive: true,
        lastActivityAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    });

    // Log audit event
    const user = await prisma.user.findUnique({ where: { id: userId } });
    await prisma.auditLog.create({
      data: {
        firmId: user.firmId,
        userId,
        action: 'DEVICE_REGISTERED',
        resourceType: 'DEVICE',
        resourceId: session.id,
        metadata: {
          deviceName: deviceInfo.deviceName,
          deviceType: deviceInfo.deviceType,
          browser: deviceInfo.browser,
          os: deviceInfo.os
        },
        ipAddress,
        userAgent
      }
    });

    logger.info('New device session created', { userId, deviceId, sessionId: session.id });
    return session;
  }

  /**
   * Get all active sessions for a user
   */
  async getUserSessions(userId) {
    const sessions = await prisma.deviceSession.findMany({
      where: {
        userId,
        isActive: true,
        expiresAt: { gt: new Date() }
      },
      orderBy: { lastActivityAt: 'desc' }
    });

    return sessions;
  }

  /**
   * Update session activity
   */
  async updateActivity(token) {
    try {
      await prisma.deviceSession.updateMany({
        where: {
          token,
          isActive: true
        },
        data: {
          lastActivityAt: new Date()
        }
      });
    } catch (error) {
      logger.error('Failed to update session activity', error);
    }
  }

  /**
   * Logout from specific device
   */
  async logoutDevice(userId, sessionId) {
    const session = await prisma.deviceSession.findFirst({
      where: {
        id: sessionId,
        userId
      }
    });

    if (!session) {
      throw new Error('Session not found');
    }

    await prisma.deviceSession.update({
      where: { id: sessionId },
      data: {
        isActive: false
      }
    });

    // Log audit event
    const user = await prisma.user.findUnique({ where: { id: userId } });
    await prisma.auditLog.create({
      data: {
        firmId: user.firmId,
        userId,
        action: 'DEVICE_REMOVED',
        resourceType: 'DEVICE',
        resourceId: sessionId,
        metadata: {
          deviceName: session.deviceName,
          deviceType: session.deviceType
        }
      }
    });

    logger.info('Device session logged out', { userId, sessionId });
  }

  /**
   * Logout from all devices
   */
  async logoutAllDevices(userId) {
    const sessions = await prisma.deviceSession.findMany({
      where: {
        userId,
        isActive: true
      }
    });

    await prisma.deviceSession.updateMany({
      where: {
        userId,
        isActive: true
      },
      data: {
        isActive: false
      }
    });

    // Log audit event
    const user = await prisma.user.findUnique({ where: { id: userId } });
    await prisma.auditLog.create({
      data: {
        firmId: user.firmId,
        userId,
        action: 'USER_LOGOUT',
        resourceType: 'DEVICE',
        metadata: {
          devicesLoggedOut: sessions.length,
          devices: sessions.map(s => ({
            deviceName: s.deviceName,
            deviceType: s.deviceType
          }))
        }
      }
    });

    logger.info('All devices logged out', { userId, count: sessions.length });
  }

  /**
   * Verify session is valid
   */
  async verifySession(token) {
    const session = await prisma.deviceSession.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!session) {
      return { valid: false, reason: 'Session not found' };
    }

    if (!session.isActive) {
      return { valid: false, reason: 'Session is inactive' };
    }

    if (new Date() > session.expiresAt) {
      // Expire the session
      await prisma.deviceSession.update({
        where: { id: session.id },
        data: { isActive: false }
      });
      return { valid: false, reason: 'Session expired' };
    }

    // Update activity
    await this.updateActivity(token);

    return { valid: true, session, user: session.user };
  }

  /**
   * Clean up expired sessions (run periodically)
   */
  async cleanupExpiredSessions() {
    const result = await prisma.deviceSession.updateMany({
      where: {
        isActive: true,
        expiresAt: { lt: new Date() }
      },
      data: {
        isActive: false
      }
    });

    logger.info('Cleaned up expired sessions', { count: result.count });
    return result.count;
  }

  /**
   * Get device statistics for a user
   */
  async getDeviceStats(userId) {
    const [activeSessions, totalSessions, recentLogins] = await Promise.all([
      prisma.deviceSession.count({
        where: {
          userId,
          isActive: true,
          expiresAt: { gt: new Date() }
        }
      }),
      prisma.deviceSession.count({
        where: { userId }
      }),
      prisma.deviceSession.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          deviceName: true,
          deviceType: true,
          browser: true,
          os: true,
          ipAddress: true,
          lastActivityAt: true,
          createdAt: true,
          isActive: true
        }
      })
    ]);

    return {
      activeSessions,
      totalSessions,
      recentLogins
    };
  }
}

module.exports = new DeviceSessionService();
