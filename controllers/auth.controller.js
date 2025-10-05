import jwt from "jsonwebtoken";
import User from "../models/User.model.js";
 
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!email || !password)
      return res.status(400).json({
        error: { code: "FIELD_REQUIRED", field: "email", message: "Email & password required" },
      });

    const userExists = await User.findOne({ email });
    if (userExists)
      return res.status(400).json({
        error: { code: "USER_EXISTS", message: "User already registered" },
      });

    const user = await User.create({ name, email, password, role });
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ error: { code: "SERVER_ERROR", message: err.message } });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({
        error: { code: "INVALID_CREDENTIALS", message: "Email or password incorrect" },
      });
    }
  } catch (err) {
    res.status(500).json({ error: { code: "SERVER_ERROR", message: err.message } });
  }
};

export const seedAdmin = async () => {
  const existing = await User.findOne({ email: "admin@mail.com" });
  if (!existing) {
    await User.create({
      name: "Admin",
      email: "admin@mail.com",
      password: "admin123",
      role: "admin",
    });
    console.log("✅ Seeded admin: admin@mail.com / admin123");
  }
};