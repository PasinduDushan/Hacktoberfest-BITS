const express = require("express");
const router = express.Router();
const User = require("../models/user");
const userTasks = require("../models/userTasks");
const Tasks = require("../models/tasks");
const Admin = require("../models/admin");
const Tests = require("../models/tests");
const IMP = require("../models/confidential")
const nodemailer = require("nodemailer");
require("dotenv").config();

const isAuthenticated = (req, res, next) => {
  if (!req.session.userId) {
    res.redirect("/login");
  } else {
    next();
  }
};

const isAdmin = (req, res, next) => {
  if (!req.session.adminToken) {
    return res.json({ code: 403, message: "Unauthorized" });
  }
  if (req.session.adminToken !== process.env.TOKEN) {
    res.json({ code: 400, message: "Invalid trust token" });
  } else {
    next();
  }
};

router.get("/", isAuthenticated, isAdmin, async (req, res, next) => {
  const userData = await User.findOne({ unique_id: req.session.userId });

  if (userData.adminUser) {
    const taskdata = await Admin.findOne({ number: 1 });
    const tasks = taskdata.taskData;

    const choosedResults = tasks.map(function (data) {
      return {
        username: data.username,
        userid: data.userId,
        task_title: data.task_title,
        task_description: data.task_description,
        task_id: data.task_id,
        task_category: data.task_category,
        project_url: data.project_url,
        feedback: data.feedback,
      };
    });

    res.render("admin", {
      taskData: choosedResults,
    });
  } else {
    res.send(
      "This is a restricted area. Please do not try to access this page."
    );
  }
});

router.post(
  "/task/approve/:id/:user",
  isAuthenticated,
  isAdmin,
  async (req, res, next) => {
    const userData = await User.findOne({ unique_id: req.params.user });
    const task_dat = await Tasks.findOne({ task_id: req.params.id });
    if (!userData || !task_dat) {
      res.sendStatus(404);
    } else {
      const taskData = await userTasks.findOne({ user_id: req.params.user });
      const Admindata = await Admin.findOne({ number: 1 });

      var pendingTasksArray = taskData.pending_tasks;
      var adminTasksArray = Admindata.taskData;
      const choosedResults = pendingTasksArray
      .filter(function (data) {
        return data.task_id === parseInt(req.params.id);
      })
      .map(function (data) {
        return {
          id: data._id,
          task_title: data.task_title,
          task_description: data.task_description,
          task_id: data.task_id,
          task_category: data.task_category,
        };
      });

      const adminChoosedResults = adminTasksArray
      .filter(function (data) {
        return data.task_id === parseInt(req.params.id);
      })
      .map(function (data) {
        return {
          id: data._id,
          task_title: data.task_title,
          task_description: data.task_description,
          task_id: data.task_id,
          task_category: data.task_category,
        };
      });

      userTasks
        .findOne({ user_id: req.params.user })
        .then((task) => {
          task.approved_tasks.push({
            task_title: task_dat.task_title,
            task_description: task_dat.task_description,
            task_id: task_dat.task_id,
            task_category: task_dat.task_category,
          });
          task
            .save()
            .then(() => {
              return "Success";
            })
            .catch(console.log);
        })
        .catch(console.log);

      await userTasks.updateOne({ user_id: req.params.user }, [
        {
          $set: {
            total_points: {
              $add: ["$total_points", parseInt(req.body.points)],
            },
          },
        },
      ]);

      console.log(choosedResults[0].id)
      console.log(adminChoosedResults[0].id)

      await userTasks.update(
        { _id: taskData._id },
        { $pull: { pending_tasks: { _id: choosedResults[0].id } } }
      );
      await Admin.update(
        { _id: Admindata._id },
        { $pull: { taskData: { _id: adminChoosedResults[0].id } } }
      );

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
          to: userData.email,
          subject: `Hello ${userData.username}`,
          html: `<p>Your task with the ID <b>${req.params.id}</b> has been accepted and will be counted in the competition.<br><br>- Good Luck -<br>BITS Task Reviewing Commitee</p>`, // plain text body
        });

        console.log("Message sent: %s", info.messageId);
      }
      main().catch(console.error);
      res.redirect("/admin");
    }
  }
);

router.post(
  "/task/decline/:id/:user",
  isAuthenticated,
  isAdmin,
  async (req, res, next) => {
    const userData = await User.findOne({ unique_id: req.params.user });
    const task_dat = await Tasks.findOne({ task_id: req.params.id });
    if (!userData || !task_dat) {
      res.sendStatus(404);
    } else {
      const taskData = await userTasks.findOne({ user_id: req.params.user });
      const Admindata = await Admin.findOne({ number: 1 });

      var pendingTasksArray = taskData.pending_tasks;
      var adminTasksArray = Admindata.taskData;
      const choosedResults = pendingTasksArray
      .filter(function (data) {
        return data.task_id === parseInt(req.params.id);
      })
      .map(function (data) {
        return {
          id: data._id,
          task_title: data.task_title,
          task_description: data.task_description,
          task_id: data.task_id,
          task_category: data.task_category,
        };
      });

      const adminChoosedResults = adminTasksArray
      .filter(function (data) {
        return data.task_id === parseInt(req.params.id);
      })
      .map(function (data) {
        return {
          id: data._id,
          task_title: data.task_title,
          task_description: data.task_description,
          task_id: data.task_id,
          task_category: data.task_category,
        };
      });

      userTasks
        .findOne({ user_id: req.params.user })
        .then((task) => {
          task.declined_tasks.push({
            task_title: task_dat.task_title,
            task_description: task_dat.task_description,
            task_id: task_dat.task_id,
            task_category: task_dat.task_category,
            denial_reason: req.body.denialreason,
          });
          task
            .save()
            .then(() => {
              return "Success";
            })
            .catch(console.log);
        })
        .catch(console.log);

      await userTasks.update(
        { _id: taskData._id },
        { $pull: { pending_tasks: { _id: choosedResults[0].id } } }
      );
      await Admin.update(
        { _id: Admindata._id },
        { $pull: { taskData: { _id: adminChoosedResults[0].id } } }
      );

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
          to: userData.email,
          subject: `Hello ${userData.username}`,
          html: `<p>Your task with the ID <b>${req.params.id}</b> has been rejected for the following reason. Please fix the issue specified below and then re-submit your task.<br><b>Reason: ${req.body.denialreason}</b><br><br>- Good Luck -<br>BITS Task Reviewing Commitee</p>`, // plain text body
        });

        console.log("Message sent: %s", info.messageId);
      }
      main().catch(console.error);

      res.redirect("/admin");
    }
  }
);

router.post(
  "/test/add",
  isAuthenticated,
  isAdmin,
  async (req, res, next) => {
    let c;
    Tests.findOne({}, async (err, data) => {
      if (data) {
        const testdata = await Tests.find().limit(1).sort({ $natural: -1 });
        c = testdata[0].test_id + 100;
      } else {
        c = 100;
      }

      let newTest = new Tests({
        test_id: c,
        test_name: req.body.name,
        test_description: req.body.description,
        createdAt: new Date(req.body.date),
        test_grade: req.body.grade,
        test_link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        testEnabled: false,
        test_type: req.body.type
      });

      newTest.save((err, Data) => {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully added records for user tasks");
        }
      });

      res.redirect("/admin");
    });
  }
);

router.get("/tests", isAuthenticated, isAdmin, async(req, res, next) => {
  const test_data = await Tests.find();
  res.render("tests", {
    test_data: test_data
  })
})

router.post("/test/enable/:id", isAuthenticated, isAdmin, async(req, res, next) => {
  const test_data = await Tests.findOne({ test_id: parseInt(req.params.id) });
  if(!test_data) {
    res.json({ "code": 404, "message": "Test not found" });
  } else {
    await Tests.updateOne(
      { 
        test_id: parseInt(req.params.id) 
      }, 
      { 
        testEnabled: true,
        test_link: req.body.link 
      });
    res.redirect("/admin/tests");
  }
})

router.post("/test/disable/:id", isAuthenticated, isAdmin, async(req, res, next) => {
  const test_data = await Tests.findOne({ test_id: parseInt(req.params.id) });
  if(!test_data) {
    res.json({ "code": 404, "message": "Test not found" });
  } else {
    await Tests.updateOne(
      { 
        test_id: parseInt(req.params.id) 
      }, 
      { 
        testEnabled: false,
        test_link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
      });
    res.redirect("/admin/tests");
  }
})

router.get(
  "/tasks/coding",
  isAuthenticated,
  isAdmin,
  async (req, res, next) => {
    const data = await Admin.findOne({ number: 1 });
    const tasks = data.taskData;

    var codingTasksArray = tasks
      .filter(function (data) {
        return data.task_category === "CODING";
      })
      .map(function (data) {
        return {
          id: data._id,
          task_title: data.task_title,
          task_description: data.task_description,
          task_id: data.task_id,
          task_category: data.task_category,
        };
      });

    console.log(codingTasksArray);
    console.log("-----------------------");
    const uniqueArray = [
      ...new Map(codingTasksArray.map((m) => [m.task_id, m])).values(),
    ];
    console.log(uniqueArray);
    console.log("-----------------------");

    let length = [];

    uniqueArray.forEach((data) => {
      var array = tasks
        .filter(function (mesure) {
          return mesure.task_id === data.task_id;
        })
        .map(function (mesure) {
          return {
            id: mesure._id,
            task_id: mesure.task_id,
          };
        });

      length.push(array.length);
    });

    res.render("coding", {
      uniqueArray: uniqueArray,
      length: length,
    });
  }
);

router.get(
  "/tasks/design",
  isAuthenticated,
  isAdmin,
  async (req, res, next) => {
    const data = await Admin.findOne({ number: 1 });
    const tasks = data.taskData;

    const designTasksArray = tasks
      .filter(function (data) {
        return data.task_category === "DESIGN";
      })
      .map(function (data) {
        return {
          id: data._id,
          task_title: data.task_title,
          task_description: data.task_description,
          task_id: data.task_id,
          task_category: data.task_category,
        };
      });

    console.log(designTasksArray);
    console.log("-----------------------");
    const uniqueArray = [
      ...new Map(designTasksArray.map((m) => [m.task_id, m])).values(),
    ];
    console.log(uniqueArray);
    console.log("-----------------------");

    let length = [];

    uniqueArray.forEach((data) => {
      var array = tasks
        .filter(function (mesure) {
          return mesure.task_id === data.task_id;
        })
        .map(function (mesure) {
          return {
            id: mesure._id,
            task_id: mesure.task_id,
          };
        });

      length.push(array.length);
    });

    res.render("design", {
      uniqueArray: uniqueArray,
      length: length,
    });
  }
);

router.get(
  "/tasks/explore",
  isAuthenticated,
  isAdmin,
  async (req, res, next) => {
    const data = await Admin.findOne({ number: 1 });
    const tasks = data.taskData;

    const exploreTasksArray = tasks
      .filter(function (data) {
        return data.task_category === "EXPLORE";
      })
      .map(function (data) {
        return {
          id: data._id,
          task_title: data.task_title,
          task_description: data.task_description,
          task_id: data.task_id,
          task_category: data.task_category,
        };
      });

    console.log(exploreTasksArray);
    console.log("-----------------------");
    const uniqueArray = [
      ...new Map(exploreTasksArray.map((m) => [m.task_id, m])).values(),
    ];
    console.log(uniqueArray);
    console.log("-----------------------");

    let length = [];

    uniqueArray.forEach((data) => {
      var array = tasks
        .filter(function (mesure) {
          return mesure.task_id === data.task_id;
        })
        .map(function (mesure) {
          return {
            id: mesure._id,
            task_id: mesure.task_id,
          };
        });

      length.push(array.length);
    });

    res.render("explore", {
      uniqueArray: uniqueArray,
      length: length,
    });
  }
);

router.get(
  "/tasks/coding/:id",
  isAuthenticated,
  isAdmin,
  async (req, res, next) => {
    const data = await Tasks.findOne({ task_id: req.params.id });
    const admin = await Admin.findOne({ number: 1 });
    const tasks = admin.taskData;
    if (data) {
      const codingTasksArray = tasks
        .filter(function (data) {
          return data.task_id === parseInt(req.params.id);
        })
        .map(function (data) {
          return {
            id: data._id,
            username: data.username,
            userid: data.userId,
            task_title: data.task_title,
            task_description: data.task_description,
            task_id: data.task_id,
            task_category: data.task_category,
            project_url: data.project_url,
            feedback: data.feedback,
          };
        });

      res.render("codingpage", {
        codingTasksArray: codingTasksArray,
      });
    } else {
      return res.json({
        code: 404,
        message:
          "Task ID not found. If you think this is a mistake please message +94776976673",
      });
    }
  }
);

router.get(
  "/tasks/design/:id",
  isAuthenticated,
  isAdmin,
  async (req, res, next) => {
    const data = await Tasks.findOne({ task_id: req.params.id });
    const admin = await Admin.findOne({ number: 1 });
    const tasks = admin.taskData;
    if (data) {
      const designTasksArray = tasks
        .filter(function (data) {
          return data.task_id === parseInt(req.params.id);
        })
        .map(function (data) {
          return {
            id: data._id,
            username: data.username,
            userid: data.userId,
            task_title: data.task_title,
            task_description: data.task_description,
            task_id: data.task_id,
            task_category: data.task_category,
            project_url: data.project_url,
            feedback: data.feedback,
          };
        });

      res.render("designpage", {
        designTasksArray: designTasksArray,
      });
    } else {
      return res.json({
        code: 404,
        message:
          "Task ID not found. If you think this is a mistake please message +94776976673",
      });
    }
  }
);

router.get(
  "/tasks/explore/:id",
  isAuthenticated,
  isAdmin,
  async (req, res, next) => {
    const data = await Tasks.findOne({ task_id: req.params.id });
    const admin = await Admin.findOne({ number: 1 });
    const tasks = admin.taskData;
    if (data) {
      const exploreTasksArray = tasks
        .filter(function (data) {
          return data.task_id === parseInt(req.params.id);
        })
        .map(function (data) {
          return {
            id: data._id,
            username: data.username,
            userid: data.userId,
            task_title: data.task_title,
            task_description: data.task_description,
            task_id: data.task_id,
            task_category: data.task_category,
            project_url: data.project_url,
            feedback: data.feedback,
          };
        });

      res.render("explorepage", {
        exploreTasksArray: exploreTasksArray,
      });
    } else {
      return res.json({
        code: 404,
        message:
          "Task ID not found. If you think this is a mistake please message +94776976673",
      });
    }
  }
);

router.get("/power", isAuthenticated, isAdmin, async(req, res, next) => {
  const data = await IMP.findOne({ power_admin: 1 });
  if(1 !== req.session.userId){
    return res.json({ "code": 403, "message": "You are not authorized to access this page" })
  } else {
    res.render("power", {
      data: data
    });
  }
})

router.post("/competition/enable", isAuthenticated, isAdmin, async(req, res, next) => {
  if(1 !== req.session.userId){
    return res.json({ "code": 403, "message": "You are not authorized to access this page" })
  } else {
    await IMP.updateOne(
      {
        power_admin: 1
      },{
        competition_enabled: true
      }
    )
  }

  res.redirect("/admin/power")
})

router.post("/competition/disable", isAuthenticated, isAdmin, async(req, res, next) => {
  if(1 !== req.session.userId){
    return res.json({ "code": 403, "message": "You are not authorized to access this page" })
  } else {
    await IMP.updateOne(
      {
        power_admin: 1
      },{
        competition_enabled: false
      }
    )
  }

  res.redirect("/admin/power")
})

module.exports = router;
