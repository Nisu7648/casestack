// AI Controller
// Handles AI-powered features

const aiService = require('../services/ai.service');

// ============================================
// PREDICT CASE OUTCOME
// ============================================

exports.predictCaseOutcome = async (req, res) => {
  try {
    const { caseId } = req.params;
    
    const prediction = await aiService.predictCaseOutcome(caseId);
    
    res.json({
      success: true,
      data: prediction
    });
    
  } catch (error) {
    console.error('Predict Case Outcome Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ============================================
// ASSESS CASE RISK
// ============================================

exports.assessCaseRisk = async (req, res) => {
  try {
    const { caseId } = req.params;
    
    const riskAssessment = await aiService.assessCaseRisk(caseId);
    
    res.json({
      success: true,
      data: riskAssessment
    });
    
  } catch (error) {
    console.error('Assess Case Risk Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ============================================
// GENERATE CASE SUMMARY
// ============================================

exports.generateCaseSummary = async (req, res) => {
  try {
    const { caseId } = req.params;
    
    const summary = await aiService.generateCaseSummary(caseId);
    
    res.json({
      success: true,
      data: summary
    });
    
  } catch (error) {
    console.error('Generate Case Summary Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ============================================
// GET SMART RECOMMENDATIONS
// ============================================

exports.getSmartRecommendations = async (req, res) => {
  try {
    const { userId, firmId } = req.user;
    
    const recommendations = await aiService.getSmartRecommendations(userId, firmId);
    
    res.json({
      success: true,
      data: recommendations
    });
    
  } catch (error) {
    console.error('Get Smart Recommendations Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ============================================
// GET AI DASHBOARD
// ============================================

exports.getAIDashboard = async (req, res) => {
  try {
    const { userId, firmId } = req.user;
    
    // Get recommendations
    const recommendations = await aiService.getSmartRecommendations(userId, firmId);
    
    // Get user's cases with AI insights
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const cases = await prisma.case.findMany({
      where: {
        firmId,
        OR: [
          { leadId: userId },
          { members: { some: { userId } } }
        ],
        status: { in: ['OPEN', 'IN_PROGRESS'] }
      },
      select: {
        id: true,
        caseNumber: true,
        title: true,
        status: true,
        priority: true,
        aiPredictedOutcome: true,
        aiConfidenceScore: true,
        aiRiskScore: true,
        estimatedCompletionDate: true
      },
      take: 10,
      orderBy: { updatedAt: 'desc' }
    });
    
    // Calculate statistics
    const stats = {
      totalCases: cases.length,
      highRiskCases: cases.filter(c => c.aiRiskScore >= 50).length,
      predictedSuccessful: cases.filter(c => 
        c.aiPredictedOutcome && c.aiPredictedOutcome.includes('POSITIVE')
      ).length,
      avgConfidence: cases.reduce((sum, c) => sum + (c.aiConfidenceScore || 0), 0) / cases.length || 0
    };
    
    res.json({
      success: true,
      data: {
        recommendations,
        cases,
        stats
      }
    });
    
  } catch (error) {
    console.error('Get AI Dashboard Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ============================================
// ANALYZE DOCUMENT (AI)
// ============================================

exports.analyzeDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const document = await prisma.document.findUnique({
      where: { id: documentId }
    });
    
    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }
    
    // Simulate AI document analysis
    // In production, integrate with OCR/NLP services like Google Cloud Vision, AWS Textract, etc.
    const analysis = {
      category: this.categorizeDocument(document.filename),
      confidence: 0.85,
      extractedData: {
        // Simulated extraction
        dates: [],
        amounts: [],
        entities: []
      },
      keyPhrases: [],
      isDuplicate: false
    };
    
    // Update document with AI analysis
    await prisma.document.update({
      where: { id: documentId },
      data: {
        aiCategory: analysis.category,
        aiConfidence: analysis.confidence,
        aiExtractedData: analysis.extractedData
      }
    });
    
    res.json({
      success: true,
      data: analysis
    });
    
  } catch (error) {
    console.error('Analyze Document Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Helper: Categorize document based on filename
categorizeDocument(filename) {
  const lower = filename.toLowerCase();
  
  if (lower.includes('contract') || lower.includes('agreement')) return 'CONTRACT';
  if (lower.includes('invoice') || lower.includes('bill')) return 'INVOICE';
  if (lower.includes('receipt')) return 'RECEIPT';
  if (lower.includes('report')) return 'REPORT';
  if (lower.includes('statement')) return 'STATEMENT';
  if (lower.includes('letter')) return 'CORRESPONDENCE';
  if (lower.includes('evidence')) return 'EVIDENCE';
  
  return 'OTHER';
}

// ============================================
// GET AI INSIGHTS FOR CASE
// ============================================

exports.getCaseInsights = async (req, res) => {
  try {
    const { caseId } = req.params;
    
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const caseData = await prisma.case.findUnique({
      where: { id: caseId },
      include: {
        tasks: true,
        documents: true,
        timeEntries: true,
        milestones: true,
        risks: true
      }
    });
    
    if (!caseData) {
      return res.status(404).json({
        success: false,
        error: 'Case not found'
      });
    }
    
    // Get all AI insights
    const [prediction, riskAssessment, summary] = await Promise.all([
      aiService.predictCaseOutcome(caseId),
      aiService.assessCaseRisk(caseId),
      aiService.generateCaseSummary(caseId)
    ]);
    
    res.json({
      success: true,
      data: {
        prediction,
        riskAssessment,
        summary
      }
    });
    
  } catch (error) {
    console.error('Get Case Insights Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
