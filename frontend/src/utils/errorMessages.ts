/**
 * User-friendly error messages
 * Converts technical errors into human-readable messages
 */

export const errorMessages = {
  // Network errors
  ERR_NETWORK: 'Unable to connect to the server. Please check your internet connection and try again.',
  ERR_TIMEOUT: 'The request took too long. Please try again.',
  ERR_CONNECTION_REFUSED: 'Could not connect to the server. Please try again later.',
  
  // Authentication errors
  INVALID_CREDENTIALS: 'The email or password you entered is incorrect. Please try again.',
  TOKEN_EXPIRED: 'Your session has expired. Please log in again.',
  UNAUTHORIZED: 'You don\'t have permission to perform this action.',
  FORBIDDEN: 'Access denied. You don\'t have the required permissions.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again to continue.',
  
  // Validation errors
  REQUIRED_FIELD: 'This field is required.',
  INVALID_EMAIL: 'Please enter a valid email address.',
  INVALID_PHONE: 'Please enter a valid phone number.',
  PASSWORD_TOO_SHORT: 'Password must be at least 8 characters long.',
  PASSWORD_WEAK: 'Password must contain uppercase, lowercase, number, and special character.',
  PASSWORDS_DONT_MATCH: 'Passwords do not match.',
  INVALID_DATE: 'Please enter a valid date.',
  INVALID_FORMAT: 'The format is invalid. Please check your input.',
  
  // Business logic errors
  DUPLICATE_EMAIL: 'An account with this email already exists.',
  DUPLICATE_ENTRY: 'This item already exists.',
  CASE_NOT_FOUND: 'Case not found. It may have been deleted.',
  CLIENT_NOT_FOUND: 'Client not found. It may have been deleted.',
  DOCUMENT_NOT_FOUND: 'Document not found. It may have been deleted.',
  USER_NOT_FOUND: 'User not found.',
  RESOURCE_NOT_FOUND: 'The requested resource was not found.',
  
  // File upload errors
  FILE_TOO_LARGE: 'File is too large. Maximum size is 100MB.',
  INVALID_FILE_TYPE: 'This file type is not supported.',
  UPLOAD_FAILED: 'File upload failed. Please try again.',
  
  // Payment errors
  PAYMENT_FAILED: 'Payment failed. Please check your payment details and try again.',
  CARD_DECLINED: 'Your card was declined. Please try a different payment method.',
  INSUFFICIENT_FUNDS: 'Insufficient funds. Please try a different payment method.',
  SUBSCRIPTION_EXPIRED: 'Your subscription has expired. Please renew to continue.',
  
  // Rate limiting
  TOO_MANY_REQUESTS: 'Too many requests. Please slow down and try again in a few moments.',
  RATE_LIMIT_EXCEEDED: 'You\'ve made too many requests. Please wait a moment and try again.',
  
  // Server errors
  INTERNAL_SERVER_ERROR: 'Something went wrong on our end. We\'ve been notified and are working on it.',
  SERVICE_UNAVAILABLE: 'The service is temporarily unavailable. Please try again later.',
  DATABASE_ERROR: 'A database error occurred. Please try again.',
  
  // Generic fallback
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
  SOMETHING_WENT_WRONG: 'Something went wrong. Please try again or contact support if the problem persists.',
}

/**
 * Get user-friendly error message from error code or message
 */
export function getErrorMessage(error: any): string {
  // If error is a string, check if it matches a known error code
  if (typeof error === 'string') {
    return errorMessages[error as keyof typeof errorMessages] || error
  }

  // If error is an object with a message
  if (error?.message) {
    const errorCode = error.code || error.message
    return errorMessages[errorCode as keyof typeof errorMessages] || error.message
  }

  // If error is an Axios error
  if (error?.response) {
    const status = error.response.status
    const message = error.response.data?.message
    const code = error.response.data?.code

    // Check for specific error code first
    if (code && errorMessages[code as keyof typeof errorMessages]) {
      return errorMessages[code as keyof typeof errorMessages]
    }

    // Check for message match
    if (message && errorMessages[message as keyof typeof errorMessages]) {
      return errorMessages[message as keyof typeof errorMessages]
    }

    // Handle by HTTP status code
    switch (status) {
      case 400:
        return message || 'Invalid request. Please check your input and try again.'
      case 401:
        return errorMessages.UNAUTHORIZED
      case 403:
        return errorMessages.FORBIDDEN
      case 404:
        return errorMessages.RESOURCE_NOT_FOUND
      case 409:
        return message || errorMessages.DUPLICATE_ENTRY
      case 422:
        return message || 'Validation failed. Please check your input.'
      case 429:
        return errorMessages.TOO_MANY_REQUESTS
      case 500:
        return errorMessages.INTERNAL_SERVER_ERROR
      case 503:
        return errorMessages.SERVICE_UNAVAILABLE
      default:
        return message || errorMessages.UNKNOWN_ERROR
    }
  }

  // If error is a network error
  if (error?.request && !error?.response) {
    return errorMessages.ERR_NETWORK
  }

  // Fallback
  return errorMessages.UNKNOWN_ERROR
}

/**
 * Get error title based on error type
 */
export function getErrorTitle(error: any): string {
  if (error?.response) {
    const status = error.response.status
    
    switch (status) {
      case 400:
        return 'Invalid Request'
      case 401:
        return 'Authentication Required'
      case 403:
        return 'Access Denied'
      case 404:
        return 'Not Found'
      case 409:
        return 'Conflict'
      case 422:
        return 'Validation Error'
      case 429:
        return 'Too Many Requests'
      case 500:
        return 'Server Error'
      case 503:
        return 'Service Unavailable'
      default:
        return 'Error'
    }
  }

  if (error?.request && !error?.response) {
    return 'Connection Error'
  }

  return 'Error'
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: any): boolean {
  return error?.request && !error?.response
}

/**
 * Check if error is an authentication error
 */
export function isAuthError(error: any): boolean {
  return error?.response?.status === 401 || error?.response?.status === 403
}

/**
 * Check if error is a validation error
 */
export function isValidationError(error: any): boolean {
  return error?.response?.status === 422 || error?.response?.status === 400
}

/**
 * Check if error is a server error
 */
export function isServerError(error: any): boolean {
  const status = error?.response?.status
  return status >= 500 && status < 600
}

export default {
  errorMessages,
  getErrorMessage,
  getErrorTitle,
  isNetworkError,
  isAuthError,
  isValidationError,
  isServerError,
}
