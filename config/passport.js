const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const { OAuth2Client } = require("google-auth-library");
const bcrypt = require("bcryptjs");
const User = require("../model/User");
const generateRandomPassword = require("../utils/randomPass");
const Teacher = require("../model/Teacher");
const Student = require("../model/Student");
require("dotenv").config();

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BASE_URL}/api/user/oauth2/redirect/google`,
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        console.log("Google Profile received:", profile);

        const email = profile.emails[0].value;
        let user = await User.findOne({ email });

        const roleFromFrontend = req.query.state || "student";

        if (!user) {
          console.log("Creating new user for:", email);
          user = await User.create({
            firstName: profile.name.givenName || "NoFirst",
            lastName: profile.name.familyName || "NoLast",
            phone: "N/A", 
            email,
            password: await bcrypt.hash(Math.random().toString(36).slice(-8), 10),
            role: roleFromFrontend, 
          });
          if(roleFromFrontend === 'student'){
            student = await Student.create({
               profileInfo: user._id,
              attemptedTests: [],
              testStatus: [],
            })
          }else if (roleFromFrontend === 'teacher'){
            teacher = await Teacher.create({
              profileInfo: user._id,
             
            })
          }
        }

        return done(null, user);
      } catch (err) {
        console.error("Google Auth Error:", err);
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = { passport };
