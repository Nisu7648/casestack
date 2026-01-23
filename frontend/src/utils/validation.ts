import { z } from 'zod'

/**
 * Comprehensive validation schemas for LegalStack
 * Using Zod for type-safe validation
 */

// ============================================
// COMMON VALIDATORS
// ============================================

export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')
  .toLowerCase()

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'Password must contain uppercase, lowercase, number, and special character'
  )

export const phoneSchema = z
  .string()
  .regex(/^[\d\s\-\+\(\)]+$/, 'Please enter a valid phone number')
  .optional()
  .or(z.literal(''))

export const urlSchema = z
  .string()
  .url('Please enter a valid URL')
  .optional()
  .or(z.literal(''))

export const dateSchema = z
  .date({
    required_error: 'Date is required',
    invalid_type_error: 'Please enter a valid date',
  })
  .or(z.string().transform((str) => new Date(str)))

export const futureDateSchema = dateSchema.refine(
  (date) => date > new Date(),
  'Date must be in the future'
)

// ============================================
// AUTH SCHEMAS
// ============================================

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
})

export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    firstName: z.string().min(1, 'First name is required').max(50, 'First name is too long'),
    lastName: z.string().min(1, 'Last name is required').max(50, 'Last name is too long'),
    firmName: z.string().min(1, 'Firm name is required').max(200, 'Firm name is too long'),
    country: z.string().min(2, 'Please select a country').max(2, 'Invalid country code'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export const forgotPasswordSchema = z.object({
  email: emailSchema,
})

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

// ============================================
// CASE SCHEMAS
// ============================================

export const caseStatusEnum = z.enum(['OPEN', 'IN_PROGRESS', 'CLOSED', 'ARCHIVED'], {
  errorMap: () => ({ message: 'Invalid case status' }),
})

export const casePriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'], {
  errorMap: () => ({ message: 'Invalid priority' }),
})

export const createCaseSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must be less than 200 characters'),
  
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(5000, 'Description is too long'),
  
  clientId: z.string().uuid('Please select a valid client'),
  
  status: caseStatusEnum.default('OPEN'),
  
  priority: casePriorityEnum.default('MEDIUM'),
  
  dueDate: futureDateSchema.optional(),
  
  budget: z
    .number()
    .positive('Budget must be positive')
    .max(100000000, 'Budget is too high')
    .optional(),
  
  tags: z.array(z.string()).max(10, 'Maximum 10 tags allowed').optional(),
})

export const updateCaseSchema = createCaseSchema.partial()

// ============================================
// CLIENT SCHEMAS
// ============================================

export const clientTypeEnum = z.enum(['INDIVIDUAL', 'COMPANY'], {
  errorMap: () => ({ message: 'Invalid client type' }),
})

export const createClientSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(200, 'Name is too long'),
  
  email: emailSchema,
  
  phone: phoneSchema,
  
  type: clientTypeEnum.default('INDIVIDUAL'),
  
  company: z
    .string()
    .max(200, 'Company name is too long')
    .optional()
    .or(z.literal('')),
  
  address: z
    .string()
    .max(500, 'Address is too long')
    .optional()
    .or(z.literal('')),
  
  notes: z
    .string()
    .max(2000, 'Notes are too long')
    .optional()
    .or(z.literal('')),
})

export const updateClientSchema = createClientSchema.partial()

// ============================================
// DOCUMENT SCHEMAS
// ============================================

export const uploadDocumentSchema = z.object({
  caseId: z.string().uuid('Invalid case ID'),
  
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title is too long'),
  
  description: z
    .string()
    .max(1000, 'Description is too long')
    .optional()
    .or(z.literal('')),
  
  file: z
    .instanceof(File, { message: 'Please select a file' })
    .refine((file) => file.size <= 100 * 1024 * 1024, 'File must be less than 100MB')
    .refine(
      (file) => {
        const allowedTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'image/jpeg',
          'image/png',
          'image/gif',
        ]
        return allowedTypes.includes(file.type)
      },
      'File type not supported. Allowed: PDF, DOC, DOCX, JPG, PNG, GIF'
    ),
})

// ============================================
// TASK SCHEMAS
// ============================================

export const taskStatusEnum = z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED'], {
  errorMap: () => ({ message: 'Invalid task status' }),
})

export const createTaskSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title is too long'),
  
  description: z
    .string()
    .max(2000, 'Description is too long')
    .optional()
    .or(z.literal('')),
  
  caseId: z.string().uuid('Invalid case ID').optional(),
  
  assignedTo: z.string().uuid('Invalid user ID').optional(),
  
  status: taskStatusEnum.default('TODO'),
  
  priority: casePriorityEnum.default('MEDIUM'),
  
  dueDate: futureDateSchema.optional(),
})

export const updateTaskSchema = createTaskSchema.partial()

// ============================================
// TIME ENTRY SCHEMAS
// ============================================

export const createTimeEntrySchema = z.object({
  caseId: z.string().uuid('Invalid case ID'),
  
  description: z
    .string()
    .min(5, 'Description must be at least 5 characters')
    .max(1000, 'Description is too long'),
  
  hours: z
    .number()
    .positive('Hours must be positive')
    .max(24, 'Hours cannot exceed 24 per entry'),
  
  rate: z
    .number()
    .positive('Rate must be positive')
    .max(10000, 'Rate is too high'),
  
  date: dateSchema,
  
  billable: z.boolean().default(true),
})

export const updateTimeEntrySchema = createTimeEntrySchema.partial()

// ============================================
// INVOICE SCHEMAS
// ============================================

export const invoiceStatusEnum = z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'], {
  errorMap: () => ({ message: 'Invalid invoice status' }),
})

export const createInvoiceSchema = z.object({
  caseId: z.string().uuid('Invalid case ID'),
  
  clientId: z.string().uuid('Invalid client ID'),
  
  invoiceNumber: z
    .string()
    .min(1, 'Invoice number is required')
    .max(50, 'Invoice number is too long'),
  
  issueDate: dateSchema,
  
  dueDate: futureDateSchema,
  
  items: z
    .array(
      z.object({
        description: z.string().min(1, 'Description is required'),
        quantity: z.number().positive('Quantity must be positive'),
        rate: z.number().positive('Rate must be positive'),
      })
    )
    .min(1, 'At least one item is required'),
  
  notes: z.string().max(2000, 'Notes are too long').optional(),
  
  status: invoiceStatusEnum.default('DRAFT'),
})

export const updateInvoiceSchema = createInvoiceSchema.partial()

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Validate data against a schema and return errors
 */
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown) {
  const result = schema.safeParse(data)
  
  if (result.success) {
    return { success: true, data: result.data, errors: null }
  }
  
  const errors: Record<string, string> = {}
  result.error.errors.forEach((err) => {
    const path = err.path.join('.')
    errors[path] = err.message
  })
  
  return { success: false, data: null, errors }
}

/**
 * Get first error message from validation errors
 */
export function getFirstError(errors: Record<string, string> | null): string | null {
  if (!errors) return null
  const firstKey = Object.keys(errors)[0]
  return errors[firstKey] || null
}

export default {
  // Auth
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  
  // Cases
  createCaseSchema,
  updateCaseSchema,
  
  // Clients
  createClientSchema,
  updateClientSchema,
  
  // Documents
  uploadDocumentSchema,
  
  // Tasks
  createTaskSchema,
  updateTaskSchema,
  
  // Time entries
  createTimeEntrySchema,
  updateTimeEntrySchema,
  
  // Invoices
  createInvoiceSchema,
  updateInvoiceSchema,
  
  // Helpers
  validateData,
  getFirstError,
}
