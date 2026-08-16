// middleware/requireRole.js
export function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user || !req.role) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    if (!allowedRoles.includes(req.role)) {
      return res.status(403).json({ message: `Access denied for role: ${req.role}` });
    }

    next(); // ✅ Go to next middleware or controller
  };
}
