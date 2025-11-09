// ============================================
// 404 NOT FOUND HANDLER
// ============================================
export const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    availableRoutes: {
      auth: '/api/auth',
      orphans: '/api/orphans',
      projects: '/api/projects',
      finance: '/api/finance',
      hr: '/api/hr',
      cbo: '/api/cbo',
      partners: '/api/partners',
      meal: '/api/meal',
      upload: '/api/upload'
    }
  });
};
