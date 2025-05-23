require("dotenv").config();
const jwt = require("jsonwebtoken");
const path = require("path");
const User = require("../models/userModel");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

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
    // let token;
    // const authHeader = req.headers.authorization || req.headers.Authorization;
    // if (!authHeader) {
    //   return res.status(404).json({ message: "Authorization not found" });
    // }

    // if (authHeader.startsWith("Bearer")) {
    //   token = authHeader.split(" ")[1];
    // } else {
    //   return res.status(401).json({
    //     message: "Invalid authorization format",
    //   });
    // }
    const userId = req.user.id;
    // const decodedToken = jwt.verify(userToken, process.env.JWT_SECRECT);

    const user = await User.findById(userId);
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

exports.uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "No file uploaded",
      });
    }
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }
    user.profilePicture = req.file.path;
    // user.profilePicture = req.file.filename; // Save the file path to the user's profilePicture field
    await user.save();

    res.status(200).json({
      message: "Profile picture uploaded successfully",
      profilePic: user.profilePicture,
      // profilePicture: req.file.path,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// exports.getProfilePicture = async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({
//         message: "User not found",
//       });
//     }
//     const profilePicturePath = path.join(__dirname, "../", user.profilePicture);
//     const filename = path.basename(user.profilePicture);
//     if (!profilePicturePath) {
//       return res.status(404).json({
//         message: "Profile picture not found",
//       });
//     }
//     res.status(200).json({
//       statusCode: "007",
//       message: "Profile picture retrieved successfully",
//       // profilePicture: filename,
//       // profilePicture: path.basename(user.profilePicture),
//       // profilePicture: user.profilePicture,
//       // profilePicture: profilePicturePath,
//     });
//     // res.sendFile(profilePicturePath);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

exports.getProfilePicture = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.profilePicture) {
      return res.status(404).json({ message: "Profile picture not found" });
    }

    const filePath = path.join(__dirname, "..", "uploads", user.profilePicture);
    res.sendFile(filePath);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
