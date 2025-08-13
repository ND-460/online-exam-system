const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../model/User");
require("dotenv").config();
const generateRandomPassword = require('../utils/randomPass');
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BASE_URL}/api/user/oauth2/redirect/google`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log("- Google Profile:", profile);

        const email = profile.emails?.[0]?.value || null;

        if (!email) {
          console.error("- Google Auth Error: No email received from Google");
          return done(null, false, {
            message: "No email received from Google",
          });
        }

        let user = await User.findOne({ email });

        if (!user) {
          const randomPassword = generateRandomPassword(6);
          const salt = await bcrypt.genSalt(10);
          const pass = await bcrypt.hash(randomPassword, salt);

          user = new User({
            name: profile.displayName || "No Name",
            email,
            phone: "N/A",
            // birthdate: new Date("2000-01-01"),
            password: pass,
            role: "student",
          });
          await user.save();
        }
        console.log("- Google Auth Successful:", user);
        return done(null, user);
      } catch (error) {
        console.error("- Google Auth Error:", error);
        return done(error, null);
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

module.exports = passport;
