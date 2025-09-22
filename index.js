const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
// const session = require("express-session")
const passport = require("passport")
require("dotenv").config();
require("./config/passport");

const user = require("./routes/user");
const student = require("./routes/student");
const teacher = require("./routes/teacher");

//database connection
const connectMongooseDb = require("./config/db");
connectMongooseDb();
const app = express();

//middlewares
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

//routes
app.use("/api/user", user);
app.use("/api/student", student);
app.use("/api/teacher", teacher);

//passport part for google sign in
// app.use(
//   session({
//     secret: process.env.SESSION_SECRET || "secret-key",
//     resave: false,
//     saveUninitialized: true,
//   })
// );
app.use(passport.initialize());
// app.use(passport.session());

//listening to the server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is in use. Trying port ${PORT + 1}...`);
    app.listen(PORT + 1, () => {
      console.log(`Server running on port ${PORT + 1}`);
    });
  } else {
    throw err;
  }
});
