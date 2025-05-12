const mongoose = require("mongoose");

const jobModal = new mongoose.Schema({
  title: String,
  company: String,
  location: {
    type: String,
  },
  description: {
    type: String,
  },
  url: {
    type: String,
  },
  source: String,
  salary: String,
  postedAt: String,

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

const Job = mongoose.model("SaveJob", jobModal);
module.exports = Job;
