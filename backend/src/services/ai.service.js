// AI Case Assistant Service
// Provides intelligent predictions, recommendations, and analysis

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class AIService {
  
  // ============================================
  // CASE OUTCOME PREDICTION
  // ============================================
  
  async predictCaseOutcome(caseId) {
    try {
      const caseData = await prisma.case.findUnique({
        where: { id: caseId },
        include: {
          client: true,
          lead: true,
          tasks: true,
          documents: true,
          timeEntries: true,
          milestones: true,
          risks: true
        }
      });
      
      if (!caseData) {
        throw new Error('Case not found');
      }
      
      // Get historical data for similar cases
      const similarCases = await this.findSimilarCases(caseData);
      
      // Calculate prediction based on multiple factors
      const prediction = this.calculatePrediction(caseData, similarCases);
      
      // Save AI interaction
      await prisma.aIInteraction.create({
        data: {
          type: 'CASE_PREDICTION',
          prompt: `Predict outcome for case ${caseData.caseNumber}`,
          response: JSON.stringify(prediction),
          confidence: prediction.confidence,
          userId: caseData.leadId,
          caseId: caseId
        }
      });
      
      // Update case with prediction
      await prisma.case.update({
        where: { id: caseId },
        data: {
          aiPredictedOutcome: prediction.outcome,
          aiConfidenceScore: prediction.confidence,
          aiRecommendations: prediction.recommendations,
          estimatedCompletionDate: prediction.estimatedCompletion
        }
      });
      
      return prediction;
      
    } catch (error) {
      console.error('AI Prediction Error:', error);
      throw error;
    }
  }
  
  // ============================================
  // FIND SIMILAR CASES (ML Algorithm)
  // ============================================
  
  async findSimilarCases(currentCase) {
    const allCases = await prisma.case.findMany({
      where: {
        firmId: currentCase.firmId,
        status: 'CLOSED',
        id: { not: currentCase.id }
      },
      include: {
        tasks: true,
        documents: true,
        timeEntries: true
      },
      take: 100
    });
    
    // Calculate similarity scores
    const similarities = allCases.map(historicalCase => {
      let score = 0;
      
      // Priority similarity (20%)
      if (historicalCase.priority === currentCase.priority) score += 20;
      
      // Task count similarity (15%)
      const taskDiff = Math.abs(historicalCase.tasks.length - currentCase.tasks.length);
      score += Math.max(0, 15 - taskDiff);
      
      // Document count similarity (15%)
      const docDiff = Math.abs(historicalCase.documents.length - currentCase.documents.length);
      score += Math.max(0, 15 - docDiff);
      
      // Time spent similarity (20%)
      const historicalHours = historicalCase.timeEntries.reduce((sum, t) => sum + t.hours, 0);
      const currentHours = currentCase.timeEntries.reduce((sum, t) => sum + t.hours, 0);
      const hoursDiff = Math.abs(historicalHours - currentHours);
      score += Math.max(0, 20 - hoursDiff / 10);
      
      // Client industry similarity (30%)
      if (historicalCase.client?.industry === currentCase.client?.industry) score += 30;
      
      return {
        case: historicalCase,
        similarity: score
      };
    });
    
    // Return top 10 most similar cases
    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 10)
      .map(s => s.case);
  }
  
  // ============================================
  // CALCULATE PREDICTION
  // ============================================
  
  calculatePrediction(currentCase, similarCases) {
    if (similarCases.length === 0) {
      return {
        outcome: 'UNCERTAIN',
        confidence: 0.3,
        estimatedCompletion: this.estimateCompletionDate(currentCase),
        recommendations: this.generateRecommendations(currentCase, [])
      };
    }
    
    // Analyze outcomes of similar cases
    const outcomes = similarCases.map(c => c.status);
    const successfulCases = outcomes.filter(o => o === 'CLOSED').length;
    const successRate = successfulCases / similarCases.length;
    
    // Calculate average completion time
    const completionTimes = similarCases
      .filter(c => c.closedAt && c.createdAt)
      .map(c => {
        const diff = new Date(c.closedAt) - new Date(c.createdAt);
        return diff / (1000 * 60 * 60 * 24); // days
      });
    
    const avgCompletionDays = completionTimes.length > 0
      ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
      : 30;
    
    // Determine outcome
    let outcome = 'POSITIVE';
    let confidence = 0.7;
    
    if (successRate > 0.8) {
      outcome = 'HIGHLY_POSITIVE';
      confidence = 0.9;
    } else if (successRate > 0.6) {
      outcome = 'POSITIVE';
      confidence = 0.75;
    } else if (successRate > 0.4) {
      outcome = 'NEUTRAL';
      confidence = 0.6;
    } else {
      outcome = 'CHALLENGING';
      confidence = 0.5;
    }
    
    // Estimate completion date
    const estimatedCompletion = new Date();
    estimatedCompletion.setDate(estimatedCompletion.getDate() + Math.round(avgCompletionDays));
    
    return {
      outcome,
      confidence,
      estimatedCompletion,
      recommendations: this.generateRecommendations(currentCase, similarCases),
      insights: {
        successRate: Math.round(successRate * 100),
        avgCompletionDays: Math.round(avgCompletionDays),
        similarCasesAnalyzed: similarCases.length
      }
    };
  }
  
  // ============================================
  // GENERATE RECOMMENDATIONS
  // ============================================
  
  generateRecommendations(currentCase, similarCases) {
    const recommendations = [];
    
    // Task-based recommendations
    if (currentCase.tasks.length === 0) {
      recommendations.push({
        type: 'TASK',
        priority: 'HIGH',
        message: 'Create initial tasks to structure the case workflow',
        action: 'CREATE_TASKS'
      });
    }
    
    const incompleteTasks = currentCase.tasks.filter(t => t.status !== 'DONE').length;
    if (incompleteTasks > 10) {
      recommendations.push({
        type: 'TASK',
        priority: 'MEDIUM',
        message: `You have ${incompleteTasks} incomplete tasks. Consider prioritizing or delegating.`,
        action: 'REVIEW_TASKS'
      });
    }
    
    // Document-based recommendations
    if (currentCase.documents.length === 0) {
      recommendations.push({
        type: 'DOCUMENT',
        priority: 'MEDIUM',
        message: 'Upload relevant documents to support the case',
        action: 'UPLOAD_DOCUMENTS'
      });
    }
    
    // Time tracking recommendations
    const totalHours = currentCase.timeEntries.reduce((sum, t) => sum + t.hours, 0);
    if (totalHours === 0) {
      recommendations.push({
        type: 'TIME',
        priority: 'HIGH',
        message: 'Start tracking time to ensure accurate billing',
        action: 'START_TIME_TRACKING'
      });
    }
    
    // Milestone recommendations
    if (currentCase.milestones.length === 0) {
      recommendations.push({
        type: 'MILESTONE',
        priority: 'MEDIUM',
        message: 'Set milestones to track progress effectively',
        action: 'CREATE_MILESTONES'
      });
    }
    
    // Risk assessment recommendations
    if (currentCase.risks.length === 0 && similarCases.length > 0) {
      const commonRisks = this.identifyCommonRisks(similarCases);
      if (commonRisks.length > 0) {
        recommendations.push({
          type: 'RISK',
          priority: 'HIGH',
          message: `Similar cases faced these risks: ${commonRisks.join(', ')}`,
          action: 'ASSESS_RISKS'
        });
      }
    }
    
    // Based on similar cases
    if (similarCases.length > 0) {
      const avgDocs = similarCases.reduce((sum, c) => sum + c.documents.length, 0) / similarCases.length;
      if (currentCase.documents.length < avgDocs * 0.5) {
        recommendations.push({
          type: 'DOCUMENT',
          priority: 'MEDIUM',
          message: `Similar cases had an average of ${Math.round(avgDocs)} documents. Consider if you need more documentation.`,
          action: 'REVIEW_DOCUMENTS'
        });
      }
    }
    
    return recommendations;
  }
  
  // ============================================
  // IDENTIFY COMMON RISKS
  // ============================================
  
  identifyCommonRisks(cases) {
    const riskMap = {};
    
    cases.forEach(c => {
      c.risks?.forEach(risk => {
        const title = risk.title.toLowerCase();
        riskMap[title] = (riskMap[title] || 0) + 1;
      });
    });
    
    // Return risks that appear in >30% of cases
    const threshold = cases.length * 0.3;
    return Object.entries(riskMap)
      .filter(([_, count]) => count >= threshold)
      .map(([title, _]) => title)
      .slice(0, 3);
  }
  
  // ============================================
  // ESTIMATE COMPLETION DATE
  // ============================================
  
  estimateCompletionDate(currentCase) {
    // Default estimate: 30 days from now
    const estimate = new Date();
    
    // Adjust based on priority
    let daysToAdd = 30;
    
    switch (currentCase.priority) {
      case 'URGENT':
        daysToAdd = 7;
        break;
      case 'HIGH':
        daysToAdd = 14;
        break;
      case 'MEDIUM':
        daysToAdd = 30;
        break;
      case 'LOW':
        daysToAdd = 60;
        break;
    }
    
    // Adjust based on task count
    const taskCount = currentCase.tasks?.length || 0;
    daysToAdd += Math.floor(taskCount / 2);
    
    estimate.setDate(estimate.getDate() + daysToAdd);
    return estimate;
  }
  
  // ============================================
  // RISK ASSESSMENT
  // ============================================
  
  async assessCaseRisk(caseId) {
    try {
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
      
      let riskScore = 0;
      const riskFactors = [];
      
      // Factor 1: Overdue tasks
      const now = new Date();
      const overdueTasks = caseData.tasks.filter(t => 
        t.dueDate && new Date(t.dueDate) < now && t.status !== 'DONE'
      ).length;
      
      if (overdueTasks > 0) {
        riskScore += overdueTasks * 10;
        riskFactors.push(`${overdueTasks} overdue tasks`);
      }
      
      // Factor 2: No recent activity
      const recentActivity = caseData.tasks.filter(t => {
        const daysSinceUpdate = (now - new Date(t.updatedAt)) / (1000 * 60 * 60 * 24);
        return daysSinceUpdate < 7;
      }).length;
      
      if (recentActivity === 0 && caseData.status === 'IN_PROGRESS') {
        riskScore += 20;
        riskFactors.push('No activity in past 7 days');
      }
      
      // Factor 3: High-severity risks
      const criticalRisks = caseData.risks.filter(r => 
        r.severity === 'CRITICAL' && r.status !== 'RESOLVED'
      ).length;
      
      if (criticalRisks > 0) {
        riskScore += criticalRisks * 25;
        riskFactors.push(`${criticalRisks} critical unresolved risks`);
      }
      
      // Factor 4: Overdue milestones
      const overdueMilestones = caseData.milestones.filter(m =>
        new Date(m.dueDate) < now && !m.completed
      ).length;
      
      if (overdueMilestones > 0) {
        riskScore += overdueMilestones * 15;
        riskFactors.push(`${overdueMilestones} overdue milestones`);
      }
      
      // Factor 5: Insufficient documentation
      if (caseData.documents.length < 3 && caseData.status !== 'OPEN') {
        riskScore += 10;
        riskFactors.push('Insufficient documentation');
      }
      
      // Normalize risk score (0-100)
      riskScore = Math.min(100, riskScore);
      
      // Update case
      await prisma.case.update({
        where: { id: caseId },
        data: { aiRiskScore: riskScore }
      });
      
      // Save AI interaction
      await prisma.aIInteraction.create({
        data: {
          type: 'RISK_ASSESSMENT',
          prompt: `Assess risk for case ${caseData.caseNumber}`,
          response: JSON.stringify({ riskScore, riskFactors }),
          confidence: 0.85,
          userId: caseData.leadId,
          caseId: caseId
        }
      });
      
      return {
        riskScore,
        riskLevel: this.getRiskLevel(riskScore),
        riskFactors,
        recommendations: this.getRiskRecommendations(riskScore, riskFactors)
      };
      
    } catch (error) {
      console.error('Risk Assessment Error:', error);
      throw error;
    }
  }
  
  getRiskLevel(score) {
    if (score >= 75) return 'CRITICAL';
    if (score >= 50) return 'HIGH';
    if (score >= 25) return 'MEDIUM';
    return 'LOW';
  }
  
  getRiskRecommendations(score, factors) {
    const recommendations = [];
    
    if (factors.some(f => f.includes('overdue tasks'))) {
      recommendations.push('Review and update task deadlines');
      recommendations.push('Reassign tasks if needed');
    }
    
    if (factors.some(f => f.includes('No activity'))) {
      recommendations.push('Schedule a case review meeting');
      recommendations.push('Update case status');
    }
    
    if (factors.some(f => f.includes('critical'))) {
      recommendations.push('Address critical risks immediately');
      recommendations.push('Create mitigation plans');
    }
    
    if (factors.some(f => f.includes('milestones'))) {
      recommendations.push('Revise milestone timeline');
      recommendations.push('Allocate more resources');
    }
    
    if (factors.some(f => f.includes('documentation'))) {
      recommendations.push('Upload missing documents');
      recommendations.push('Request documents from client');
    }
    
    return recommendations;
  }
  
  // ============================================
  // GENERATE CASE SUMMARY
  // ============================================
  
  async generateCaseSummary(caseId) {
    try {
      const caseData = await prisma.case.findUnique({
        where: { id: caseId },
        include: {
          client: true,
          lead: true,
          tasks: true,
          documents: true,
          timeEntries: true,
          milestones: true,
          risks: true,
          activities: { take: 10, orderBy: { createdAt: 'desc' } }
        }
      });
      
      const totalHours = caseData.timeEntries.reduce((sum, t) => sum + t.hours, 0);
      const completedTasks = caseData.tasks.filter(t => t.status === 'DONE').length;
      const completedMilestones = caseData.milestones.filter(m => m.completed).length;
      
      const summary = {
        caseNumber: caseData.caseNumber,
        title: caseData.title,
        status: caseData.status,
        priority: caseData.priority,
        client: caseData.client.name,
        lead: `${caseData.lead.firstName} ${caseData.lead.lastName}`,
        
        progress: {
          tasksCompleted: `${completedTasks}/${caseData.tasks.length}`,
          milestonesCompleted: `${completedMilestones}/${caseData.milestones.length}`,
          documentsUploaded: caseData.documents.length,
          hoursLogged: totalHours
        },
        
        timeline: {
          created: caseData.createdAt,
          lastUpdated: caseData.updatedAt,
          estimatedCompletion: caseData.estimatedCompletionDate
        },
        
        aiInsights: {
          predictedOutcome: caseData.aiPredictedOutcome,
          confidence: caseData.aiConfidenceScore,
          riskScore: caseData.aiRiskScore
        },
        
        recentActivity: caseData.activities.map(a => ({
          type: a.type,
          description: a.description,
          date: a.createdAt
        }))
      };
      
      // Save AI interaction
      await prisma.aIInteraction.create({
        data: {
          type: 'SUMMARY',
          prompt: `Generate summary for case ${caseData.caseNumber}`,
          response: JSON.stringify(summary),
          confidence: 1.0,
          userId: caseData.leadId,
          caseId: caseId
        }
      });
      
      return summary;
      
    } catch (error) {
      console.error('Summary Generation Error:', error);
      throw error;
    }
  }
  
  // ============================================
  // SMART RECOMMENDATIONS
  // ============================================
  
  async getSmartRecommendations(userId, firmId) {
    try {
      // Get user's active cases
      const userCases = await prisma.case.findMany({
        where: {
          firmId,
          OR: [
            { leadId: userId },
            { members: { some: { userId } } }
          ],
          status: { in: ['OPEN', 'IN_PROGRESS'] }
        },
        include: {
          tasks: true,
          milestones: true
        }
      });
      
      const recommendations = [];
      
      // Check for overdue items
      const now = new Date();
      userCases.forEach(c => {
        const overdueTasks = c.tasks.filter(t => 
          t.dueDate && new Date(t.dueDate) < now && t.status !== 'DONE'
        );
        
        if (overdueTasks.length > 0) {
          recommendations.push({
            type: 'URGENT',
            caseId: c.id,
            caseNumber: c.caseNumber,
            message: `${overdueTasks.length} overdue tasks in case ${c.caseNumber}`,
            action: 'REVIEW_TASKS',
            priority: 'HIGH'
          });
        }
      });
      
      // Check for cases with no recent activity
      userCases.forEach(c => {
        const daysSinceUpdate = (now - new Date(c.updatedAt)) / (1000 * 60 * 60 * 24);
        if (daysSinceUpdate > 7) {
          recommendations.push({
            type: 'ATTENTION',
            caseId: c.id,
            caseNumber: c.caseNumber,
            message: `No activity in ${Math.round(daysSinceUpdate)} days for case ${c.caseNumber}`,
            action: 'UPDATE_CASE',
            priority: 'MEDIUM'
          });
        }
      });
      
      // Check for upcoming milestones
      userCases.forEach(c => {
        const upcomingMilestones = c.milestones.filter(m => {
          const daysUntilDue = (new Date(m.dueDate) - now) / (1000 * 60 * 60 * 24);
          return daysUntilDue > 0 && daysUntilDue <= 7 && !m.completed;
        });
        
        if (upcomingMilestones.length > 0) {
          recommendations.push({
            type: 'REMINDER',
            caseId: c.id,
            caseNumber: c.caseNumber,
            message: `${upcomingMilestones.length} milestones due this week in case ${c.caseNumber}`,
            action: 'REVIEW_MILESTONES',
            priority: 'MEDIUM'
          });
        }
      });
      
      return recommendations.sort((a, b) => {
        const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
      
    } catch (error) {
      console.error('Smart Recommendations Error:', error);
      throw error;
    }
  }
}

module.exports = new AIService();
