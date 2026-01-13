const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

// ============================================
// CLIENT PORTAL ROUTES
// Better than Clio: Real-time messaging, file preview, mobile-friendly
// ============================================

// Client authentication middleware
const authenticateClient = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.clientUser = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// ============================================
// 1. CLIENT REGISTRATION (Invite-based)
// ============================================
router.post('/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, clientId, inviteCode } = req.body;

    // Verify invite code (you can implement this)
    // For now, allow registration with valid clientId

    // Check if client user already exists
    const existing = await prisma.clientUser.findUnique({
      where: { email }
    });

    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Verify client exists
    const client = await prisma.client.findUnique({
      where: { id: clientId }
    });

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create client user
    const clientUser = await prisma.clientUser.create({
      data: {
        id: uuidv4(),
        clientId,
        email,
        password: hashedPassword,
        firstName,
        lastName,
        canViewCases: true,
        canUploadDocs: true,
        canDownloadDocs: true,
        isActive: true
      }
    });

    // Generate token
    const token = jwt.sign(
      { 
        clientUserId: clientUser.id,
        clientId: clientUser.clientId,
        type: 'CLIENT'
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      clientUser: {
        id: clientUser.id,
        email: clientUser.email,
        firstName: clientUser.firstName,
        lastName: clientUser.lastName,
        clientId: clientUser.clientId
      }
    });
  } catch (error) {
    console.error('Client registration error:', error);
    res.status(500).json({ error: 'Failed to register' });
  }
});

// ============================================
// 2. CLIENT LOGIN
// ============================================
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find client user
    const clientUser = await prisma.clientUser.findUnique({
      where: { email },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            firmId: true
          }
        }
      }
    });

    if (!clientUser) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!clientUser.isActive) {
      return res.status(403).json({ error: 'Account is inactive' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, clientUser.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await prisma.clientUser.update({
      where: { id: clientUser.id },
      data: { lastLogin: new Date() }
    });

    // Generate token
    const token = jwt.sign(
      { 
        clientUserId: clientUser.id,
        clientId: clientUser.clientId,
        firmId: clientUser.client.firmId,
        type: 'CLIENT'
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      clientUser: {
        id: clientUser.id,
        email: clientUser.email,
        firstName: clientUser.firstName,
        lastName: clientUser.lastName,
        clientId: clientUser.clientId,
        client: clientUser.client,
        permissions: {
          canViewCases: clientUser.canViewCases,
          canUploadDocs: clientUser.canUploadDocs,
          canDownloadDocs: clientUser.canDownloadDocs
        }
      }
    });
  } catch (error) {
    console.error('Client login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// ============================================
// 3. GET CLIENT DASHBOARD
// ============================================
router.get('/dashboard', authenticateClient, async (req, res) => {
  try {
    const { clientId, firmId } = req.clientUser;

    // Get client info
    const client = await prisma.client.findUnique({
      where: { id: clientId }
    });

    // Get cases count
    const casesCount = await prisma.case.count({
      where: { clientId, firmId }
    });

    // Get active cases
    const activeCases = await prisma.case.count({
      where: { 
        clientId, 
        firmId,
        status: { in: ['DRAFT', 'IN_REVIEW', 'PARTNER_REVIEW'] }
      }
    });

    // Get finalized cases
    const finalizedCases = await prisma.case.count({
      where: { 
        clientId, 
        firmId,
        status: 'FINALIZED'
      }
    });

    // Get unread messages
    const unreadMessages = await prisma.clientMessage.count({
      where: {
        firmId,
        case: { clientId },
        senderType: 'STAFF',
        isRead: false
      }
    });

    // Get recent cases
    const recentCases = await prisma.case.findMany({
      where: { clientId, firmId },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      select: {
        id: true,
        caseNumber: true,
        caseType: true,
        fiscalYear: true,
        status: true,
        updatedAt: true
      }
    });

    res.json({
      client,
      stats: {
        totalCases: casesCount,
        activeCases,
        finalizedCases,
        unreadMessages
      },
      recentCases
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ error: 'Failed to get dashboard' });
  }
});

// ============================================
// 4. LIST CLIENT CASES
// ============================================
router.get('/cases', authenticateClient, async (req, res) => {
  try {
    const { clientId, firmId } = req.clientUser;
    const { status } = req.query;

    const cases = await prisma.case.findMany({
      where: {
        clientId,
        firmId,
        ...(status && { status })
      },
      include: {
        preparedBy: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        _count: {
          select: {
            files: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json({
      cases,
      count: cases.length
    });
  } catch (error) {
    console.error('List cases error:', error);
    res.status(500).json({ error: 'Failed to list cases' });
  }
});

// ============================================
// 5. GET CASE DETAILS
// ============================================
router.get('/cases/:id', authenticateClient, async (req, res) => {
  try {
    const { id } = req.params;
    const { clientId, firmId } = req.clientUser;

    const caseData = await prisma.case.findFirst({
      where: {
        id,
        clientId,
        firmId
      },
      include: {
        client: true,
        preparedBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        reviewedBy: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        approvedBy: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        bundles: {
          include: {
            files: {
              select: {
                id: true,
                fileName: true,
                fileSize: true,
                uploadedAt: true
              }
            }
          }
        }
      }
    });

    if (!caseData) {
      return res.status(404).json({ error: 'Case not found' });
    }

    res.json({ case: caseData });
  } catch (error) {
    console.error('Get case error:', error);
    res.status(500).json({ error: 'Failed to get case' });
  }
});

// ============================================
// 6. LIST CASE FILES
// ============================================
router.get('/cases/:caseId/files', authenticateClient, async (req, res) => {
  try {
    const { caseId } = req.params;
    const { clientId, firmId } = req.clientUser;

    // Verify case belongs to client
    const caseData = await prisma.case.findFirst({
      where: { id: caseId, clientId, firmId }
    });

    if (!caseData) {
      return res.status(404).json({ error: 'Case not found' });
    }

    const files = await prisma.file.findMany({
      where: {
        bundle: {
          caseId
        }
      },
      include: {
        bundle: {
          select: {
            name: true
          }
        },
        uploadedBy: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { uploadedAt: 'desc' }
    });

    res.json({
      files,
      count: files.length
    });
  } catch (error) {
    console.error('List files error:', error);
    res.status(500).json({ error: 'Failed to list files' });
  }
});

// ============================================
// 7. DOWNLOAD FILE
// ============================================
router.get('/files/:id/download', authenticateClient, async (req, res) => {
  try {
    const { id } = req.params;
    const { clientId, firmId } = req.clientUser;

    const file = await prisma.file.findFirst({
      where: {
        id,
        bundle: {
          case: {
            clientId,
            firmId
          }
        }
      }
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // In production, serve from cloud storage
    res.json({
      success: true,
      file: {
        id: file.id,
        fileName: file.fileName,
        downloadUrl: `/api/files/${file.id}/download` // Your existing file download endpoint
      }
    });
  } catch (error) {
    console.error('Download file error:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

// ============================================
// 8. GET MESSAGES FOR CASE
// ============================================
router.get('/cases/:caseId/messages', authenticateClient, async (req, res) => {
  try {
    const { caseId } = req.params;
    const { clientId, firmId } = req.clientUser;

    // Verify case belongs to client
    const caseData = await prisma.case.findFirst({
      where: { id: caseId, clientId, firmId }
    });

    if (!caseData) {
      return res.status(404).json({ error: 'Case not found' });
    }

    const messages = await prisma.clientMessage.findMany({
      where: {
        caseId,
        firmId
      },
      orderBy: { createdAt: 'asc' }
    });

    // Mark messages as read
    await prisma.clientMessage.updateMany({
      where: {
        caseId,
        senderType: 'STAFF',
        isRead: false
      },
      data: { isRead: true }
    });

    res.json({
      messages,
      count: messages.length
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

// ============================================
// 9. SEND MESSAGE
// ============================================
router.post('/cases/:caseId/messages', authenticateClient, async (req, res) => {
  try {
    const { caseId } = req.params;
    const { message } = req.body;
    const { clientUserId, clientId, firmId } = req.clientUser;

    // Verify case belongs to client
    const caseData = await prisma.case.findFirst({
      where: { id: caseId, clientId, firmId }
    });

    if (!caseData) {
      return res.status(404).json({ error: 'Case not found' });
    }

    const newMessage = await prisma.clientMessage.create({
      data: {
        id: uuidv4(),
        firmId,
        caseId,
        senderId: clientUserId,
        senderType: 'CLIENT',
        message,
        isRead: false
      }
    });

    res.json({
      success: true,
      message: newMessage
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// ============================================
// 10. UPLOAD DOCUMENT (if allowed)
// ============================================
router.post('/cases/:caseId/upload', authenticateClient, async (req, res) => {
  try {
    const { caseId } = req.params;
    const { clientId, firmId } = req.clientUser;

    // Check permission
    const clientUser = await prisma.clientUser.findUnique({
      where: { id: req.clientUser.clientUserId }
    });

    if (!clientUser.canUploadDocs) {
      return res.status(403).json({ error: 'Upload permission denied' });
    }

    // Verify case belongs to client
    const caseData = await prisma.case.findFirst({
      where: { id: caseId, clientId, firmId }
    });

    if (!caseData) {
      return res.status(404).json({ error: 'Case not found' });
    }

    // Handle file upload (integrate with your existing file upload logic)
    res.json({
      success: true,
      message: 'File upload endpoint ready',
      note: 'Integrate with your existing file upload system'
    });
  } catch (error) {
    console.error('Upload file error:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

module.exports = router;
