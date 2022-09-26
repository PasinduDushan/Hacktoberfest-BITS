require("dotenv").config();
const express = require("express");
const router = express.Router();
const User = require("../models/user");
const userTasks = require("../models/userTasks");
const Tasks = require("../models/tasks");
const Tests = require("../models/tests");
const Admin = require("../models/admin");
const IMP = require("../models/confidential");
const nodemailer = require("nodemailer");
const request = require('request');
const { google } = require("googleapis");

const id = process.env.REGISTER_ID;

const isAuthenticated = (req, res, next) => {
  if (!req.session.userId) {
    res.redirect("/login");
  } else {
    next();
  }
};

const isHypeUser = (req, res, next) => {
  if (req.session.hypertextUser === true) {
    res.json({ code: 403, message: "Forbidden" });
  } else {
    next();
  }
};

const isEnabled = async (req, res, next) => {
  const data = await IMP.findOne({ power_admin: 1 });
  if (!data.competition_enabled) {
    res.json({
      code: 403,
      message: "Competition Has Not Started Yet. Please wait until 1st october",
    });
  } else {
    next();
  }
};

router.get("/", (req, res, next) => {
  return res.render("index.ejs");
});

router.get("/signup", (req, res, next) => {
  let site_key = process.env.RECAPTCHA_SITE_KEY
  return res.render("signup.ejs", {
    site_key: site_key
  });
});

router.post("/signup", async (req, res, next) => {
  let personInfo = req.body;

  if (
    !personInfo.email ||
    !personInfo.username ||
    !personInfo.password ||
    !personInfo.passwordConf
  ) {
    res.send();
  } else {
    if (personInfo.password == personInfo.passwordConf) {
      User.findOne({ email: personInfo.email }, (err, data) => {
        if (!data) {
          if (
            req.body['catcha-res'] === undefined ||
            req.body['catcha-res'] === null ||
            req.body['catcha-res'] === ''
          ) {
            return res.json({ responseError: 'something went wrong' })
          }
          const secretKey = process.env.RECAPTCHA_SECRET;
        
          const isUrlValid =
            'https://www.google.com/recaptcha/api/siteverify?secret=' +
            secretKey +
            '&response=' +
            req.body['catcha-res'] +
            '&remoteip=' +
            req.socket.remoteAddress
        
          request(isUrlValid, function (error, response, body) {
            body = JSON.parse(body)
        
            if (body.success !== undefined && !body.success) {
              return res.json({ responseError: 'Captcha verification failed' })
            }
          })

          let c;
          User.findOne({}, (err, data) => {
            if (data) {
              c = data.unique_id + 1;
            } else {
              c = 1;
            }

            let bits_id = com_id();
            let bitshype = false;
            let hype = false;

            if (req.body.competition === "bitshype") {
              bitshype = true;
            } else {
              hype = true;
            }

            let newPerson = new User({
              unique_id: c,
              email: personInfo.email,
              username: personInfo.username,
              school: personInfo.school,
              fullname: personInfo.fullname,
              age: personInfo.age,
              competitor_id: "bits22-" + bits_id,
              grade: personInfo.grade,
              password: personInfo.password,
              passwordConf: personInfo.passwordConf,
              adminUser: false,
              bitsUser: bitshype,
              hypertextUser: hype,
            });

            let newUserTasks = new userTasks({
              user_id: c,
              total_points: 0,
              pending_tasks: [],
              approved_tasks: [],
              declined_tasks: [],
            });

            newUserTasks.save((err, Data) => {
              if (err) {
                console.log(err);
              } else {
                console.log("Successfully added records for user tasks");
              }
            });

            (async () => {
              try {
                const { sheets } = await authentication();
                const { fullname, email, school, grade, age } = req.body;

                const writeReq = await sheets.spreadsheets.values.append({
                  spreadsheetId: id,
                  range: "Sheet1",
                  valueInputOption: "USER_ENTERED",
                  resource: {
                    values: [
                      [
                        fullname,
                        email,
                        age,
                        school,
                        grade,
                        "bits22-" + bits_id,
                      ],
                    ],
                  },
                });

                if (writeReq.status === 200) {
                  console.log("Spreadsheet updated");
                } else {
                  console.log(
                    "Somethign went wrong while updating the spreadsheet."
                  );
                }
              } catch (e) {
                console.log("ERROR WHILE UPDATING THE SPREADSHEET", e);
              }
            })();

            newPerson.save((err, Person) => {
              if (err) console.log(err);
              else if (bitshype === true) {
                async function main() {
                  let transporter = nodemailer.createTransport({
                    host: process.env.SMTP_SERVER,
                    port: parseInt(process.env.SMTP_PORT),
                    secure: true,
                    auth: {
                      user: process.env.USERNAME,
                      pass: process.env.PASSWORD,
                    },
                  });

                  let info = await transporter.sendMail({
                    from: `"BITS Organizing Community" <${process.env.USERNAME}>`,
                    to: personInfo.email,
                    subject: `Welcome ${personInfo.username}`,
                    html: `<p>Hello there, Welcome to BITS'22 with Hypertext organized by ACICTS of Ananda College Colombo. Please verify all information below before continuing, If there are any issues please contact one of our site admins immediately. If everything is correct you are good to go.</b><br><br><b>Information Provided</b><ul><li>Username: ${personInfo.username}</li><li>School Name: ${personInfo.school}</li><li>Grade: ${personInfo.grade}</li><li>Email: ${personInfo.email}</li><li>Password: ********</li><li>BITS ID: bits22-${bits_id}</li></ul>`, // plain text body
                  });

                  console.log("Message sent: %s", info.messageId);
                }
                main().catch(console.error);
              } else if (hype === true) {
                async function main() {
                  let transporter = nodemailer.createTransport({
                    host: process.env.SMTP_SERVER,
                    port: parseInt(process.env.SMTP_PORT),
                    secure: true,
                    auth: {
                      user: process.env.USERNAME,
                      pass: process.env.PASSWORD,
                    },
                  });

                  let info = await transporter.sendMail({
                    from: `"Hypertext Organizing Community" <${process.env.USERNAME}>`,
                    to: personInfo.email,
                    subject: `Welcome ${personInfo.username}`,
                    html: `<p>Hello there, Welcome to Hypertext organized by ACICTS of Ananda College Colombo. Please verify all information below before continuing, If there are any issues please contact one of our site admins immediately. If everything is correct you are good to go.</b><br><br><b>Information Provided</b><ul><li>Username: ${personInfo.username}</li><li>School Name: ${personInfo.school}</li><li>Grade: ${personInfo.grade}</li><li>Email: ${personInfo.email}</li><li>Password: ********</li><li>BITS ID: bits22-${bits_id}</li></ul>`, // plain text body
                  });

                  console.log("Message sent: %s", info.messageId);
                }
                main().catch(console.error);
              }
            });
          })
            .sort({ _id: -1 })
            .limit(1);
          res.send({ Success: "You are registered,You can login now." });
        } else {
          res.send({ Success: "Email is already used." });
        }
      });
    } else {
      res.send({ Success: "password is not matched" });
    }
  }
});

router.get(
  "/tasks",
  isEnabled,
  isAuthenticated,
  isHypeUser,
  async (req, res, next) => {
    const tasks = await Tasks.find();
    const user_tasks = await userTasks.findOne({ user_id: req.session.userId });
    const approved = user_tasks.approved_tasks;
    const declined = user_tasks.declined_tasks;
    const pending = user_tasks.pending_tasks;
    const approvedArray = approved.map(function (data) {
      return data.task_id;
    });
    const declineArray = declined.map(function (data) {
      return data.task_id;
    });
    const pendingArray = pending.map(function (data) {
      return data.task_id;
    });

    res.render("taskdata", {
      tasks: tasks,
      approvedArray: approvedArray,
      declineArray: declineArray,
      pendingArray: pendingArray,
    });
  }
);

router.get(
  "/onlinetest",
  isEnabled,
  isAuthenticated,
  async (req, res, next) => {
    const user_data = await User.findOne({ unique_id: req.session.userId });
    const test_data = await Tests.find();
    const str = user_data.grade;

    const replaced = str.replace(/\D/g, "");

    let user_type;
    if (replaced >= 6 && replaced <= 9) {  //Checking the users grade.
      user_type = "junior";
    } else if (replaced == 10 || replaced == 11 || replaced == 1000) {
      user_type = "senior";
    }

    const filteredQuiz = test_data
      .filter(function (data) {
        return data.test_type === user_type;
      })
      .map(function (data) {
        return {
          id: data._id,
          createdAt: data.createdAt,
          test_id: data.test_id,
          test_name: data.test_name,
          test_description: data.test_description,
          test_link: data.test_link,
          test_enabled: data.testEnabled,
        };
      });

    res.render("onlinetests", {
      filteredQuiz: filteredQuiz,
    });
  }
);

router.get("/login", isEnabled, (req, res, next) => {
  return res.render("login.ejs");
});

router.post("/login", isEnabled, (req, res, next) => {
  User.findOne({ email: req.body.email }, (err, data) => {
    if (data) {
      if (data.password == req.body.password) {
        if (data.adminUser) {
          req.session.adminToken = process.env.TOKEN;
        }
        req.session.bitsUser = data.bitsUser;
        req.session.hypertextUser = data.hypertextUser;
        req.session.userId = data.unique_id;
        res.send({ Success: "Success!" });
      } else {
        res.send({ Success: "Wrong email or password!" });
      }
    } else {
      res.send({ Success: "This Email Is not regestered!" });
    }
  });
});

router.get(
  "/profile",
  isEnabled,
  isAuthenticated,
  isHypeUser,
  async (req, res, next) => {
    const taskData = await userTasks.findOne({ user_id: req.session.userId });
    const userData = await User.findOne({ unique_id: req.session.userId });
    var approvedTasksArray = taskData.approved_tasks;
    var declinedTasksArray = taskData.declined_tasks;
    var pendingTasksArray = taskData.pending_tasks;

    const approvedResults = approvedTasksArray.map(function (data) {
      return {
        task_title: data.task_title,
        task_description: data.task_description,
        task_id: data.task_id,
        task_category: data.task_category,
      };
    });

    const declinedResults = declinedTasksArray.map(function (data) {
      return {
        task_title: data.task_title,
        task_description: data.task_description,
        task_id: data.task_id,
        task_category: data.task_category,
        denial_reason: data.denial_reason,
      };
    });

    const pendingResults = pendingTasksArray.map(function (data) {
      return {
        task_title: data.task_title,
        task_description: data.task_description,
        task_id: data.task_id,
        task_category: data.task_category,
      };
    });

    res.render("data", {
      approvedResults: approvedResults,
      declinedResults: declinedResults,
      pendingResults: pendingResults,
      userData: userData,
    });
  }
);

router.post(
  "/test/submit",
  isEnabled,
  isAuthenticated,
  isHypeUser,
  async (req, res, next) => {
    const user_data = await User.findOne({ unique_id: req.session.userId });
    Admin.findOne({ number: 1 })
      .then((task) => {
        task.quizData.push({
          quiz_name: req.body.name,
          quiz_id: req.body.id,
          username: user_data.username,
          userId: user_data.unique_id,
        });
        task
          .save()
          .then(() => {
            return "Success";
          })
          .catch(console.log);
      })
      .catch(console.log);

    res.redirect(req.body.link);
  }
);

router.get("/leaderboard", isEnabled, isHypeUser, async (req, res, next) => {
  const Database = await userTasks.aggregate([
    {
      $lookup: {
        from: "users",
        localField: "user_id",
        foreignField: "unique_id",
        as: "same",
      },
    },
    {
      $match: { same: { $ne: [] } },
    },
    {
      $sort: { total_points: -1 },
    },
  ]);

  res.render("leaderboard", {
    db: Database,
    i: 1,
  });
});

router.get("/logout", (req, res, next) => {
  if (req.session) {
    // delete session object
    req.session.destroy((err) => {
      if (err) {
        return next(err);
      } else {
        return res.redirect("/");
      }
    });
  }
});

router.get("/forgetpass", (req, res, next) => {
  res.render("forget.ejs");
});

router.post("/forgetpass", (req, res, next) => {
  User.findOne({ email: req.body.email }, (err, data) => {
    if (!data) {
      res.send({ Success: "This Email Is not regestered!" });
    } else {
      if (req.body.password == req.body.passwordConf) {
        data.password = req.body.password;
        data.passwordConf = req.body.passwordConf;

        data.save((err, Person) => {
          if (err) console.log(err);
          else console.log("Success");
          res.send({ Success: "Password changed!" });
        });
      } else {
        res.send({
          Success: "Password does not matched! Both Password should be same.",
        });
      }
    }
  });
});

//Generating random ids for the competitors
const com_id = () => {
  var val = Math.floor(1000 + Math.random() * 9000);
  return val;
};

const authentication = async () => {
  const auth = new google.auth.GoogleAuth({
    keyFile: "credentials.json",
    scopes: "https://www.googleapis.com/auth/spreadsheets",
  });

  const client = await auth.getClient();

  const sheets = google.sheets({
    version: "v4",
    auth: client,
  });
  return { sheets };
};

module.exports = router;
