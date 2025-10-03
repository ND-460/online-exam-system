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
const codeRunner = require("./routes/codeRunner");
const analytics = require("./routes/analytics");

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
app.use("/api/code", codeRunner);
app.use("/api/analytics", analytics);

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
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on ${process.env.BASE_URL}`);
});
