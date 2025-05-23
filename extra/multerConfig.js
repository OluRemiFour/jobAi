const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Create absolute path to the 'uploads' directory
const uploadDir = path.join(__dirname, "..", "uploads");

// Ensure the directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },

  filename: function (req, file, cb) {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

module.exports = upload;


// ------------------------------------------------------
// const multer = require("multer");
// const path = require("path");
// const fs = require("fs");

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     const dir = "uploads/profilePicture/";
//     if (!fs.existsSync(dir)) {
//       fs.mkdirSync(dir, { recursive: true });
//     }
//     cb(null, dir);
//   },
//   filename: function (req, file, cb) {
//     cb(null, `${Date.now()}-${file.originalname}`);
//   },
// });

// const fileFilter = (req, file, cb) => {
//   const allowedType = /jpeg|jpg|png|gif/;
//   const extname = allowedType.test(
//     path.extname(file.originalname).toLowerCase()
//   );
//   const mimetype = allowedType.test(file.mimetype);

//   if (extname && mimetype) {
//     cb(null, true);
//   } else {
//     cb(new Error("Only .jpeg, .jpg, .png, .gif files are allowed"));
//   }
// };

// // Multer Upload Middleware
// const upload = multer({
//   storage,
//   fileFilter,
//   limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max file size
// });
// module.exports = upload;

// ---------------------------------------------------------
