const mongoose = require("mongoose");

const jobModal = new mongoose.Schema({
  title: String,
  company: String,
  contract_type: {
    type: String,
  },
  description: {
    type: String,
  },
  salary: {
    type: String,
  },
  score: Number,
  redirect_url: String,
  postedAt: String,

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

const Job = mongoose.model("SaveJob", jobModal);
module.exports = Job;
