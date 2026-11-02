export const healthCheck = (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'phr-backend' });
};
