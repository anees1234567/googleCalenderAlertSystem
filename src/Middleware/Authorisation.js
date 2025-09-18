export const checkAuth = (req, res, next) => {
  const publicPaths = ["/auth/login", "/auth/google/callback"];
  if (publicPaths.includes(req.path)) {
    return next();
  }
  if (!req.session.tokens) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
};