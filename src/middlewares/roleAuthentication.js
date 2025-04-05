import { ApiError } from "../utils/ApiError.js";

const authorizedRole = (...role) => {
  return (req, res, next) => {
    if (!role.includes(req.user.role)) {
      throw new ErrorHandler(403, `Role ${req.user.role} is not allowed to access this task`);
    }
    next();
  };
};
export { authorizedRole };
