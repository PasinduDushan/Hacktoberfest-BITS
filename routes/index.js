const express = require("express");
const router = express.Router();
const User = require("../models/user");
const userTasks = require("../models/userTasks");
const Tasks = require("../models/tasks");
const Tests = require("../models/tests");
const nodemailer = require("nodemailer");
const { google } = require("googleapis");
require("dotenv").config();

const id = "16pFG1D9Qq1Q4mb-rHz-cXYVRZdUABHC1JQVnMG5jWvs";

const isAuthenticated = (req, res, next) => {
  if (!req.session.userId) {
    res.redirect("/login");
  } else {
    next();
  }
};

router.get("/", (req, res, next) => {
  return res.render("index.ejs");
});

router.get("/signup", (req, res, next) => {
  return res.render("signup.ejs");
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
          let c;
          User.findOne({}, (err, data) => {
            if (data) {
              c = data.unique_id + 1;
            } else {
              c = 1;
            }

            let bits_id = com_id();

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
            });

            let newUserTasks = new userTasks({
              user_id: c,
              total_points: 0,
              choosed_tasks: [],
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
              else {
                async function main() {
                  let transporter = nodemailer.createTransport({
                    host: "smtp.mail.yahoo.com",
                    port: 465,
                    secure: true,
                    auth: {
                      user: "pasindudushan07@yahoo.com",
                      pass: "sjrbeghvrlhorwnn",
                    },
                  });

                  let info = await transporter.sendMail({
                    from: '"BITS 22" <pasindudushan07@yahoo.com>',
                    to: personInfo.email,
                    subject: `Welcome ${personInfo.username}`,
                    html: `<p>Hello there, Welcome to BITS'22 organized by ACICTS of Ananda College Colombo. Please verify all information below before continuing, If there are any issues please contact one of our site admins immediately. If everything is correct you are good to go.</b><br><br><b>Information Provided</b><ul><li>Username: ${personInfo.username}</li><li>School Name: ${personInfo.school}</li><li>Grade: ${personInfo.grade}</li><li>Email: ${personInfo.email}</li><li>Password: ********</li><li>BITS ID: bits22-${bits_id}</li></ul>`, // plain text body
                  });

                  console.log("Message sent: %s", info.messageId);
                }
                main().catch(console.error);
              }
            });
          })
            .sort({ _id: -1 })
            .limit(1);
          res.send({ Success: "You are regestered,You can login now." });
        } else {
          res.send({ Success: "Email is already used." });
        }
      });
    } else {
      res.send({ Success: "password is not matched" });
    }
  }
});

router.get("/tasks", async (req, res, next) => {
  const tasks = await Tasks.find();
  res.render("taskdata", {
    tasks: tasks,
  });
});

router.get("/onlinetest", isAuthenticated, async (req, res, next) => {
  const user_data = await User.findOne({ unique_id: req.session.userId });
  const test_data = await Tests.find({ test_grade: user_data.grade });
  res.render("onlinetests", {
    user_date: user_data,
    test_data: test_data,
  });
});

router.get("/login", (req, res, next) => {
  return res.render("login.ejs");
});

router.post("/login", (req, res, next) => {
  User.findOne({ email: req.body.email }, (err, data) => {
    if (data) {
      if (data.password == req.body.password) {
        if (data.adminUser) {
          req.session.adminToken = process.env.TOKEN;
        }
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

router.get("/profile", isAuthenticated, async (req, res, next) => {
  const taskData = await userTasks.findOne({ user_id: req.session.userId });
  const userData = await User.findOne({ unique_id: req.session.userId });
  var choosedTasksArray = taskData.choosed_tasks;
  var approvedTasksArray = taskData.approved_tasks;
  var declinedTasksArray = taskData.declined_tasks;
  var pendingTasksArray = taskData.pending_tasks;

  const choosedResults = choosedTasksArray.map(function (data) {
    return {
      task_title: data.task_title,
      task_description: data.task_description,
      task_id: data.task_id,
      task_category: data.task_category,
    };
  });

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
    choosedResults: choosedResults,
    approvedResults: approvedResults,
    declinedResults: declinedResults,
    pendingResults: pendingResults,
    userData: userData,
  });
});

router.get("/leaderboard", async (req, res, next) => {
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

  Database.forEach((data) => {
    console.log(`${data.same[0].username} : ${data.total_points}`);
  });

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

// router.get("/uploadtest", (req, res, next) => {
//   res.render("uploadtest")
// })

// router.post('/upload', upload.any(), async (req, res) => {
//   try {
//     const { body, files } = req;

//     for (let f = 0; f < files.length; f += 1) {
//       await uploadFile(files[f]);
//     }

//     console.log(body);
//     res.status(200).send('Form Submitted');
//   } catch (f) {
//     res.send(f.message);
//   }
// });

// const uuid = () => {
//   return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
//     var r = (Math.random() * 16) | 0,
//       v = c == "x" ? r : (r & 0x3) | 0x8;
//     return v.toString(16);
//   });
// };

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

// const getDriveService = () => {
//   const auth = new google.auth.GoogleAuth({
//     keyFile: "drive.json",
//     scopes: 'https://www.googleapis.com/auth/drive',
//   });
//   const drive = google.drive({ version: 'v3', auth });
//   return { drive };
// };

// const uploadFile = async (fileObject) => {
//   const bufferStream = new stream.PassThrough();
//   bufferStream.end(fileObject.buffer);
//   const { drive } = getDriveService();
//   const { data } = await drive({ version: 'v3' }).files.create({
//     media: {
//       mimeType: fileObject.mimeType,
//       body: bufferStream,
//     },
//     requestBody: {
//       name: fileObject.originalname,
//       parents: ['1IxnuvozpeOrGyrsgu53lSvZ4vQ_hD5eQ'],
//     },
//     fields: 'id,name',
//   });
//   console.log(`Uploaded file ${data.name} ${data.id}`);
// };

// function tConvert (time) {
//   time = time.toString ().match (/^([01]\d|2[0-3])(:)([0-5]\d)(:[0-5]\d)?$/) || [time];

//   if (time.length > 1) {
//     time = time.slice (1);
//     time[5] = +time[0] < 12 ? 'AM' : 'PM';
//     time[0] = +time[0] % 12 || 12;
//   }
//   return time.join ('');
// }

module.exports = router;
