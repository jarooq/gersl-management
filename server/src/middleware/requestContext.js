import { AsyncLocalStorage } from 'node:async_hooks';

// AsyncLocalStorage lets Sequelize hooks read req.user / req.ip without
// having to pass them through every controller.
const als = new AsyncLocalStorage();

export const requestContextMiddleware = (req, res, next) => {
  const ctx = {
    userId: req.user?.id ?? null,
    userRole: req.user?.role ?? null,
    ip: req.ip,
    userAgent: req.headers['user-agent']?.slice(0, 500) ?? null,
    method: req.method,
    path: req.originalUrl
  };
  als.run(ctx, () => next());
};

export const getRequestContext = () => als.getStore() || {};
