export const notFound = (req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
};

export const errorHandler = (error, _req, res, _next) => {
  console.error(error);
  if (error.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'File exceeds the configured size limit' });
  if (error.code === 'LIMIT_UNEXPECTED_FILE') return res.status(400).json({ error: 'Unexpected upload field' });
  res.status(error.statusCode || 500).json({ error: error.message || 'Internal server error' });
};
