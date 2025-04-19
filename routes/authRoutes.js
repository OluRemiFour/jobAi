const express = require("express");
const route = express.Router();

const {
  login,
  signup,
  protect,
  resetPassword,
  updatePassword,
  forgotPassword,
  verifyEmailOTP,
  sendVerificationEmail,
  checkUserVerification,
} = require("../controller/authControl");

route.post("/signup", signup, checkUserVerification, sendVerificationEmail);
route.post("/verifyEmail", verifyEmailOTP);
route.post("/login", login);
route.post("/forgotPassword", forgotPassword);
route.post("/resetPassword/:token", resetPassword);
route.patch("/updatePassword", protect, updatePassword);

module.exports = route;
