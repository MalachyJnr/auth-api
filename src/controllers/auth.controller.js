const { registerSchema, loginSchema } = require("../validators/auth.validator");
const {
  registerUser,
  loginUser,
  findRefreshToken,
} = require("../services/auth.service");
const {
  setAccessTokenCookie,
  setRefreshTokenCookie,
} = require("../utils/cookies");

const { generateAccessToken } = require("../utils/jwt");
const z = require("zod");

const register = async (req, res) => {
  try {
    const result = registerSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: z.flattenError(result.error).fieldErrors,
      });
    }

    const user = await registerUser(result.data);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: user,
    });
  } catch (error) {
    console.error(error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : "Internal server error",
    });
  }
};

const login = async (req, res) => {
  try {
    const result = loginSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: z.flattenError(result.error).fieldErrors,
      });
    }

    const loginResult = await loginUser(result.data);
    console.log("user:", loginResult.user);

    setAccessTokenCookie(res, loginResult.accessToken);
    setRefreshTokenCookie(res, loginResult.refreshToken);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: { user: loginResult.user },
    });
  } catch (err) {
    console.error(err);
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.statusCode ? err.message : "Internal server error",
    });
  }
};

const refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh Token required",
      });
    }

    const storedToken = await findRefreshToken(refreshToken);

    if (!storedToken) {
      res.status(401).json({
        success: false,
        message: "Invlaid or expired refresh token",
      });
    }

    const accessToken = generateAccessToken({ id: storedToken.user_id });

    setAccessTokenCookie(res, accessToken);

    return res.status(200).json({
      success: true,
      message: "Access token refreshed succesfully",
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
module.exports = { register, login, refresh };
