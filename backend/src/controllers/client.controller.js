const { PrismaClient } = require('@prisma/client');
const { validationResult } = require('express-validator');
const prisma = new PrismaClient();

/**
 * Get all clients with search and pagination
 */
const getAllClients = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      industry,
      country,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    const skip = (page - 1) * limit;

    const where = {
      firmId: req.user.firmId
    };

    // Search
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { contactName: { contains: search, mode: 'insensitive' } },
        { contactEmail: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (industry) where.industry = industry;
    if (country) where.country = country;

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          _count: {
            select: {
              cases: true,
              contacts: true
            }
          }
        },
        orderBy: { [sortBy]: sortOrder }
      }),
      prisma.client.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        clients,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get all clients error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch clients'
    });
  }
};

/**
 * Get client by ID with cases
 */
const getClientById = async (req, res) => {
  try {
    const { id } = req.params;

    const client = await prisma.client.findFirst({
      where: {
        id,
        firmId: req.user.firmId
      },
      include: {
        contacts: true,
        cases: {
          include: {
            lead: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    await req.logActivity('VIEW', 'Client', id);

    res.json({
      success: true,
      data: client
    });
  } catch (error) {
    console.error('Get client by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch client'
    });
  }
};

/**
 * Create new client
 */
const createClient = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const clientData = {
      ...req.body,
      firmId: req.user.firmId
    };

    const client = await prisma.client.create({
      data: clientData
    });

    await req.logActivity('CREATE', 'Client', client.id, {
      name: client.name
    });

    res.status(201).json({
      success: true,
      message: 'Client created successfully',
      data: client
    });
  } catch (error) {
    console.error('Create client error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create client'
    });
  }
};

/**
 * Update client
 */
const updateClient = async (req, res) => {
  try {
    const { id } = req.params;

    const existingClient = await prisma.client.findFirst({
      where: { id, firmId: req.user.firmId }
    });

    if (!existingClient) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    const client = await prisma.client.update({
      where: { id },
      data: req.body
    });

    await req.logActivity('UPDATE', 'Client', id, {
      changes: req.body
    });

    res.json({
      success: true,
      message: 'Client updated successfully',
      data: client
    });
  } catch (error) {
    console.error('Update client error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update client'
    });
  }
};

/**
 * Delete client
 */
const deleteClient = async (req, res) => {
  try {
    const { id } = req.params;

    const existingClient = await prisma.client.findFirst({
      where: { id, firmId: req.user.firmId },
      include: {
        _count: {
          select: { cases: true }
        }
      }
    });

    if (!existingClient) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    if (existingClient._count.cases > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete client with active cases'
      });
    }

    await prisma.client.delete({ where: { id } });

    await req.logActivity('DELETE', 'Client', id, {
      name: existingClient.name
    });

    res.json({
      success: true,
      message: 'Client deleted successfully'
    });
  } catch (error) {
    console.error('Delete client error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete client'
    });
  }
};

/**
 * Add contact to client
 */
const addContact = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, phone, position, isPrimary } = req.body;

    const client = await prisma.client.findFirst({
      where: { id, firmId: req.user.firmId }
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    const contact = await prisma.contact.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        position,
        isPrimary,
        clientId: id
      }
    });

    res.status(201).json({
      success: true,
      message: 'Contact added successfully',
      data: contact
    });
  } catch (error) {
    console.error('Add contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add contact'
    });
  }
};

/**
 * Update contact
 */
const updateContact = async (req, res) => {
  try {
    const { id, contactId } = req.params;

    const contact = await prisma.contact.findFirst({
      where: {
        id: contactId,
        clientId: id
      }
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    const updatedContact = await prisma.contact.update({
      where: { id: contactId },
      data: req.body
    });

    res.json({
      success: true,
      message: 'Contact updated successfully',
      data: updatedContact
    });
  } catch (error) {
    console.error('Update contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update contact'
    });
  }
};

/**
 * Delete contact
 */
const deleteContact = async (req, res) => {
  try {
    const { id, contactId } = req.params;

    const contact = await prisma.contact.findFirst({
      where: {
        id: contactId,
        clientId: id
      }
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    await prisma.contact.delete({ where: { id: contactId } });

    res.json({
      success: true,
      message: 'Contact deleted successfully'
    });
  } catch (error) {
    console.error('Delete contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete contact'
    });
  }
};

module.exports = {
  getAllClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  addContact,
  updateContact,
  deleteContact
};
