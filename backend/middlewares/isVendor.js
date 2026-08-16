// middlewares/isVendor.js
export function isVendor(req, res, next) {
    if (!req.role || req.role !== 'vendor') {
        return res.status(403).json({ 
            success: false,
            message: 'Access denied. Vendor role required.' 
        });
    }
    next();
}