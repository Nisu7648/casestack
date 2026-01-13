const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

const prisma = new PrismaClient();

// ============================================
// GOOGLE OAUTH AUTHENTICATION
// Professional sign-in with Google
// ============================================

// ============================================
// 1. GOOGLE SIGN-IN (Verify token and create/login user)
// ============================================
router.post('/google-signin', async (req, res) => {
  try {
    const { credential, clientId } = req.body;

    if (!credential) {
      return res.status(400).json({ error: 'No credential provided' });
    }

    // Verify Google token
    const googleUser = await verifyGoogleToken(credential);

    if (!googleUser) {
      return res.status(401).json({ error: 'Invalid Google token' });
    }

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email: googleUser.email }
    });

    // Create user if doesn't exist
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: uuidv4(),
          email: googleUser.email,
          firstName: googleUser.given_name || googleUser.name.split(' ')[0],
          lastName: googleUser.family_name || googleUser.name.split(' ')[1] || '',
          password: '', // No password for Google users
          role: 'OWNER', // First user is owner
          isActive: true,
          emailVerified: true, // Google emails are verified
          googleId: googleUser.sub,
          avatar: googleUser.picture
        }
      });
    } else {
      // Update Google ID and avatar if not set
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            googleId: googleUser.sub,
            avatar: googleUser.picture,
            emailVerified: true
          }
        });
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // Return user data
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        firmId: user.firmId,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Google sign-in error:', error);
    res.status(500).json({ error: 'Failed to sign in with Google' });
  }
});

// ============================================
// 2. VERIFY GOOGLE TOKEN
// ============================================
async function verifyGoogleToken(token) {
  try {
    // Verify token with Google
    const response = await axios.get(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${token}`
    );

    if (response.data && response.data.email) {
      return {
        sub: response.data.sub,
        email: response.data.email,
        email_verified: response.data.email_verified,
        name: response.data.name,
        given_name: response.data.given_name,
        family_name: response.data.family_name,
        picture: response.data.picture
      };
    }

    return null;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

// ============================================
// 3. LINK GOOGLE ACCOUNT (For existing users)
// ============================================
router.post('/link-google', async (req, res) => {
  try {
    const { userId, credential } = req.body;

    const googleUser = await verifyGoogleToken(credential);

    if (!googleUser) {
      return res.status(401).json({ error: 'Invalid Google token' });
    }

    // Check if Google account is already linked
    const existingUser = await prisma.user.findFirst({
      where: { googleId: googleUser.sub }
    });

    if (existingUser && existingUser.id !== userId) {
      return res.status(400).json({ 
        error: 'This Google account is already linked to another user' 
      });
    }

    // Link Google account
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        googleId: googleUser.sub,
        avatar: googleUser.picture,
        emailVerified: true
      }
    });

    res.json({
      success: true,
      message: 'Google account linked successfully',
      user: {
        id: user.id,
        email: user.email,
        googleId: user.googleId,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Link Google account error:', error);
    res.status(500).json({ error: 'Failed to link Google account' });
  }
});

// ============================================
// 4. UNLINK GOOGLE ACCOUNT
// ============================================
router.post('/unlink-google', async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        googleId: null
      }
    });

    res.json({
      success: true,
      message: 'Google account unlinked successfully'
    });
  } catch (error) {
    console.error('Unlink Google account error:', error);
    res.status(500).json({ error: 'Failed to unlink Google account' });
  }
});

module.exports = router;
