const express = require("express");
const route = express.Router();

const {
  allUsers,
  getUser,
  getProfilePicture,
  uploadProfilePicture,
} = require("../controller/userControl");
const upload = require("../extra/multerConfig");
const { authenticateUser } = require("../extra/authenticateUser");

route.get("/", allUsers);
// route.get("/:id", getUser);
route.get("/getUser", authenticateUser, getUser);
route.post(
  "/upload-profile-picture",
  authenticateUser,
  upload.single("profilePicture"),
  uploadProfilePicture
);
route.get("/get-profile-picture", authenticateUser, getProfilePicture);

module.exports = route;
