const pool = require("../config/db");

const getUserById = async (userId) => {
  const result = await pool.query(
    `SELECT id,
    username,
    email,
    is_email_verified,
    created_at,
    updated_at
    FROM users
    WHERE id = $1`,
    [userId],
  );

  return result.rows[0] || null;
};

module.exports = { getUserById };
