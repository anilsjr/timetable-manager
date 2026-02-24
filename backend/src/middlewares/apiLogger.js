import logger from '../utils/logger.js';

/**
 * Middleware to log API calls for debugging purposes
 */
export function apiLogger(req, res, next) {
  const start = Date.now();
  const startTime = new Date().toISOString();
  
  // Generate unique request ID for tracking
  const requestId = Math.random().toString(36).substring(2, 15);
  req.requestId = requestId;
  
  // Log incoming request
  const requestInfo = {
    requestId,
    method: req.method,
    url: req.url,
    originalUrl: req.originalUrl,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    headers: {
      authorization: req.headers.authorization ? '[REDACTED]' : undefined,
      'content-type': req.headers['content-type'],
      'accept': req.headers.accept,
      'origin': req.headers.origin
    },
    query: req.query,
    params: req.params,
    body: req.method !== 'GET' ? sanitizeBody(req.body) : undefined,
    timestamp: startTime
  };

  logger.debug('API Request:', requestInfo);

  // Capture original res.json and res.send
  const originalJson = res.json;
  const originalSend = res.send;
  let responseBody;

  res.json = function(body) {
    responseBody = body;
    return originalJson.call(this, body);
  };

  res.send = function(body) {
    if (!responseBody) {
      responseBody = body;
    }
    return originalSend.call(this, body);
  };

  // Log response when request finishes
  const logResponse = () => {
    const duration = Date.now() - start;
    const responseInfo = {
      requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      statusMessage: res.statusMessage,
      duration: `${duration}ms`,
      responseSize: res.get('content-length') || 'unknown',
      response: sanitizeResponse(responseBody, res.statusCode),
      timestamp: new Date().toISOString()
    };

    if (res.statusCode >= 400) {
      logger.warn('API Response (Error):', responseInfo);
    } else {
      logger.debug('API Response:', responseInfo);
    }
  };

  res.on('finish', logResponse);
  res.on('close', logResponse);

  next();
}

/**
 * Sanitize request body to remove sensitive information
 */
function sanitizeBody(body) {
  if (!body) return undefined;
  
  const sanitized = { ...body };
  
  // Remove sensitive fields
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'auth'];
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  return sanitized;
}

/**
 * Sanitize response to prevent logging sensitive data
 */
function sanitizeResponse(response, statusCode) {
  // Don't log response body for non-debug scenarios or large responses
  if (!response) return undefined;
  
  // For error responses, include error details
  if (statusCode >= 400) {
    if (typeof response === 'string') {
      return { message: response };
    }
    return {
      success: response.success,
      message: response.message,
      error: response.error
    };
  }
  
  // For success responses, just include basic structure
  if (typeof response === 'string') {
    return { size: response.length, type: 'string' };
  }
  
  if (Array.isArray(response)) {
    return { type: 'array', length: response.length };
  }
  
  if (typeof response === 'object') {
    return {
      success: response.success,
      message: response.message,
      dataType: Array.isArray(response.data) ? 'array' : typeof response.data,
      dataLength: Array.isArray(response.data) ? response.data.length : undefined
    };
  }
  
  return { type: typeof response };
}

export default apiLogger;