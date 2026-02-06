import * as dashboardService from '../services/dashboardService.js';

export const getStats = async (req, res, next) => {
  try {
    const stats = await dashboardService.getDashboardStats();
    const sessionsPerWeek = await dashboardService.getSessionsPerWeek();
    const subjectDistribution = await dashboardService.getSubjectDistribution();
    const teacherWorkload = await dashboardService.getTeacherWorkload();

    res.json({
      success: true,
      stats,
      sessionsPerWeek,
      subjectDistribution,
      teacherWorkload,
    });
  } catch (error) {
    next(error);
  }
};
