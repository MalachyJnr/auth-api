const jwt = require("jsonwebtoken");

const generateAccessToken = (user) => {
  return jwt.sign({ sub: user.id }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: "15m",
  });
};

module.exports = { generateAccessToken };
