const appError = require("../utils/appError");
const jwt = require("jsonwebtoken");
const httpStatus = require("../utils/httpStatus");

const verifyToken = (req, res, next) => {
  const authHeader =
    req.headers["Authorization"] || req.headers["authorization"];
  if (!authHeader) {
    next(appError(`Token is required`, 401, httpStatus.FAIL));
  }
  const token = authHeader.split(" ")[1];
  try {
    const decodedUser = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.currentUser = decodedUser;
    next();
  } catch (error) {
    return next(appError(`${error}`, 401, httpStatus.ERROR));
  }
};

module.exports = verifyToken;
