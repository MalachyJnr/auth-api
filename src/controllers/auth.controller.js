const { registerSchema, loginSchema } = require("../validators/auth.validator");
const { registerUser, loginUser } = require("../services/auth.service");
const {
  setAccessTokenCookie,
  setRefreshTokenCookie,
} = require("../utils/cookies");
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

module.exports = { register, login };
