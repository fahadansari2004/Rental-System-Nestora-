const ApiError = require('../utils/apiError');

const authorizeRoles = (...roles) => {
  const allowed = roles.map((r) => r.toLowerCase());
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }

    const userRole = (req.user.role || '').toLowerCase();
    const isOwnerAlias = (userRole === 'host' || userRole === 'owner') && allowed.some((r) => r === 'owner' || r === 'host');
    const isAdmin = userRole === 'admin' && allowed.includes('admin');
    const isRenter = userRole === 'renter' && allowed.includes('renter');

    if (!allowed.includes(userRole) && !isOwnerAlias && !isAdmin && !isRenter) {
      return next(
        new ApiError(
          403,
          `Access forbidden: Role '${req.user.role}' is not authorized to access this resource`
        )
      );
    }
    next();
  };
};

module.exports = { authorizeRoles };
