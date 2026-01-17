const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');

// ============================================
// ADVANCED AUTHENTICATION SYSTEM
// Email verification, password reset, sessions
// ============================================

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
const ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d'; // 7 days

// In-memory storage (replace with database in production)
const users = new Map();
const verificationCodes = new Map();
const resetTokens = new Map();
const refreshTokens = new Map();
const sessions = new Map();

// ============================================
// HELPER FUNCTIONS
// ============================================

// Generate verification code
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Generate reset token
function generateResetToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Generate tokens
function generateTokens(userId) {
  const accessToken = jwt.sign({ userId }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
  const refreshToken = jwt.sign({ userId }, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
  return { accessToken, refreshToken };
}

// Create session
function createSession(userId, userAgent, ipAddress) {
  const sessionId = crypto.randomUUID();
  const session = {
    sessionId,
    userId,
    userAgent,
    ipAddress,
    createdAt: new Date(),
    lastActivity: new Date(),
    isActive: true
  };
  
  if (!sessions.has(userId)) {
    sessions.set(userId, []);
  }
  sessions.get(userId).push(session);
  
  return sessionId;
}

// Validate email format
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate password strength
function isStrongPassword(password) {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return strongRegex.test(password);
}

// ============================================
// MIDDLEWARE - AUTH
// ============================================
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.userId = decoded.userId;
    next();
  });
};

// ============================================
// 1. REGISTER (WITH EMAIL VERIFICATION)
// ============================================
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('firstName').trim().notEmpty(),
  body('lastName').trim().notEmpty()
], async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { email, password, firstName, lastName } = req.body;

    // Check if user exists
    const existingUser = Array.from(users.values()).find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Validate password strength
    if (!isStrongPassword(password)) {
      return res.status(400).json({ 
        error: 'Password must be at least 8 characters with uppercase, lowercase, and number' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const userId = crypto.randomUUID();
    const user = {
      id: userId,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      isVerified: false, // Email verification required
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: null,
      firmId: null,
      role: 'user',
      status: 'pending_verification'
    };

    users.set(userId, user);

    // Generate verification code
    const verificationCode = generateVerificationCode();
    verificationCodes.set(email, {
      code: verificationCode,
      userId,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    });

    // In production, send email here
    console.log(`Verification code for ${email}: ${verificationCode}`);

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(userId);
    refreshTokens.set(refreshToken, userId);

    // Create session
    const sessionId = createSession(
      userId,
      req.headers['user-agent'],
      req.ip
    );

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please verify your email.',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isVerified: user.isVerified,
        status: user.status
      },
      tokens: {
        accessToken,
        refreshToken
      },
      sessionId,
      verificationRequired: true
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// ============================================
// 2. VERIFY EMAIL
// ============================================
router.post('/verify-email', [
  body('email').isEmail().normalizeEmail(),
  body('code').isLength({ min: 6, max: 6 })
], async (req, res) => {
  try {
    const { email, code } = req.body;

    const verification = verificationCodes.get(email);
    if (!verification) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    if (verification.expiresAt < new Date()) {
      verificationCodes.delete(email);
      return res.status(400).json({ error: 'Verification code expired' });
    }

    if (verification.code !== code) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    // Update user
    const user = users.get(verification.userId);
    if (user) {
      user.isVerified = true;
      user.status = 'active';
      user.updatedAt = new Date();
      users.set(user.id, user);
    }

    // Remove verification code
    verificationCodes.delete(email);

    res.json({
      success: true,
      message: 'Email verified successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isVerified: user.isVerified,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// ============================================
// 3. RESEND VERIFICATION CODE
// ============================================
router.post('/resend-verification', [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const { email } = req.body;

    const user = Array.from(users.values()).find(u => u.email === email);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ error: 'Email already verified' });
    }

    // Generate new code
    const verificationCode = generateVerificationCode();
    verificationCodes.set(email, {
      code: verificationCode,
      userId: user.id,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    });

    console.log(`New verification code for ${email}: ${verificationCode}`);

    res.json({
      success: true,
      message: 'Verification code sent'
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Failed to resend verification code' });
  }
});

// ============================================
// 4. LOGIN (WITH SESSION TRACKING)
// ============================================
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = Array.from(users.values()).find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if verified
    if (!user.isVerified) {
      return res.status(403).json({ 
        error: 'Email not verified',
        verificationRequired: true 
      });
    }

    // Update last login
    user.lastLogin = new Date();
    users.set(user.id, user);

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id);
    refreshTokens.set(refreshToken, user.id);

    // Create session
    const sessionId = createSession(
      user.id,
      req.headers['user-agent'],
      req.ip
    );

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        firmId: user.firmId,
        role: user.role,
        isVerified: user.isVerified,
        lastLogin: user.lastLogin
      },
      tokens: {
        accessToken,
        refreshToken
      },
      sessionId
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ============================================
// 5. REFRESH TOKEN
// ============================================
router.post('/refresh-token', [
  body('refreshToken').notEmpty()
], async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshTokens.has(refreshToken)) {
      return res.status(403).json({ error: 'Invalid refresh token' });
    }

    jwt.verify(refreshToken, JWT_REFRESH_SECRET, (err, decoded) => {
      if (err) {
        refreshTokens.delete(refreshToken);
        return res.status(403).json({ error: 'Invalid or expired refresh token' });
      }

      const userId = decoded.userId;
      const user = users.get(userId);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Generate new tokens
      const tokens = generateTokens(userId);
      
      // Remove old refresh token
      refreshTokens.delete(refreshToken);
      
      // Store new refresh token
      refreshTokens.set(tokens.refreshToken, userId);

      res.json({
        success: true,
        tokens
      });
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ error: 'Token refresh failed' });
  }
});

// ============================================
// 6. FORGOT PASSWORD
// ============================================
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const { email } = req.body;

    const user = Array.from(users.values()).find(u => u.email === email);
    if (!user) {
      // Don't reveal if user exists
      return res.json({
        success: true,
        message: 'If the email exists, a reset link has been sent'
      });
    }

    // Generate reset token
    const resetToken = generateResetToken();
    resetTokens.set(resetToken, {
      userId: user.id,
      email: user.email,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    });

    // In production, send email here
    console.log(`Password reset token for ${email}: ${resetToken}`);
    console.log(`Reset link: http://localhost:3000/reset-password?token=${resetToken}`);

    res.json({
      success: true,
      message: 'If the email exists, a reset link has been sent'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

// ============================================
// 7. RESET PASSWORD
// ============================================
router.post('/reset-password', [
  body('token').notEmpty(),
  body('newPassword').isLength({ min: 8 })
], async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const resetData = resetTokens.get(token);
    if (!resetData) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    if (resetData.expiresAt < new Date()) {
      resetTokens.delete(token);
      return res.status(400).json({ error: 'Reset token expired' });
    }

    // Validate password strength
    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({ 
        error: 'Password must be at least 8 characters with uppercase, lowercase, and number' 
      });
    }

    // Update password
    const user = users.get(resetData.userId);
    if (user) {
      user.password = await bcrypt.hash(newPassword, 12);
      user.updatedAt = new Date();
      users.set(user.id, user);
    }

    // Remove reset token
    resetTokens.delete(token);

    // Invalidate all sessions
    sessions.delete(user.id);

    res.json({
      success: true,
      message: 'Password reset successful. Please login with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Password reset failed' });
  }
});

// ============================================
// 8. CHANGE PASSWORD (AUTHENTICATED)
// ============================================
router.post('/change-password', authenticateToken, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 8 })
], async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.userId;

    const user = users.get(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Validate new password
    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({ 
        error: 'Password must be at least 8 characters with uppercase, lowercase, and number' 
      });
    }

    // Update password
    user.password = await bcrypt.hash(newPassword, 12);
    user.updatedAt = new Date();
    users.set(userId, user);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Password change failed' });
  }
});

// ============================================
// 9. GET PROFILE
// ============================================
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const user = users.get(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        firmId: user.firmId,
        role: user.role,
        isVerified: user.isVerified,
        status: user.status,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// ============================================
// 10. UPDATE PROFILE
// ============================================
router.put('/profile', authenticateToken, [
  body('firstName').optional().trim().notEmpty(),
  body('lastName').optional().trim().notEmpty()
], async (req, res) => {
  try {
    const userId = req.userId;
    const { firstName, lastName } = req.body;

    const user = users.get(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    user.updatedAt = new Date();

    users.set(userId, user);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        firmId: user.firmId
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Profile update failed' });
  }
});

// ============================================
// 11. GET SESSIONS
// ============================================
router.get('/sessions', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const userSessions = sessions.get(userId) || [];

    res.json({
      success: true,
      sessions: userSessions.map(s => ({
        sessionId: s.sessionId,
        userAgent: s.userAgent,
        ipAddress: s.ipAddress,
        createdAt: s.createdAt,
        lastActivity: s.lastActivity,
        isActive: s.isActive
      }))
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ error: 'Failed to get sessions' });
  }
});

// ============================================
// 12. LOGOUT (SINGLE SESSION)
// ============================================
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { sessionId } = req.body;

    if (sessionId) {
      const userSessions = sessions.get(userId) || [];
      const updatedSessions = userSessions.filter(s => s.sessionId !== sessionId);
      sessions.set(userId, updatedSessions);
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// ============================================
// 13. LOGOUT ALL SESSIONS
// ============================================
router.post('/logout-all', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    
    // Remove all sessions
    sessions.delete(userId);
    
    // Remove all refresh tokens for this user
    for (const [token, uid] of refreshTokens.entries()) {
      if (uid === userId) {
        refreshTokens.delete(token);
      }
    }

    res.json({
      success: true,
      message: 'Logged out from all devices'
    });
  } catch (error) {
    console.error('Logout all error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// ============================================
// 14. DELETE ACCOUNT
// ============================================
router.delete('/account', authenticateToken, [
  body('password').notEmpty()
], async (req, res) => {
  try {
    const userId = req.userId;
    const { password } = req.body;

    const user = users.get(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Delete user data
    users.delete(userId);
    sessions.delete(userId);
    
    // Remove refresh tokens
    for (const [token, uid] of refreshTokens.entries()) {
      if (uid === userId) {
        refreshTokens.delete(token);
      }
    }

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Account deletion failed' });
  }
});

// ============================================
// 15. TEST ENDPOINT
// ============================================
router.get('/test', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Advanced auth API working',
    features: [
      'Email verification',
      'Password reset',
      'Session management',
      'Refresh tokens',
      'Account management'
    ],
    stats: {
      totalUsers: users.size,
      activeSessions: Array.from(sessions.values()).flat().length,
      pendingVerifications: verificationCodes.size
    },
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
