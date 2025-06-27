require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
// const rateLimit = require("express-rate-limit");
const cors = require("cors");
const path = require("path");
// const mongoSanitize = require("express-mongo-sanitize");
// const xss = require("xss-clean");

const app = express();
app.use(cookieParser());
const port = process.env.PORT || 5000;

// helmet for headers security check
app.use(helmet());

app.use(
  cors({
    origin: "*",
    // methods: ["GET", "POST", "PUT", "DELETE"],
    // allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// sanitize and remove any no sql ($) injection from malicious code
// app.use(mongoSanitize());

// set limit for requests
// let limiter = rateLimit({
//   max: 10,
//   windowMs: 60 * 60 * 1000,
//   message: "Rate limit exceeded for this application, please try again later",
// });

// app.use("/api", limiter);

const authRoute = require("./routes/authRoutes");
const userRoute = require("./routes/userRoutes");
const jobRoute = require("./routes/jobRoutes");

// remove any user xss injection from the malicious html code
// app.use(xss());

// Middlewares
app.use(express.json());
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Routes
app.use("/api/v1/auth", authRoute);
app.use("/api/v1/user", userRoute);
app.use("/api/v1/jobs", jobRoute);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// app.use(express.urlencoded({ extended: true }));

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Server is running",
  });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    status: "error",
    message: err.message || "Internal Server Error",
  });
});

app.all(/(.*)/, (req, res, next) => {
  res.status(400).json({ message: "Invalid API url" });

  next();
});

mongoose
  .connect(process.env.MONGODB_URL, {
    // useNewUrlParser: true,
    // useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

app.listen(port, () => {
  console.log(`🚀 Server is running on port ${port}`);
});
