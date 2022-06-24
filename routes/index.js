const express = require("express");
const router = express.Router();
const User = require("../models/user");
const Verification = require("../models/verification");
const nodemailer = require("nodemailer");
const { google } = require("googleapis");

const id = "1_s_E11Xn4DqW0BQ4lttvRzCcnc-PORbOrlSIWKnkv9k";

router.get("/", (req, res, next) => {
  return res.render("index.ejs");
});

router.post("/", async (req, res, next) => {
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

            let verification_link = uuid();
            let bits_id = com_id();

            let newPerson = new User({
              unique_id: c,
              email: personInfo.email,
              username: personInfo.username,
              school: personInfo.school,
              fullname: personInfo.fullname,
              age: personInfo.age,
              competitor_id: "bits22-" + bits_id,
              password: personInfo.password,
              passwordConf: personInfo.passwordConf,
              verified: false,
            });

            let newVerification = new Verification({
              unique_id: c,
              verification_link: verification_link,
              verified: false,
            });

            newVerification.save((err, Data) => {
              if (err) {
                console.log(err);
              } else {
                console.log("Sucessfully added verification");
              }
            });

            (async () => {
              try {
                const { sheets } = await authentication();
                const { fullname, email, school, age } = req.body;

                const writeReq = await sheets.spreadsheets.values.append({
                  spreadsheetId: id,
                  range: "Sheet1",
                  valueInputOption: "USER_ENTERED",
                  resource: {
                    values: [
                      [fullname, email, age, school, "bits22-" + bits_id],
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
                    html: `<p>Hello there, Welcome to BITS'22 organized by ACICTS of Ananda College Colombo. Please verify all information below before continuing, If there are any issues please contact oe of our site admins immediately. If everything is correct please click below link to verify your email</b><br><br><b>Information Provided</b><ul><li>Username: ${personInfo.username}</li><li>Email: ${personInfo.email}</li><li>Password: ********</li></ul><br><b>Confirmation Link - http://localhost:3000/verification/${verification_link}`, // plain text body
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

router.get("/verification/:id", (req, res, next) => {
  Verification.findOne({ verification_link: req.params.id }, (err, data) => {
    if (!data.verified) {
      data.verified = true;

      data.save((err, Person) => {
        if (err) console.log(err);
        else res.send("This email is successfully verified");
      });

      User.findOne({ unique_id: data.unique_id }, (err, Person) => {
        Person.verified = true;

        Person.save((err, Person) => {
          if (err) console.log(err);
        });
      });
    } else {
      res.send("This email is already verified");
    }
  });
});

router.get("/login", (req, res, next) => {
  return res.render("login.ejs");
});

router.post("/login", (req, res, next) => {
  User.findOne({ email: req.body.email }, (err, data) => {
    if (data) {
      if (data.password == req.body.password) {
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

router.get("/profile", (req, res, next) => {
  User.findOne({ unique_id: req.session.userId }, (err, data) => {
    if (!data) {
      res.redirect("/");
    } else {
      return res.render("data.ejs", { name: data.username, email: data.email });
    }
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

const uuid = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

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
