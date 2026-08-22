const mongoose = require("mongoose");

/**
 * MongoDB ObjectId Validation Middleware
 * Returns safe 400 Bad Request if req.params.id is malformed
 */
const validateObjectId = (paramName = "id") => {
  return (req, res, next) => {
    const id = req.params[paramName];
    if (id && !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${paramName} format.`
      });
    }
    next();
  };
};

module.exports = validateObjectId;
