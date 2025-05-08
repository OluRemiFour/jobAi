const express = require("express");
const route = express.Router();

const { allUsers, getUser } = require("../controller/userControl");

route.get("/", allUsers);
// route.get("/:id", getUser);
route.get("/getUser", getUser);

module.exports = route;
