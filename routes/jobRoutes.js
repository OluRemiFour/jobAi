const express = require("express");
const route = express.Router();

const { protect } = require("../controller/authControl");
const {
  getAllJobs,
  saveJob,
  getSavedJobs,
} = require("../controller/jobControl");
const { authenticateUser } = require("../extra/authenticateUser");

// route.get("/", protect, getAllJobs);
route.get("/", authenticateUser, getAllJobs);
route.post("/saveJob", authenticateUser, saveJob);
route.get("/getSavedJobs", authenticateUser, getSavedJobs);

module.exports = route;
