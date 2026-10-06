const { getUserById } = require("../services/user.service");

const getMe = async (req, res) => {
  try {
    const user = await getUserById(req.user.sub);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

module.exports = { getMe };