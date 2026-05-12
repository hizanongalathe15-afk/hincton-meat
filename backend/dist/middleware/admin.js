"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = void 0;
const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Access denied. User not authenticated.' });
    }
    // Check if user has ADMIN role (roles is an array in the database)
    const userRoles = Array.isArray(req.user.roles) ? req.user.roles : [req.user.roles];
    if (!userRoles.includes('ADMIN')) {
        return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
    next();
};
exports.requireAdmin = requireAdmin;
//# sourceMappingURL=admin.js.map