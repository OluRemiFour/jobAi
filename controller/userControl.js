require("dotenv").config();
const User = require("../models/userModel");

exports.allUsers = async (req, res) => {
  try {
    const users = await User.find().select("-otp -otpExpires"); // Excluding otp and otpExpires
    res.status(200).json({ total: users.length, users: users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
