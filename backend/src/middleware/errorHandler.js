function errorHandler(err, req, res, _next) {
  const isDev = process.env.NODE_ENV !== 'production';
  const status = err.status || err.statusCode || 500;

  console.error(`[${new Date().toISOString()}] ${status} — ${err.message}`);
  if (isDev) console.error(err.stack);

  res.status(status).json({
    error: err.message || 'Internal server error',
    ...(isDev && { stack: err.stack }),
  });
}

module.exports = errorHandler;
