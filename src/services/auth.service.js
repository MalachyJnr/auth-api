const bcrypt = require("bcrypt");
const pool = require("../config/db");
const { generateAccessToken } = require("../utils/jwt");
const {
  generateRefreshToken,
  hashRefreshToken,
} = require("../utils/refresh-token");

// REGISTER USER
const registerUser = async ({ username, email, password }) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    //check if user exists
    const existingUser = await client.query(
      `SELECT id FROM users
      WHERE email = $1 OR username = $2`,
      [email, username],
    );

    if (existingUser.rows.length > 0) {
      const error = new Error("User already exists");
      error.statusCode = 409;
      throw error;
    }

    //hash pasword if user is new
    const passwordHash = await bcrypt.hash(password, 12);

    //imsert new user into the database
    const userResult = await client.query(
      `INSERT INTO users (username, email, password_hash)
      VALUES($1, $2, $3)
      RETURNING
      id, username, email, is_email_verified, created_at`,
      [username, email, passwordHash],
    );

    const user = userResult.rows[0];

    const roleResult = await client.query(
      `SELECT id FROM roles
      WHERE name = $1`,
      ["user"],
    );

    if (roleResult.rows.length === 0) {
      const error = new Error("Default user role does not exist");
      error.statusCode = 500;
      throw error;
    }

    const roleId = roleResult.rows[0].id;

    await client.query(
      `INSERT INTO user_roles(user_id, role_id)
      VALUES($1, $2)`,
      [user.id, roleId],
    );

    await client.query("COMMIT");

    return user;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

//LOGIN USER

const loginUser = async ({ email, password }) => {
  const result = await pool.query(
    `
    SELECT id, username, email, password_hash,
    is_email_verified, failed_login_attempts,
    locked_until
    FROM users
    WHERE email = $1
    `,
    [email],
  );

  if (result.rows.length === 0) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  const user = result.rows[0];

  //check account lock status
  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    const error = new Error(
      "Account is temporarily locked. Please try again later",
    );

    error.statusCode = 423;

    throw error;
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash);

  if (!passwordMatches) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  // reset failed attempts on successful login
  await pool.query(
    `UPDATE users
     SET
        failed_login_attempts = 0,
        locked_until = NULL,
        updated_at = NOW()
     WHERE id = $1`,
    [user.id],
  );

  const accessToken = generateAccessToken(user);
  const refreshToken = await createRefreshToken(user.id);

  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      isEmailVerified: user.is_email_verified,
    },
    accessToken,
    refreshToken,
  };
};

// CREATE AND STORE REFRESH TOKEN

const createRefreshToken = async (userId) => {
  const token = generateRefreshToken();

  const tokenHash = hashRefreshToken(token);

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await pool.query(
    `INSERT INTO refresh_tokens
     (user_id, token_hash, expires_at)
    VALUES($1, $2, $3)`,
    [userId, tokenHash, expiresAt],
  );

  return token;
};

//

module.exports = { registerUser, loginUser, createRefreshToken };
