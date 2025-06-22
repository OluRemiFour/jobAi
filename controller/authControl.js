require("dotenv").config();
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const bcryptjs = require("bcryptjs");
const sendEmail = require("../utils/sendEmail");
const User = require("../models/userModel");

const jwtToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRECT, {
    expiresIn: process.env.EXPIRE_TIME,
  });
};
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
};

const handleLogin = (user, status, msgSuccess, res) => {
  const token = jwtToken(user.id);

  const options = {
    maxAge: process.env.EXPIRE_TIME,
    httpOnly: true,
  };
  if (process.env.NODE_ENV == "production") {
    options.secure = true;
  }

  // setting jwt token in a cookie to prevent malicious users from accessing the token
  res.cookie("jwt", token, options);

  user.password = undefined;

  res.status(status).json({
    status: "success",
    message: msgSuccess || "successfully login",
    token,
  });
};

exports.signup = async (req, res, next) => {
  const { name, email, password, confirmPassword, ...restOfData } = req.body;

  try {
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({
        error: "All fields are required",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    const existingUser = await User.findOne({ email }).select("+password");

    if (existingUser && existingUser.isVerified) {
      return res.status(400).json({ error: "User already exists" });
    }

    // ✅ Attach full payload to req.userData
    req.userData = { name, email, password, ...restOfData };
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.checkUserVerification = async (req, res, next) => {
  const { email } = req.userData;

  try {
    const user = await User.findOne({ email });

    if (user && user.isVerified) {
      return res.status(400).json({ message: "User already verified" });
    }

    next(); // Proceed to sendVerificationEmail
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Middleware to check if the user is verified, if not, send OTP
exports.sendVerificationEmail = async (req, res) => {
  const { name, email, password, ...restOfData } = req.userData;

  try {
    // Create user - the pre-save hook will hash the password
    const user = await User.create({
      name,
      email,
      password, // Let the pre-save hook handle hashing
      isVerified: false,
      ...restOfData,
    });

    // Generate OTP
    const otp = generateOTP();
    const hashedOtp = await bcryptjs.hash(otp, 10);

    // Update user with OTP - use findByIdAndUpdate to avoid triggering pre-save again
    await User.findByIdAndUpdate(user._id, {
      otp: hashedOtp,
      otpExpires: Date.now() + 10 * 60 * 1000,
    });

    const message = `Your verification code is: ${otp}. It will expire in 10 minutes.`;

    await sendEmail({
      email,
      subject: "Verify Your Email",
      message,
    });

    return res.status(201).json({
      success: true,
      message: "Verification email sent",
      data: {
        email: user.email,
        needsVerification: true,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to send verification email",
      error: error.message,
    });
  }
};

exports.verifyEmailOTP = async (req, res) => {
  const { email, otp } = req.body;
  try {
    const user = await User.findOne({ email });

    // Check if the user exists and if OTP is set
    if (!user || !user.otp) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Check if the user is already verified
    if (user.isVerified) {
      return res.status(400).json({ message: "Email already verified" });
    }

    // Compare the OTP and check if it's expired
    const isMatch = await bcryptjs.compare(otp, user.otp);
    const isExpired = user.otpExpires < Date.now();

    if (!isMatch || isExpired) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Generate a JWT token for the user
    const token = jwtToken(user.id);

    // Mark the user as verified and clear OTP and expiration
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    // Send a response with the verification success message and token
    res.status(200).json({ message: "Email verified successfully", token });
  } catch (error) {
    res.status(500).json({
      status: "failed",
      message: error.message,
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "email and password fields are required" });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await user.comparePasswordDb(password);
    // console.log("Password comparison result:", isMatch);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid password" });
    }

    const token = jwtToken(user._id);

    // Set the token in HttpOnly cookie
    res.cookie("token", token, {
      httpOnly: true, // This makes the cookie inaccessible via JavaScript
      secure: process.env.NODE_ENV === "production", // Only set cookies over HTTPS in production
      sameSite: "Strict", // CSRF protection
      maxAge: 3600000, // Token expires in 1 hour
      path: "/", // The cookie will be sent with every request to your app
    });

    handleLogin(user, 200, "Logged in successfully", res);
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.forgotPassword = async (req, res, next) => {
  if (!req.body) {
    return res.status(400).json({
      error: "No data provided",
    });
  }
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return res.status(404).json({
      message: "User not found, Please kindly input the right user details",
    });
  }

  const resetToken = await user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  const resetUrl = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/auth/resetPassword/${resetToken}`;
  const message = `Forgot your password? We have received a reset password request, please use the link below to reset your password: ${resetUrl}.\nIf you didn't forget your password, please ignore this email!`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Password reset request received",
      message: message,
    });
    res.status(200).json({
      message: "Reset password email sent, check your inbox",
    });
  } catch (error) {
    this.resetToken = undefined;
    this.resetTokenExpiration = undefined;
    user.save({ validateBeforeSave: false });
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

exports.resetPassword = async (req, res) => {
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  try {
    const user = await User.findOne({
      resetToken: hashedToken,
      resetTokenExpiration: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        message: "Token is invalid or has expired",
      });
    }

    const { password, confirmPassword } = req.body;

    if (!password || !confirmPassword) {
      throw new Error("Password and confirmPassword fields are required");
    }

    user.password = req.body.password;
    user.confirmPassword = req.body.confirmPassword;
    user.resetToken = undefined;
    user.resetTokenExpiration = undefined;
    user.passwordChangedAt = Date.now();
    user.lastLoggedInAt = Date.now();

    await user.save();
    const token = jwtToken(user._id);
    res.status(200).json({
      message: "Password reset successfully",
      token,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to reset password",
      error: error.message,
    });
  }
};

exports.updatePassword = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("+password");
    if (!user) {
      return res.status(400).json({ message: "User not found!" });
    }

    const { oldPassword, newPassword, confirmNewPassword } = req.body;

    if (!oldPassword || !newPassword || !confirmNewPassword) {
      return res
        .status(400)
        .json({ message: "All password fields are required" });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ message: "New passwords do not match" });
    }

    const isMatch = await bcryptjs.compare(oldPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect current password" });
    }

    // Set new password
    user.password = newPassword;
    user.confirmPassword = confirmNewPassword;
    user.passwordChangedAt = Date.now();

    await user.save();

    handleLogin(user, 200, "Password updated successfully", res);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update password",
      error: error.message,
    });
  }
};

exports.protect = async (req, res, next) => {
  try {
    let token;
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader) {
      return res.status(401).json({
        message: "Authorization header not found",
      });
    }

    if (authHeader.startsWith("Bearer")) {
      token = authHeader.split(" ")[1];
    } else {
      return res.status(401).json({
        message: "Invalid authorization format",
      });
    }

    // Verify Token
    const decodedToken = jwt.verify(token, process.env.JWT_SECRECT);

    // Check if user still exist in DB
    const user = await User.findById(decodedToken.id);

    if (!user) {
      return res.status(401).json({
        status: "fail",
        message: "User no longer exist!",
      });
    }

    const passwordChange = user.isPasswordChange(decodedToken.iat);

    if (passwordChange) {
      return res.status(401).json({
        status: "fail",
        message: "Password has been changed, please login again",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Authorization error:", error.message);
    return res.status(403).json({
      status: "fail",
      message: error.message,
    });
  }
};

exports.logout = async (req, res, next) => {
  res.clearCookie("token", { path: "/" });
  res.json({ message: "Logout successful" });
};
