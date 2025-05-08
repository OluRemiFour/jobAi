require("dotenv").config();
const jwt = require("jsonwebtoken");
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
    // const user = await User.findById(req.params.id);
    let token;
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader) {
      return res.status(404).json({ message: "Authorization not found" });
    }

    if (authHeader.startsWith("Bearer")) {
      token = authHeader.split(" ")[1];
    } else {
      return res.status(401).json({
        message: "Invalid authorization format",
      });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRECT);

    const user = await User.findById(decodedToken.id);
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
