import { ApiError } from "../utils/ApiError.js";

const authorizedRole = (...role) => {
  return (req, res, next) => {
    if (!role.includes(req.user.role)) {
      throw new ApiError(403, `${req.user.role} is not allowed to access this task`);
    }
    next();
  };
};
export { authorizedRole };
