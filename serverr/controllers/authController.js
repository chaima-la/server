const User = require("../models/User.js"); 
const jwt = require("jsonwebtoken");

// Helper function to generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, username: user.username, role: user.role },
    process.env.JWT_SECRET || "GHFTEA56377YHKJBDKFDUDY7", 
    { expiresIn: "1d" }
  );
};
 
exports.signup = async (req, res) => {
  try {
    const { fullname, username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this username or email already exists",
      });
    }

    // Create new user
    const newUser = new User({
      fullname,
      username,
      email,
      password, 
      plan: "free",
      role: "user",
    });

    await newUser.save();

    // Generate token
    const token = generateToken(newUser);

    // Return response without password
    const userObj = newUser.toObject();
    delete userObj.password;

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: userObj,
      token,
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.signin = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user by username
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Compare passwords
    const isMatch = await user.ComparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Generate token
    const token = generateToken(user);

    // Return response without password
    const userObj = user.toObject();
    delete userObj.password;

    res.status(200).json({
      success: true,
      message: "Login successful",
      user: userObj,
      token,
    });
  } catch (error) {
    console.error("Signin error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};