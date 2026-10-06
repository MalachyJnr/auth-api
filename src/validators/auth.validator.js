const { z } = require("zod");

const registerSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "username must be atleast 3 characters")
    .max(50, "username must not exceed 50 characters"),

  email: z
    .string()
    .email("Invalid email address")
    .transform((email) => email.toLowerCase().trim()),

  password: z.string().min(8, "Password must be atleast 8 characters"),
});

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Invalid email address")
    .transform((email) => email.toLowerCase()),

  password: z.string().min(1, "Password is required"),
});

module.exports = { registerSchema, loginSchema };
