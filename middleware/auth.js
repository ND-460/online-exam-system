const jwt = require("jsonwebtoken");
require('dotenv').config()

module.exports = function (req, res, next) {
  const authHeader = req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authorization token missing" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Normalize structure
    req.user = {
      id: decoded.id || decoded.user?.id || decoded.profileID,  // always set .id
      role: decoded.role,
      profileID: decoded.profileID || null
    };

    next();
  } catch (e) {
    console.error(e);
    res.status(400).send({ message: "Invalid Token", error: e });
  }
};
