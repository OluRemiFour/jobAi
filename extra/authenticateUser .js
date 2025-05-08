const jwt = require("jsonwebtoken");

exports.authenticateUser = async (req, res, next) => {
  const token = req.headers.token; // read from custom 'token' header

  try {
    if (!token) {
      return res.status(401).json({
        status: "Fail",
        message: "User token not found",
      });
    }

    const decodedTkn = jwt.verify(token, process.env.JWT_SECRECT);
    req.user = decodedTkn;

    next();
  } catch (error) {
    return res.status(403).json({
      status: "Fail",
      message: error.message,
    });
  }
};
