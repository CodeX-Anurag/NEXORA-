const userService = require("../services/user.service");
const authService = require("../services/auth.service");

const getMeProfile = async (req, res, next) => {
  try {
    const profile = await userService.getUserProfile(req.userId);
    return res.status(200).json({
      success: true,
      user: profile
    });
  } catch (error) {
    next(error);
  }
};

const updateMeProfile = async (req, res, next) => {
  try {
    const updatedProfile = await userService.updateUserProfile(req.userId, req.body);
    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user: updatedProfile
    });
  } catch (error) {
    next(error);
  }
};

const deleteMeAccount = async (req, res, next) => {
  try {
    const result = await userService.deleteUserAccount(req.userId);
    authService.clearRefreshCookie(res);

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMeProfile,
  updateMeProfile,
  deleteMeAccount
};
