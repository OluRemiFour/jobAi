const express = require("express");
const route = express.Router();

const { protect } = require("../controller/authControl");
const { getAllJobs, getRecommendedJobs } = require("../controller/jobControl");


route.get("/", protect, getAllJobs);
route.get("/recommend", protect, getRecommendedJobs);

module.exports = route;
