import { validationResult } from 'express-validator';

/**
 * Validates request using express-validator results
 * Must be called after validation chain
 */
export const validateRequest = (req, res, next) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: result.array().map((e) => e.msg).join(', '),
    });
  }
  next();
};
