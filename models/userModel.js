const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const validator = require("validator");
const crypto = require("crypto");
const { type } = require("os");

const userModel = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 50,
    required: true,
  },
  email: {
    type: String,
    required: true,
    validate: [validator.isEmail, "Invalid email format"],
    unique: true,
  },
  password: {
    type: String,
    select: false,
    required: true,
    minlength: 8,
    validate: [
      (password) =>
        /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}/.test(
          password
        ),
      "Password must contain at least 8 characters, including uppercase and lowercase letters, numbers, and special characters",
    ],
  },
  confirmPassword: {
    type: String,
    validate: {
      validator: function (value) {
        return value === this.password;
      },
      message: "Passwords do not match",
    },
  },

  isVerified: {
    type: Boolean,
    require: true,
    default: false,
  },
  otp: String,
  otpExpires: Date,

  jobTitle: {
    type: String,
    required: true,
  },
  yearsOfExperience: {
    type: String,
    required: true,
    min: 0,
  },
  industry: {
    type: String,
    required: true,
  },
  skills: {
    type: [String],
    required: true,
  },
  summary: {
    type: String,
    required: true,
    minlength: 10,
    maxlength: 500,
  },

  passwordChangedAt: {
    type: Date,
    default: Date.now(),
    select: false,
  },
  lastLoggedInAt: {
    type: Date,
    default: Date.now(),
  },
  resetToken: String,
  resetTokenExpiration: Date,
});

userModel.pre("save", async function (next) {
  if (!this.isModified("password") && !this.isModified("confirmPassword")) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 12);
  this.confirmPassword = undefined;

  next();
});

userModel.methods.comparePasswordDb = async (DbPassword, userInputPassword) => {
  return await bcrypt.compare(DbPassword, userInputPassword);
};

userModel.methods.isPasswordChange = (JWTTimestamp) => {
  if (this.passwordChangedAt) {
    const changeTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changeTimestamp;
  }
  return false;
};

userModel.methods.createPasswordResetToken = async function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.resetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.resetTokenExpiration = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

const User = mongoose.model("User", userModel);
module.exports = User;
