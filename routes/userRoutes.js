const express = require("express");
const route = express.Router();

const { allUsers, getUser } = require("../controller/userControl");
const { authenticateUser } = require("../extra/authenticateUser ");
route.get("/", allUsers);
// route.get("/:id", getUser);
route.get("/getUser", authenticateUser, getUser);

module.exports = route;
