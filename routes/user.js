const express = require("express");
const { check, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const router = express.Router();
const User = require("../model/User");
const Student = require("../model/Student");
const Teacher = require("../model/Teacher");
const auth = require("../middleware/auth");
const { STUDENT, TEACHER } = require("../utils/roles");
const nodemailer = require("nodemailer");
var smtpTransport = require("nodemailer-smtp-transport");
const { baseURL } = require("../utils/roles");
const passport = require("passport");
require("dotenv").config();

const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

//transporter for nodemailer
var transporter = nodemailer.createTransport(
  smtpTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  })
);

/**
 * @method - POST
 * @param - /signup
 * @description - User SignUp
 */

router.post(
  "/signup",
  [
    check("email", "Please enter a valid email").isEmail(),
    check("password", "Please enter a valid password").isLength({
      min: 6,
    }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array(),
      });
    }

    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      className,
      section,
      role,
      dateOfBirth,
      gender,
      organisation:{name,address},
    } = req.body;

    try {
      let user = await User.findOne({
        email,
      });
      if (user) {
        return res.status(400).json({
          msg: "User Already Exists",
        });
      }

      user = new User({
        firstName,
        lastName,
        email,
        password,
        phone,
        role,
        className,
        section,
        dateOfBirth,
        gender,
        organisation:{name,address},
      });

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      const userData = await user.save();

      // TODO: Add notification to admin panel for new user registration
      // This would typically be done via WebSocket or a notification service
      console.log(`New user registered: ${firstName} ${lastName} (${email}) - Role: ${role}`);

      switch (role) {
        case STUDENT:
          try {
            student = Student({
              profileInfo: userData._id,
              attemptedTests: [],
              testStatus: []
            });
            await student.save();
          } catch (err) {
            console.log(err.message);
            return res.status(500).send("Error in Saving Student");
          }
          break;

        case TEACHER:
          try {
            teacher = Teacher({
              profileInfo: userData._id,
              assignedTests: [],
            });
            await teacher.save();
          } catch (err) {
            console.log(err.message);
            return res.status(500).send("Error in Saving Teacher");
          }
          break;

        default:
          console.log("OK 200");
      }

      // console.log(userData);
      // console.log(process.env.JWT_SECRET)

      const payload = {
        user: {
          id: user.id,
        },
      };
      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        {
          expiresIn: "3h",
        },
        (err, token) => {
          if (err) throw err;

          //cookie
          res.status(200).json({
            token,
            user,
          });
        }
      );
    } catch (err) {
      console.log(err.message);
      res.status(500).send("Error in Saving");
    }
  }
);

/**
 * @method - POST
 * @param - /login
 * @description - User Login
 */

router.post(
  "/login",
  [
    check("email", "Please enter a valid email").isEmail(),
    check("password", "Please enter a valid password").isLength({
      min: 6,
    }),
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;
    try {
      let user = await User.findOne({
        email,
      });
      if (!user)
        return res.status(400).json({
          message: "User Not Exist",
        });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch)
        return res.status(400).json({
          message: "Incorrect Password !",
        });
      console.log(process.env.JWT_SECRET);
      const payload = {
        user: {
          id: user._id,
        },
      };

      switch (user.role) {
        case 'student':
          let studentData = await Student.findOne({
            profileInfo: user._id,
          });

          const studentProfileID = studentData._id;
          payload.profileID = studentProfileID;
          break;

        case 'teacher':
          let teacherData = await Teacher.findOne({
            profileInfo: user._id,
          });

          const teacherProfileID = teacherData._id;
          payload.profileID = teacherProfileID;
          break;
        default:
          console.log("OK");
      }

      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        {
          expiresIn: "3h",
          //3 hrs
        },
        (err, token) => {
          if (err) throw err;
          if (!user.isVerified) {
            const url = `${baseURL}/user/confirm/${token}`;
            transporter.sendMail(
              {
                to: user.email,
                subject: "Confirm Email",
                html: `<head>
                <title></title>
                <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <meta http-equiv="X-UA-Compatible" content="IE=edge" />
                <style type="text/css">
                    @media screen {
                        @font-face {
                            font-family: 'Lato';
                            font-style: normal;
                            font-weight: 400;
                            src: local('Lato Regular'), local('Lato-Regular'), url(https://fonts.gstatic.com/s/lato/v11/qIIYRU-oROkIk8vfvxw6QvesZW2xOQ-xsNqO47m55DA.woff) format('woff');
                        }
            
                        @font-face {
                            font-family: 'Lato';
                            font-style: normal;
                            font-weight: 700;
                            src: local('Lato Bold'), local('Lato-Bold'), url(https://fonts.gstatic.com/s/lato/v11/qdgUG4U09HnJwhYI-uK18wLUuEpTyoUstqEm5AMlJo4.woff) format('woff');
                        }
            
                        @font-face {
                            font-family: 'Lato';
                            font-style: italic;
                            font-weight: 400;
                            src: local('Lato Italic'), local('Lato-Italic'), url(https://fonts.gstatic.com/s/lato/v11/RYyZNoeFgb0l7W3Vu1aSWOvvDin1pK8aKteLpeZ5c0A.woff) format('woff');
                        }
            
                        @font-face {
                            font-family: 'Lato';
                            font-style: italic;
                            font-weight: 700;
                            src: local('Lato Bold Italic'), local('Lato-BoldItalic'), url(https://fonts.gstatic.com/s/lato/v11/HkF_qI1x_noxlxhrhMQYELO3LdcAZYWl9Si6vvxL-qU.woff) format('woff');
                        }
                    }
            
                    /* CLIENT-SPECIFIC STYLES */
                    body,
                    table,
                    td,
                    a {
                        -webkit-text-size-adjust: 100%;
                        -ms-text-size-adjust: 100%;
                    }
            
                    table,
                    td {
                        mso-table-lspace: 0pt;
                        mso-table-rspace: 0pt;
                    }
            
                    img {
                        -ms-interpolation-mode: bicubic;
                    }
            
                    /* RESET STYLES */
                    img {
                        border: 0;
                        height: auto;
                        line-height: 100%;
                        outline: none;
                        text-decoration: none;
                    }
            
                    table {
                        border-collapse: collapse !important;
                    }
            
                    body {
                        height: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        width: 100% !important;
                    }
            
                    /* iOS BLUE LINKS */
                    a[x-apple-data-detectors] {
                        color: inherit !important;
                        text-decoration: none !important;
                        font-size: inherit !important;
                        font-family: inherit !important;
                        font-weight: inherit !important;
                        line-height: inherit !important;
                    }
            
                    /* MOBILE STYLES */
                    @media screen and (max-width:60px) {
                        h1 {
                            font-size: 32px !important;
                            line-height: 32px !important;
                        }
                    }
            
                    /* ANDROID CENTER FIX */
                    div[style*="margin: 16px 0;"] {
                        margin: 0 !important;
                    }
                </style>
            </head>
            
            <body style="background-color: #f4f4f4; margin: 0 !important; padding: 0 !important;">
                <!-- HIDDEN PREHEADER TEXT -->
                <div style="display: none; font-size: 1px; color: #fefefe; line-height: 1px; font-family: 'Lato', Helvetica, Arial, sans-serif; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;"> We're thrilled to have you here! Get ready to dive into your new account. </div>
                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                    <!-- LOGO -->
                    <tr>
                        <td bgcolor="#FFA73B" align="center">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 60px;">
                                <tr>
                                    <td align="center" valign="top" style="padding: 40px 10px 40px 10px;"> </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td bgcolor="#FFA73B" align="center" style="padding: 0px 10px 0px 10px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 60px;">
                                <tr>
                                    <td bgcolor="#ffffff" align="center" valign="top" style="padding: 40px 20px 20px 20px; border-radius: 4px 4px 0px 0px; color: #111111; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 48px; font-weight: 400; letter-spacing: 4px; line-height: 48px;">
                                        <h1 style="font-size: 48px; font-weight: 400; margin: 2;">Welcome!</h1> <img src=" https://img.icons8.com/clouds/100/000000/handshake.png" width="125" height="120" style="display: block; border: 0px;" />
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td bgcolor="#f4f4f4" align="center" style="padding: 0px 10px 0px 10px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 60px;">
                                <tr>
                                    <td bgcolor="#ffffff" align="left" style="padding: 20px 30px 40px 30px; color: #666666; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 400; line-height: 25px;">
                                        <p style="margin: 0;">We're excited to have you get started. First, you need to confirm your account. Just press the button below.</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td bgcolor="#ffffff" align="left">
                                        <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                            <tr>
                                                <td bgcolor="#ffffff" align="center" style="padding: 20px 30px 60px 30px;">
                                                    <table border="0" cellspacing="0" cellpadding="0">
                                                        <tr>
                                                            <td align="center" style="border-radius: 3px;" bgcolor="#FFA73B"><a href=${url} target="_blank" style="font-size: 20px; font-family: Helvetica, Arial, sans-serif; color: #ffffff; text-decoration: none; color: #ffffff; text-decoration: none; padding: 15px 25px; border-radius: 2px; border: 1px solid #FFA73B; display: inline-block;">Confirm Account</a></td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr> <!-- COPY -->
                                <tr>
                                    <td bgcolor="#ffffff" align="left" style="padding: 0px 30px 0px 30px; color: #666666; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 400; line-height: 25px;">
                                        <p style="margin: 0;">If that doesn't work, copy and paste the following link in your browser:</p>
                                    </td>
                                </tr> <!-- COPY -->
                                <tr>
                                    <td bgcolor="#ffffff" align="left" style="padding: 20px 30px 20px 30px; color: #666666; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 400; line-height: 25px;">
                                        <p style="margin: 0;"><a href=${url} target="_blank" style="color: #FFA73B;">Click Here</a></p>
                                    </td>
                                </tr>
                                <tr>
                                    <td bgcolor="#ffffff" align="left" style="padding: 0px 30px 20px 30px; color: #666666; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 400; line-height: 25px;">
                                        <p style="margin: 0;">If you have any questions, just reply to this email—we're always happy to help out.</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td bgcolor="#ffffff" align="left" style="padding: 0px 30px 40px 30px; border-radius: 0px 0px 4px 4px; color: #666666; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 400; line-height: 25px;">
                                        <p style="margin: 0;">Cheers,<br>EMS Team</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td bgcolor="#f4f4f4" align="center" style="padding: 30px 10px 0px 10px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 60px;">
                                <tr>
                                    <td bgcolor="#FFECD1" align="center" style="padding: 30px 30px 30px 30px; border-radius: 4px 4px 4px 4px; color: #666666; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 400; line-height: 25px;">
                                        <h2 style="font-size: 20px; font-weight: 400; color: #111111; margin: 0;">Need more help?</h2>
                                        <p style="margin: 0;"><a href="#" target="_blank" style="color: #FFA73B;">We&rsquo;re here to help you out</a></p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td bgcolor="#f4f4f4" align="center" style="padding: 0px 10px 0px 10px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 60px;">
                                <tr>
                                    <td bgcolor="#f4f4f4" align="left" style="padding: 0px 30px 30px 30px; color: #666666; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 400; line-height: 18px;"> <br>
                                        <p style="margin: 0;">If these emails get annoying, please feel free to <a href="#" target="_blank" style="color: #111111; font-weight: 700;">unsubscribe</a>.</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>`,
              },
              function (error, info) {
                if (error) {
                  console.log(error);
                } else {
                  console.log("Email sent: " + info.response);
                }
              }
            );
          }
          res.status(200).json({
            user,
            payload,
            token,
          });
        }
      );
    } catch (e) {
      console.error(e);
      res.status(500).json({
        message: "Server Error",
      });
    }
  }
);

/**
 * @method - GET
 * @param - /confirm/:token
 * @description - Email Verification
 */

// router.get("/confirm/:token", async (req, res) => {
//   const token = req.params.token;
//   //console.log("routed")
// //   console.log(process.env.JWT_SECRET)
//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     req.user = decoded.user;

//     await User.updateOne({ _id: req.user.id }, { isVerified: true }, function (
//       err,
//       message
//     ) {
//       if (err) {
//         return res.status(500).json({ message: "Verification Failed" });
//       } else {
//         return res.status(200).json({
//           message: "Email Verified!",
//         });
//       }
//     });
//   } catch (e) {
//     console.error(e);
//     return res.status(500).send({ message: "Verification Failed" });
//   }
// });
router.get("/confirm/:token", async (req, res) => {
  const token = req.params.token;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;

    const result = await User.updateOne(
      { _id: req.user.id },
      { isVerified: true }
    );

    if (result.modifiedCount === 0) {
      return res
        .status(400)
        .json({ message: "User not found or already verified" });
    }

    return res.status(200).json({ message: "Email Verified!" });
  } catch (e) {
    console.error("JWT verification error:", e.message);
    return res.status(500).send({ message: "Verification Failed" });
  }
});

/**
 * @method - POST
 * @param - /google-login
 * @description - This route redirects the user to Google, where they will authenticate.
 */

// router.post(
//   "/google-login",
//   passport.authenticate("google", { scope: ["profile", "email"] })
// );

// // One Tap JWT Google Login
// router.post("/google-login", async (req, res) => {
//   try {
//     const { credential, role } = req.body;
//     if (!credential) {
//       return res.status(400).json({ message: "Google credential is required" });
//     }

//     const payload = await verifyGoogleToken(credential);
//     const email = payload.email;

//     let user = await User.findOne({ email });

//     if (!user) {
//       const randomPassword = generateRandomPassword(6);
//       const salt = await bcrypt.genSalt(10);
//       const pass = await bcrypt.hash(randomPassword, salt);

//       user = new User({
//         firstName: payload.given_name || payload.name?.split(" ")[0] || "First",
//         lastName: payload.family_name || payload.name?.split(" ")[1] || "Last",
//         email,
//         phone: "N/A",
//         password: pass,
//         role: role || "student",
//       });

//       await user.save();
//     }

//     const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
//       expiresIn: "7d",
//     });

//     res.json({ token, user });
//   } catch (err) {
//     console.error("One Tap Google Login Error:", err);
//     res.status(500).json({ message: "Google login failed" });
//   }
// });

// Redirect login start
router.get("/auth/google", (req, res, next) => {
  const role = req.query.role || "student";
  passport.authenticate("google", {
    scope: ["profile", "email"],
    state: role,
  })(req, res, next);
});

/**
 * @method - POST
 * @param - /oauth2/redirect/google
 * @description -  This route completes the authentication sequence when Google redirects the
    user back to the application.  When a new user signs in, a user account is
    automatically created and their Google account is linked.  When an existing
    user returns, they are signed in to their linked account.
 */

router.get(
  "/oauth2/redirect/google",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=GoogleAuthFailed`,
  }),
  async (req, res) => {
    const role = req.query.state || "student";
    if (!req.user.role) {
      req.user.role = role;
      await req.user.save();
    }

    const token = jwt.sign(
      { id: req.user._id, role: req.user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.redirect(
      `${process.env.FRONTEND_URL}/login?googleSuccess=true&token=${token}`
    );
  }
);

/**
 * @method - POST
 * @param - /logout
 * @description -  This route completes the authentication sequence when Google redirects the
    user back to the application.  When a new user signs in, a user account is
    automatically created and their Google account is linked.  When an existing
    user returns, they are signed in to their linked account.
 */
router.post("/logout", function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

/**
 * @method - GET
 * @param - /profile/:profileID
 * @description -  get profiles of common user
 */

// router.get("/profile/:profileID", auth, async (req, res) => {
//   const profileID = req.params.profileID;

//   try {
//     let obj = await Student.findOne({ _id: profileID });
//     if (!obj) {
//       obj = await Teacher.findOne({ _id: profileID });
//     }
//     if (!obj) {
//       obj = await User.findOne({ _id: profileID });
//     }

//     if (!obj) {
//       return res.status(404).json({ message: "Profile not found" });
//     }

//     return res.status(200).json({ obj });
//   } catch (err) {
//     console.log(err.message);
//     res.status(500).send("Error in fetching Profile Data");
//   }
// });

router.get("/profile/:profileID", auth, async (req, res) => {
  try {
    const profileID = req.params.profileID || req.user?.id;

    let user = await User.findById(profileID);
    let roleData = null;

    if (user) {
      // User found → check role collection
      if (user.role === "student") {
        roleData = await Student.findOne({ profileInfo: user._id });
      } else if (user.role === "teacher") {
        roleData = await Teacher.findOne({ profileInfo: user._id });
      }
    } else {
      // User not found → check Student/Teacher collection
      roleData = await Student.findById(profileID) || await Teacher.findById(profileID);
      if (roleData) {
        // Get the linked User via profileInfo
        user = await User.findById(roleData.profileInfo);
        if (!user) return res.status(404).json({ message: "Linked User not found" });
      } else {
        return res.status(404).json({ message: "User or role data not found" });
      }
    }

    return res.status(200).json({
      obj: {
        ...user.toObject(),
        ...(roleData ? roleData.toObject() : {}),
      },
      role: user.role,
      roleRegistered: !!roleData,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error in fetching Profile Data");
  }
});



/**
 * @method - PUT
 * @param - /profile/:profileID
 * @description -  update profiles of common user
 */

// router.put("/profile/:profileID", auth, async (req, res) => {
//   const profileID = req.params.profileID;

//   try {
//     // Check in Student, Teacher, then User
//     let updatedData =
//       (await Student.findOneAndUpdate({ _id: profileID }, req.body, {
//         new: true,
//       })) ||
//       (await Teacher.findOneAndUpdate({ _id: profileID }, req.body, {
//         new: true,
//       })) ||
//       (await User.findOneAndUpdate({ _id: profileID }, req.body, {
//         new: true,
//       }));

//     if (!updatedData) {
//       return res.status(404).json({ message: "Profile not found" });
//     }

//     return res.status(200).json({
//       message: "Profile successfully updated",
//       updatedData,
//     });
//   } catch (err) {
//     console.log(err.message);
//     res.status(500).send("Error in Updating Profile");
//   }
// });

router.put("/profile/:profileID", auth, async (req, res) => {
  try {
    const profileID = req.params.profileID || req.user?.id;

    let user = await User.findById(profileID);
    let roleData = null;

    if (!user) {
      // Check role collections
      roleData = await Student.findById(profileID) || await Teacher.findById(profileID);
      if (!roleData) return res.status(404).json({ message: "User or role data not found" });

      // Get linked User
      user = await User.findById(roleData.profileInfo);
      if (!user) return res.status(404).json({ message: "Linked User not found" });
    } else {
      // User exists → check role collection
      if (user.role === "student") {
        roleData = await Student.findOne({ profileInfo: user._id });
      } else if (user.role === "teacher") {
        roleData = await Teacher.findOne({ profileInfo: user._id });
      }
    }

    // Split fields
    const userFields = ["firstName", "lastName", "email", "phone", "dateOfBirth", "gender", "organisation"];
    const userUpdates = {};
    const roleUpdates = {};

    for (const key in req.body) {
      if (userFields.includes(key) || key.startsWith("organisation")) {
        userUpdates[key] = req.body[key];
      } else {
        roleUpdates[key] = req.body[key];
      }
    }

    // Update User
    const updatedUser = await User.findByIdAndUpdate(user._id, { $set: userUpdates }, { new: true });

    // Update/Create role document
    if (user.role === "student") {
      roleData = await Student.findOneAndUpdate(
        { profileInfo: updatedUser._id },
        { $set: roleUpdates },
        { new: true, upsert: true }
      );
    } else if (user.role === "teacher") {
      roleData = await Teacher.findOneAndUpdate(
        { profileInfo: updatedUser._id },
        { $set: roleUpdates },
        { new: true, upsert: true }
      );
    }

    return res.status(200).json({
      message: "Profile successfully updated",
      obj: {
        ...updatedUser.toObject(),
        ...(roleData ? roleData.toObject() : {}),
      },
      roleRegistered: !!roleData,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error in Updating Profile");
  }
});


/**
 * @method - GET
 * @param - /admin/users
 * @description - Get all users for admin panel
 */
router.get("/admin/users", auth, async (req, res) => {
  try {
    // Check if user is admin
    const adminUser = await User.findById(req.user.id);
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({ message: "Access denied. Admin role required." });
    }

    const users = await User.find({}, { password: 0 }).sort({ createdAt: -1 });
    res.status(200).json({ users });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ message: "Error fetching users" });
  }
});

/**
 * @method - PUT
 * @param - /admin/users/:userId/status
 * @description - Update user status (approve, block, etc.)
 */
router.put("/admin/users/:userId/status", auth, async (req, res) => {
  try {
    // Check if user is admin
    const adminUser = await User.findById(req.user.id);
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({ message: "Access denied. Admin role required." });
    }

    const { userId } = req.params;
    const { status } = req.body;

    if (!['pending', 'active', 'blocked'].includes(status)) {
      return res.status(400).json({ message: "Invalid status. Must be pending, active, or blocked." });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { status },
      { new: true, select: '-password' }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: `User status updated to ${status}`,
      user
    });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ message: "Error updating user status" });
  }
});

/**
 * @method - DELETE
 * @param - /admin/users/:userId
 * @description - Delete a user
 */
router.delete("/admin/users/:userId", auth, async (req, res) => {
  try {
    // Check if user is admin
    const adminUser = await User.findById(req.user.id);
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({ message: "Access denied. Admin role required." });
    }

    const { userId } = req.params;

    // Prevent admin from deleting themselves
    if (userId === req.user.id) {
      return res.status(400).json({ message: "Cannot delete your own account" });
    }

    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Also delete associated student/teacher records
    await Student.findOneAndDelete({ profileInfo: userId });
    await Teacher.findOneAndDelete({ profileInfo: userId });

    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ message: "Error deleting user" });
  }
});

/**
 * @method - GET
 * @param - /admin/stats
 * @description - Get admin dashboard statistics
 */
router.get("/admin/stats", auth, async (req, res) => {
  try {
    // Check if user is admin
    const adminUser = await User.findById(req.user.id);
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({ message: "Access denied. Admin role required." });
    }

    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: 'active' });
    const pendingUsers = await User.countDocuments({ status: 'pending' });
    const blockedUsers = await User.countDocuments({ status: 'blocked' });
    const students = await User.countDocuments({ role: 'student' });
    const teachers = await User.countDocuments({ role: 'teacher' });
    const admins = await User.countDocuments({ role: 'admin' });

    res.status(200).json({
      totalUsers,
      activeUsers,
      pendingUsers,
      blockedUsers,
      students,
      teachers,
      admins
    });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ message: "Error fetching statistics" });
  }
});

module.exports = router;
