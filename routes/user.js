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
    const teacherDoc = await Teacher.findOneAndDelete({ profileInfo: userId });
    await Student.findOneAndDelete({ profileInfo: userId });

    // If teacher, cascade delete their tests and results
    if (teacherDoc) {
      const Test = require("../model/Test");
      const Result = require("../model/Result");
      const tests = await Test.find({ teacherId: teacherDoc._id }, { _id: 1 });
      const testIds = tests.map(t => t._id);
      if (testIds.length) {
        await Promise.all([
          Test.deleteMany({ _id: { $in: testIds } }),
          Result.deleteMany({ testId: { $in: testIds } })
        ]);
      }
      // Also remove results that may directly reference teacherId
      await Result.deleteMany({ teacherId: teacherDoc._id });
    }

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

    const Test = require("../model/Test");
    const Result = require("../model/Result");

    // User counts
    const students = await User.countDocuments({ role: 'student' });
    const teachers = await User.countDocuments({ role: 'teacher' });
    const admins = await User.countDocuments({ role: 'admin' });
    const totalUsers = students + teachers + admins; // Ensure total = sum of all roles

    const activeUsers = await User.countDocuments({ status: 'active' });
    const pendingUsers = await User.countDocuments({ status: 'pending' });
    const blockedUsers = await User.countDocuments({ status: 'blocked' });

    // Test counts
    const totalTests = await Test.countDocuments();
    const publishedTests = await Test.countDocuments({ status: 'published' });
    const draftTests = await Test.countDocuments({ status: 'draft' });
    const completedTests = await Test.countDocuments({ status: 'completed' });

    // Results count
    const totalResults = await Result.countDocuments();

    res.status(200).json({
      totalUsers,
      activeUsers,
      pendingUsers,
      blockedUsers,
      students,
      teachers,
      admins,
      totalTests,
      publishedTests,
      draftTests,
      completedTests,
      totalResults
    });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ message: "Error fetching statistics" });
  }
});

/**
 * @method - GET
 * @param - /admin/tests
 * @description - Get all tests for admin panel
 */
router.get("/admin/tests", auth, async (req, res) => {
  try {
    // Check if user is admin
    const adminUser = await User.findById(req.user.id);
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({ message: "Access denied. Admin role required." });
    }

    const Test = require("../model/Test");
    const Result = require("../model/Result");

    const testsRaw = await Test.find().populate({
      path: 'teacherId',
      populate: { path: 'profileInfo', model: 'users', select: 'firstName lastName email organisation' }
    }).sort({ createdAt: -1 });

    // Normalize for admin table: include org, teacher name/email, assigned count, submissions count
    const tests = await Promise.all(testsRaw.map(async (t) => {
      const teacherUser = t.teacherId?.profileInfo;
      const orgName = teacherUser?.organisation?.name || 'N/A';
      const assignedCount = Array.isArray(t.assignedTo) ? t.assignedTo.length : (Array.isArray(t.assignedStudents) ? t.assignedStudents.length : 0);
      // Results reference Student docs; submissions can also be read from Result
      const submissionsCount = await Result.countDocuments({ testId: t._id });
      return {
        _id: t._id,
        testName: t.testName,
        category: t.category,
        organization: orgName,
        teacher: teacherUser ? `${teacherUser.firstName} ${teacherUser.lastName}` : '—',
        teacherEmail: teacherUser?.email || '—',
        teacherId: t.teacherId?._id || null,
        outOfMarks: t.outOfMarks,
        minutes: t.minutes,
        status: t.status,
        scheduledAt: t.scheduledAt,
        publishedAt: t.publishedAt,
        dueDate: t.dueDate,
        assignedCount,
        submissionsCount
      };
    }));

    res.status(200).json({ tests });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ message: "Error fetching tests" });
  }
});

/**
 * @method - GET
 * @param - /admin/results
 * @description - Get all results for admin panel
 */
router.get("/admin/results", auth, async (req, res) => {
  try {
    // Check if user is admin
    const adminUser = await User.findById(req.user.id);
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({ message: "Access denied. Admin role required." });
    }

    const Result = require("../model/Result");
    const results = await Result.find()
      .populate('studentId', 'firstName lastName email')
      .populate('testId', 'testName totalMarks passingMarks')
      .sort({ createdAt: -1 });

    res.status(200).json({ results });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ message: "Error fetching results" });
  }
});

/**
 * @method - GET
 * @param - /admin/reports/test/:testId
 * @description - Download test report
 */
router.get("/admin/reports/test/:testId", auth, async (req, res) => {
  try {
    // Check if user is admin
    const adminUser = await User.findById(req.user.id);
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({ message: "Access denied. Admin role required." });
    }

    const { testId } = req.params;
    const Test = require("../model/Test");
    const Result = require("../model/Result");

    const test = await Test.findById(testId).populate('teacherId', 'firstName lastName');
    if (!test) {
      return res.status(404).json({ message: "Test not found" });
    }

    const results = await Result.find({ testId })
      .populate('studentId', 'firstName lastName email')
      .sort({ score: -1 });

    // Generate PDF report (you can use libraries like puppeteer, jsPDF, etc.)
    // For now, we'll return JSON data that can be used to generate reports
    const reportData = {
      test: {
        name: test.testName,
        totalMarks: test.totalMarks,
        passingMarks: test.passingMarks,
        duration: test.minutes,
        teacher: `${test.teacherId.firstName} ${test.teacherId.lastName}`,
        createdAt: test.createdAt
      },
      results: results.map(result => ({
        student: `${result.studentId.firstName} ${result.studentId.lastName}`,
        email: result.studentId.email,
        score: result.score,
        status: result.status,
        submittedAt: result.submittedAt
      })),
      statistics: {
        totalAttempts: results.length,
        passed: results.filter(r => r.score >= test.passingMarks).length,
        failed: results.filter(r => r.score < test.passingMarks).length,
        averageScore: results.length > 0 ? (results.reduce((sum, r) => sum + r.score, 0) / results.length).toFixed(2) : 0
      }
    };

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=test-report-${testId}.pdf`);

    // For now, return JSON. In production, you'd generate actual PDF
    res.status(200).json(reportData);
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ message: "Error generating test report" });
  }
});

/**
 * @method - GET
 * @param - /admin/reports/student/:studentId
 * @description - Download student report
 */
router.get("/admin/reports/student/:studentId", auth, async (req, res) => {
  try {
    // Check if user is admin
    const adminUser = await User.findById(req.user.id);
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({ message: "Access denied. Admin role required." });
    }

    const { studentId } = req.params;
    const Result = require("../model/Result");

    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const results = await Result.find({ studentId })
      .populate('testId', 'testName totalMarks passingMarks teacherId')
      .sort({ submittedAt: -1 });

    const reportData = {
      student: {
        name: `${student.firstName} ${student.lastName}`,
        email: student.email,
        joinedAt: student.createdAt
      },
      results: results.map(result => ({
        testName: result.testId.testName,
        score: result.score,
        totalMarks: result.testId.totalMarks,
        passingMarks: result.testId.passingMarks,
        status: result.status,
        submittedAt: result.submittedAt
      })),
      statistics: {
        totalTests: results.length,
        passed: results.filter(r => r.score >= r.testId.passingMarks).length,
        failed: results.filter(r => r.score < r.testId.passingMarks).length,
        averageScore: results.length > 0 ? (results.reduce((sum, r) => sum + r.score, 0) / results.length).toFixed(2) : 0
      }
    };

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=student-report-${studentId}.pdf`);

    // For now, return JSON. In production, you'd generate actual PDF
    res.status(200).json(reportData);
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ message: "Error generating student report" });
  }
});

/**
 * @method - GET
 * @param - /admin/students
 * @description - Get all students for admin panel
 */
router.get("/admin/students", auth, async (req, res) => {
  try {
    // Check if user is admin
    const adminUser = await User.findById(req.user.id);
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({ message: "Access denied. Admin role required." });
    }

    const students = await User.find({ role: 'student' }, { password: 0 })
      .populate('organisation', 'name address')
      .sort({ createdAt: -1 });

    // Get additional student data
    const studentsWithData = await Promise.all(students.map(async (student) => {
      // Find the Student doc linked to this User
      const studentDoc = await Student.findOne({ profileInfo: student._id });
      const Result = require("../model/Result");
      // Results reference Student._id, not User._id
      const results = studentDoc ? await Result.find({ studentId: studentDoc._id }) : [];
      
      const testsTaken = results.length;
      let averagePercentage = 0;
      if (results.length > 0) {
        const totalMarksObtained = results.reduce((sum, r) => sum + r.score, 0);
        const totalMaxMarks = results.reduce((sum, r) => sum + (r.outOfMarks || 0), 0);
        averagePercentage = totalMaxMarks > 0 ? (totalMarksObtained / totalMaxMarks) * 100 : 0;
      }

      return {
        _id: student._id,
        profileId: studentDoc?._id,
        name: `${student.firstName} ${student.lastName}`,
        email: student.email,
        organization: student.organisation?.name || 'N/A',
        testsTaken,
        averagePercentage: `${averagePercentage.toFixed(1)}%`,
        status: student.status || 'active',
        createdAt: student.createdAt
      };
    }));

    res.status(200).json({ students: studentsWithData });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ message: "Error fetching students" });
  }
});

/**
 * @method - GET
 * @param - /admin/admins
 * @description - Get all admin users for admin panel
 */
router.get("/admin/admins", auth, async (req, res) => {
  try {
    // Check if user is admin
    const adminUser = await User.findById(req.user.id);
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({ message: "Access denied. Admin role required." });
    }

    const admins = await User.find({ role: 'admin' }, { password: 0 })
      .populate('organisation', 'name address')
      .sort({ createdAt: -1 });

    // Get additional admin data
    const adminsWithData = await Promise.all(admins.map(async (admin) => {
      return {
        _id: admin._id,
        name: `${admin.firstName} ${admin.lastName}`,
        email: admin.email,
        organization: admin.organisation?.name || 'N/A',
        status: admin.status || 'active',
        createdAt: admin.createdAt,
        lastLogin: admin.lastLogin || 'Never',
        role: admin.role
      };
    }));

    res.status(200).json({ admins: adminsWithData });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ message: "Error fetching admins" });
  }
});

/**
 * @method - GET
 * @param - /admin/teachers
 * @description - Get all teachers for admin panel
 */
router.get("/admin/teachers", auth, async (req, res) => {
  try {
    // Check if user is admin
    const adminUser = await User.findById(req.user.id);
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({ message: "Access denied. Admin role required." });
    }

    const teachers = await User.find({ role: 'teacher' }, { password: 0 })
      .populate('organisation', 'name address')
      .sort({ createdAt: -1 });

    // Get additional teacher data
    const teachersWithData = await Promise.all(teachers.map(async (teacher) => {
      // Map User -> Teacher document for proper references
      const teacherDoc = await Teacher.findOne({ profileInfo: teacher._id });
      const Test = require("../model/Test");
      const Result = require("../model/Result");
      const tests = teacherDoc ? await Test.find({ teacherId: teacherDoc._id }) : [];

      const testsCreated = tests.length;
      // studentsTaught based on assignedStudents or assignedTo
      const studentIds = new Set();
      for (const t of tests) {
        (t.assignedTo || []).forEach(id => studentIds.add(String(id)));
        (t.assignedStudents || []).forEach(s => s?.studentId && studentIds.add(String(s.studentId)));
      }
      const studentsTaught = studentIds.size;
      // Average percentage from Result collection filtered by teacherDoc._id
      let averagePercentage = 'N/A';
      if (teacherDoc) {
        const results = await Result.find({ teacherId: teacherDoc._id });
        if (results.length > 0) {
          const totalMarksObtained = results.reduce((sum, r) => sum + r.score, 0);
          const totalMaxMarks = results.reduce((sum, r) => sum + (r.outOfMarks || 0), 0);
          const avgPercentage = totalMaxMarks > 0 ? (totalMarksObtained / totalMaxMarks) * 100 : 0;
          averagePercentage = `${avgPercentage.toFixed(1)}%`;
        }
      }

      return {
        _id: teacher._id,
        profileId: teacherDoc?._id,
        name: `${teacher.firstName} ${teacher.lastName}`,
        email: teacher.email,
        organization: teacher.organisation?.name || 'N/A',
        testsCreated,
        studentsTaught,
        status: teacher.status || 'active',
        createdAt: teacher.createdAt,
        averagePercentage
      };
    }));

    res.status(200).json({ teachers: teachersWithData });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ message: "Error fetching teachers" });
  }
});

/**
 * @method - GET
 * @param - /admin/organizations
 * @description - Get all organizations for admin panel
 */
router.get("/admin/organizations", auth, async (req, res) => {
  try {
    // Check if user is admin
    const adminUser = await User.findById(req.user.id);
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({ message: "Access denied. Admin role required." });
    }

    // Get unique organizations from users
    const organizations = await User.aggregate([
      { $match: { organisation: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: '$organisation.name',
          address: { $first: '$organisation.address' },
          studentCount: {
            $sum: { $cond: [{ $eq: ['$role', 'student'] }, 1, 0] }
          },
          teacherCount: {
            $sum: { $cond: [{ $eq: ['$role', 'teacher'] }, 1, 0] }
          },
          users: { $push: '$_id' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Map User ids -> Teacher documents, then count tests for those teachers
    const teacherDocs = await Teacher.find({ profileInfo: { $in: organizations.flatMap(o => o.users) } }, { _id: 1, profileInfo: 1 });
    const profileToTeacherId = new Map(teacherDocs.map(t => [String(t.profileInfo), t._id]));
    const Test = require("../model/Test");

    const organizationsWithData = await Promise.all(organizations.map(async (org) => {
      const teacherIds = org.users
        .map(id => profileToTeacherId.get(String(id)))
        .filter(Boolean);
      const testCount = teacherIds.length ? await Test.countDocuments({ teacherId: { $in: teacherIds } }) : 0;

      return {
        _id: org._id,
        name: org._id,
        address: org.address,
        studentCount: org.studentCount,
        teacherCount: org.teacherCount,
        testCount,
        status: 'active'
      };
    }));

    res.status(200).json({ organizations: organizationsWithData });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ message: "Error fetching organizations" });
  }
});

/**
 * @method - GET
 * @param - /admin/analytics
 * @description - Get analytics data for admin panel
 */
router.get("/admin/analytics", auth, async (req, res) => {
  try {
    // Check if user is admin
    const adminUser = await User.findById(req.user.id);
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({ message: "Access denied. Admin role required." });
    }

    const Test = require("../model/Test");
    const Result = require("../model/Result");

    // Get basic counts
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: 'active' });
    const totalTests = await Test.countDocuments();
    const totalResults = await Result.countDocuments();

    // Get tests created in the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const testsThisWeek = await Test.countDocuments({ createdAt: { $gte: sevenDaysAgo } });

    // Get average percentage
    const results = await Result.find({});
    let averagePercentage = 0;
    if (results.length > 0) {
      const totalMarksObtained = results.reduce((sum, r) => sum + r.score, 0);
      const totalMaxMarks = results.reduce((sum, r) => sum + (r.outOfMarks || 0), 0);
      averagePercentage = totalMaxMarks > 0 ? (totalMarksObtained / totalMaxMarks) * 100 : 0;
    }

    // Get success rate
    const passedResults = await Result.countDocuments({ status: 'passed' });
    const successRate = totalResults > 0 ? (passedResults / totalResults * 100).toFixed(1) : 0;

    // Get user role counts
    const students = await User.countDocuments({ role: 'student' });
    const teachers = await User.countDocuments({ role: 'teacher' });
    const admins = await User.countDocuments({ role: 'admin' });
    const calculatedTotalUsers = students + teachers + admins;

    res.status(200).json({
      systemHealth: 98,
      activeUsers,
      testsToday: testsThisWeek,
      successRate: parseFloat(successRate),
      totalUsers: calculatedTotalUsers,
      totalTests,
      totalStudents: students,
      totalTeachers: teachers,
      totalAdmins: admins,
      averagePercentage: Math.round(averagePercentage),
      systemOverview: {
        users: calculatedTotalUsers,
        tests: totalTests,
        results: totalResults
      }
    });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ message: "Error fetching analytics" });
  }
});

/**
 * @method - GET
 * @param - /admin/chart-data
 * @description - Get chart data for admin panel
 */
router.get("/admin/chart-data", auth, async (req, res) => {
  try {
    // Check if user is admin
    const adminUser = await User.findById(req.user.id);
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({ message: "Access denied. Admin role required." });
    }

    const Test = require("../model/Test");
    const Result = require("../model/Result");

    // Daily logins by role (last 7 days) - simulated based on activity
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    // Create date range for last 7 days
    const dailyLogins = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Count activity for each role on this date
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      
      // Student activity (based on test submissions)
      const studentActivity = await Result.countDocuments({
        submittedAt: { $gte: dayStart, $lte: dayEnd }
      });
      
      // Teacher activity (based on test creation)
      const teacherActivity = await Test.countDocuments({
        createdAt: { $gte: dayStart, $lte: dayEnd }
      });
      
      // Admin activity (simulated - could be based on user management actions)
      // For now, we'll simulate 1-3 admin logins per day
      const adminActivity = Math.floor(Math.random() * 3) + 1;
      
      dailyLogins.push({
        date: dateStr,
        students: studentActivity,
        teachers: teacherActivity,
        admins: adminActivity
      });
    }

    // Tests created per week (last 4 weeks)
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
    
    const testsPerWeek = await Test.aggregate([
      { $match: { createdAt: { $gte: fourWeeksAgo } } },
      {
        $group: {
          _id: {
            week: { $week: '$createdAt' },
            year: { $year: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.week': 1 } }
    ]);

    // Students by organization
    const studentsByOrg = await User.aggregate([
      { $match: { role: 'student', organisation: { $exists: true } } },
      {
        $group: {
          _id: '$organisation.name',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Teachers by organization
    const teachersByOrg = await User.aggregate([
      { $match: { role: 'teacher', organisation: { $exists: true } } },
      {
        $group: {
          _id: '$organisation.name',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Test performance trend (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const performanceTrend = await Result.aggregate([
      { $match: { submittedAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: {
            day: { $dayOfMonth: '$submittedAt' },
            month: { $month: '$submittedAt' }
          },
          averageScore: { $avg: '$score' }
        }
      },
      { $sort: { '_id.month': 1, '_id.day': 1 } }
    ]);

    res.status(200).json({
      testsPerWeek,
      studentsByOrg,
      teachersByOrg,
      performanceTrend,
      dailyLogins,
      marksDistribution: {
        '0-20': await Result.countDocuments({ score: { $gte: 0, $lt: 20 } }),
        '20-40': await Result.countDocuments({ score: { $gte: 20, $lt: 40 } }),
        '40-60': await Result.countDocuments({ score: { $gte: 40, $lt: 60 } }),
        '60-80': await Result.countDocuments({ score: { $gte: 60, $lt: 80 } }),
        '80-100': await Result.countDocuments({ score: { $gte: 80, $lte: 100 } })
      }
    });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ message: "Error fetching chart data" });
  }
});

module.exports = router;
