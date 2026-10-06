const express = require("express");

const { authenticate } = require("../middlewares/auth.middleware");
const { getMe } = require("../controllers/user.controller");

const router = express.Router();

router.get("/me", authenticate, getMe);

module.exports = router;
