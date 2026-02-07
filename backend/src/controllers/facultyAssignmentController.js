import * as facultyAssignmentService from '../services/facultyAssignmentService.js';

export const getByClass = async (req, res, next) => {
  try {
    const data = await facultyAssignmentService.getFacultyAssignmentsByClass(req.params.classId);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
