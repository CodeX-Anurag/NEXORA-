const authService = require("../services/auth.service");

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const { user, accessToken, rawRefreshToken } = await authService.register({ name, email, password });
    
    authService.setRefreshCookie(res, rawRefreshToken);

    return res.status(201).json({
      success: true,
      message: "Registration successful.",
      user,
      accessToken
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { user, accessToken, rawRefreshToken } = await authService.login({ email, password });
    
    authService.setRefreshCookie(res, rawRefreshToken);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      user,
      accessToken
    });
  } catch (error) {
    next(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    const rawRefreshToken = req.cookies[authService.REFRESH_COOKIE_NAME];
    const { user, accessToken, rawRefreshToken: newRefreshToken } = await authService.refreshSession(rawRefreshToken);
    
    authService.setRefreshCookie(res, newRefreshToken);

    return res.status(200).json({
      success: true,
      user,
      accessToken
    });
  } catch (error) {
    authService.clearRefreshCookie(res);
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const rawRefreshToken = req.cookies[authService.REFRESH_COOKIE_NAME];
    await authService.logout(rawRefreshToken);
    authService.clearRefreshCookie(res);

    return res.status(200).json({
      success: true,
      message: "Logged out successfully."
    });
  } catch (error) {
    authService.clearRefreshCookie(res);
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role || "student",
      education: req.user.education,
      preferences: req.user.preferences,
      careerGoal: req.user.careerGoal,
      createdAt: req.user.createdAt
    };

    return res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  getMe
};
