const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

// ============================================
// DOCUMENT TEMPLATES ROUTES
// ============================================

// Get user's firm
async function getUserFirm(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });
  return user.firmId;
}

// ============================================
// 1. LIST TEMPLATES
// ============================================
router.get('/', authenticateToken, async (req, res) => {
  try {
    const firmId = await getUserFirm(req.user.userId);
    if (!firmId) {
      return res.status(400).json({ error: 'No firm associated' });
    }

    const { category } = req.query;

    const templates = await prisma.template.findMany({
      where: {
        firmId,
        ...(category && { category })
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: [
        { isDefault: 'desc' },
        { name: 'asc' }
      ]
    });

    res.json({
      templates,
      count: templates.length
    });
  } catch (error) {
    console.error('List templates error:', error);
    res.status(500).json({ error: 'Failed to list templates' });
  }
});

// ============================================
// 2. GET TEMPLATE BY ID
// ============================================
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const firmId = await getUserFirm(req.user.userId);

    const template = await prisma.template.findFirst({
      where: {
        id,
        firmId
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json({ template });
  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({ error: 'Failed to get template' });
  }
});

// ============================================
// 3. CREATE TEMPLATE
// ============================================
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, category, description, content, variables } = req.body;
    const firmId = await getUserFirm(req.user.userId);

    if (!firmId) {
      return res.status(400).json({ error: 'No firm associated' });
    }

    const template = await prisma.template.create({
      data: {
        id: uuidv4(),
        firmId,
        name,
        category,
        description,
        content,
        variables: JSON.stringify(variables || []),
        isDefault: false,
        createdBy: req.user.userId
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        id: uuidv4(),
        userId: req.user.userId,
        firmId,
        action: 'TEMPLATE_CREATED',
        entityType: 'TEMPLATE',
        entityId: template.id,
        details: `Created template: ${name}`,
        ipAddress: req.ip
      }
    });

    res.json({
      success: true,
      template,
      message: 'Template created successfully'
    });
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

// ============================================
// 4. UPDATE TEMPLATE
// ============================================
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, description, content, variables } = req.body;
    const firmId = await getUserFirm(req.user.userId);

    const template = await prisma.template.findFirst({
      where: { id, firmId }
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const updated = await prisma.template.update({
      where: { id },
      data: {
        name,
        category,
        description,
        content,
        variables: JSON.stringify(variables || [])
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        id: uuidv4(),
        userId: req.user.userId,
        firmId,
        action: 'TEMPLATE_UPDATED',
        entityType: 'TEMPLATE',
        entityId: id,
        details: `Updated template: ${name}`,
        ipAddress: req.ip
      }
    });

    res.json({
      success: true,
      template: updated,
      message: 'Template updated successfully'
    });
  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
});

// ============================================
// 5. DELETE TEMPLATE
// ============================================
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const firmId = await getUserFirm(req.user.userId);

    const template = await prisma.template.findFirst({
      where: { id, firmId }
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    if (template.isDefault) {
      return res.status(400).json({ error: 'Cannot delete default template' });
    }

    await prisma.template.delete({
      where: { id }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        id: uuidv4(),
        userId: req.user.userId,
        firmId,
        action: 'TEMPLATE_DELETED',
        entityType: 'TEMPLATE',
        entityId: id,
        details: `Deleted template: ${template.name}`,
        ipAddress: req.ip
      }
    });

    res.json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

// ============================================
// 6. GENERATE DOCUMENT FROM TEMPLATE
// ============================================
router.post('/:id/generate', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { caseId, variableValues } = req.body;
    const firmId = await getUserFirm(req.user.userId);

    // Get template
    const template = await prisma.template.findFirst({
      where: { id, firmId }
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Replace variables in content
    let content = template.content;
    const variables = JSON.parse(template.variables || '[]');

    variables.forEach(variable => {
      const value = variableValues[variable] || `{{${variable}}}`;
      const regex = new RegExp(`{{${variable}}}`, 'g');
      content = content.replace(regex, value);
    });

    // Generate filename
    const fileName = `${template.name.replace(/\s+/g, '_')}_${Date.now()}.txt`;

    // Save generated document
    const document = await prisma.generatedDocument.create({
      data: {
        id: uuidv4(),
        firmId,
        caseId: caseId || null,
        templateId: id,
        fileName,
        content,
        generatedBy: req.user.userId
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        id: uuidv4(),
        userId: req.user.userId,
        firmId,
        action: 'DOCUMENT_GENERATED',
        entityType: 'TEMPLATE',
        entityId: id,
        details: `Generated document from template: ${template.name}`,
        ipAddress: req.ip
      }
    });

    res.json({
      success: true,
      document,
      message: 'Document generated successfully'
    });
  } catch (error) {
    console.error('Generate document error:', error);
    res.status(500).json({ error: 'Failed to generate document' });
  }
});

// ============================================
// 7. LIST GENERATED DOCUMENTS
// ============================================
router.get('/generated/list', authenticateToken, async (req, res) => {
  try {
    const firmId = await getUserFirm(req.user.userId);
    const { caseId } = req.query;

    const documents = await prisma.generatedDocument.findMany({
      where: {
        firmId,
        ...(caseId && { caseId })
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            category: true
          }
        },
        generatedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        generatedAt: 'desc'
      }
    });

    res.json({
      documents,
      count: documents.length
    });
  } catch (error) {
    console.error('List generated documents error:', error);
    res.status(500).json({ error: 'Failed to list documents' });
  }
});

// ============================================
// 8. DOWNLOAD GENERATED DOCUMENT
// ============================================
router.get('/generated/:id/download', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const firmId = await getUserFirm(req.user.userId);

    const document = await prisma.generatedDocument.findFirst({
      where: { id, firmId }
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="${document.fileName}"`);
    res.send(document.content);
  } catch (error) {
    console.error('Download document error:', error);
    res.status(500).json({ error: 'Failed to download document' });
  }
});

// ============================================
// 9. SEED DEFAULT TEMPLATES (Run once)
// ============================================
router.post('/seed-defaults', authenticateToken, async (req, res) => {
  try {
    const firmId = await getUserFirm(req.user.userId);
    if (!firmId) {
      return res.status(400).json({ error: 'No firm associated' });
    }

    const defaultTemplates = [
      {
        name: 'Tax Audit Report',
        category: 'TAX_AUDIT',
        description: 'Standard tax audit report template',
        content: `TAX AUDIT REPORT

Client: {{clientName}}
Fiscal Year: {{fiscalYear}}
Audit Date: {{auditDate}}

Dear {{clientName}},

This is to certify that we have completed the tax audit for the fiscal year {{fiscalYear}}.

AUDIT FINDINGS:
{{findings}}

RECOMMENDATIONS:
{{recommendations}}

CONCLUSION:
{{conclusion}}

Prepared by: {{preparedBy}}
Date: {{date}}

Signature: _________________`,
        variables: ['clientName', 'fiscalYear', 'auditDate', 'findings', 'recommendations', 'conclusion', 'preparedBy', 'date']
      },
      {
        name: 'Financial Audit Report',
        category: 'FINANCIAL_AUDIT',
        description: 'Standard financial audit report template',
        content: `FINANCIAL AUDIT REPORT

Client: {{clientName}}
Period: {{period}}
Audit Date: {{auditDate}}

EXECUTIVE SUMMARY:
{{summary}}

FINANCIAL POSITION:
{{financialPosition}}

AUDIT OPINION:
{{opinion}}

RECOMMENDATIONS:
{{recommendations}}

Auditor: {{auditorName}}
Date: {{date}}`,
        variables: ['clientName', 'period', 'auditDate', 'summary', 'financialPosition', 'opinion', 'recommendations', 'auditorName', 'date']
      },
      {
        name: 'Compliance Checklist',
        category: 'COMPLIANCE',
        description: 'Standard compliance checklist template',
        content: `COMPLIANCE CHECKLIST

Client: {{clientName}}
Review Date: {{reviewDate}}

REGULATORY REQUIREMENTS:
☐ {{requirement1}}
☐ {{requirement2}}
☐ {{requirement3}}

DOCUMENTATION:
☐ {{document1}}
☐ {{document2}}
☐ {{document3}}

NOTES:
{{notes}}

Reviewed by: {{reviewedBy}}
Date: {{date}}`,
        variables: ['clientName', 'reviewDate', 'requirement1', 'requirement2', 'requirement3', 'document1', 'document2', 'document3', 'notes', 'reviewedBy', 'date']
      }
    ];

    const created = [];
    for (const template of defaultTemplates) {
      const existing = await prisma.template.findFirst({
        where: {
          firmId,
          name: template.name
        }
      });

      if (!existing) {
        const newTemplate = await prisma.template.create({
          data: {
            id: uuidv4(),
            firmId,
            ...template,
            variables: JSON.stringify(template.variables),
            isDefault: true,
            createdBy: req.user.userId
          }
        });
        created.push(newTemplate);
      }
    }

    res.json({
      success: true,
      created: created.length,
      message: `${created.length} default templates created`
    });
  } catch (error) {
    console.error('Seed templates error:', error);
    res.status(500).json({ error: 'Failed to seed templates' });
  }
});

module.exports = router;
