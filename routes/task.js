const express = require("express");
const router = express.Router();
const User = require("../models/user");
const userTasks = require("../models/userTasks");
const IMP = require("../models/confidential")
const Tasks = require("../models/tasks");
const Admin = require("../models/admin");
var result = '# markdown-it rulezz!';

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

const isHypeUser = (req, res, next) => {
  if (req.session.hypertextUser){
    res.json({ "code": 403, "message": "Forbidden" })
  } else {
    next();
  }
}

const isEnabled = async (req, res, next) => {
  const data = await IMP.findOne({ power_admin: 1 });
  if(!data.competition_enabled){
    res.json({ "code": 403, "message": "Competition Has Not Started Yet. Please wait until 1st october" })
  } else {
    next();
  }
}

router.get("/:id", isEnabled, (req, res, next) => {
  Tasks.findOne({ task_id: req.params.id }, (err, data) => {
    if (!data) {
      res.send("No task was found with the given ID");
    } else {
      res.render("tasks", {
        id: data.task_id,
        title: data.task_title,
        description: data.big_description,
        result: result
      });
    }
  });
});

router.post("/addtask/success", isAuthenticated, isAdmin, async (req, res) => {
  let c;
  Tasks.findOne({}, async (err, data) => {
    if (data) {
      const taskdata = await Tasks.find().limit(1).sort({ $natural: -1 });
      c = taskdata[0].task_id + 100;
    } else {
      c = 100;
    }

    let target = req.body.advance
    let finalString = target.replaceAll('"', '')
    console.log(finalString)

    let newTask = new Tasks({
      task_id: c,
      task_title: req.body.title,
      task_description: req.body.smalldescription,
      task_category: req.body.category,
      big_description: req.body.bigdescription,
      advanceTask: finalString,
    });

    newTask.save((err, Data) => {
      if (err) {
        console.log(err);
      } else {
        console.log("Successfully added records for tasks");
      }
    });

    res.redirect("/admin");
  });
});

router.post("/choose/:id", isEnabled, isAuthenticated, isHypeUser, async (req, res, next) => {
  const task = await Tasks.findOne({ task_id: req.params.id });
  if (!task) {
    res.sendStatus(404);
  } else {
    const taskData = await Tasks.findOne({ task_id: req.params.id });
    userTasks
      .findOne({ user_id: req.session.userId })
      .then((task) => {
        task.choosed_tasks.push({
          task_title: taskData.task_title,
          task_description: taskData.task_description,
          task_id: taskData.task_id,
          task_category: taskData.task_category,
        });
        task
          .save()
          .then(() => {
            return "Success";
          })
          .catch(console.log);
      })
      .catch(console.log);

    res.redirect("/profile");
  }
});

router.post("/submit/:id", isEnabled, isAuthenticated, isHypeUser, async (req, res, next) => {
  const userData = await userTasks.findOne({ user_id: req.session.userId });
  if (!userData) {
    return res.send("User does not exists in the database");
  } else {
    const taskData = await userTasks.findOne({ user_id: req.session.userId });
    const task_dat = await Tasks.findOne({ task_id: req.params.id });
    const user = await User.findOne({ unique_id: req.session.userId });

    var choosedTasksArray = taskData.choosed_tasks;
    var pendingTasksArray = taskData.pending_tasks;

    const choosedResults = choosedTasksArray.map(function (data) {
      return {
        id: data._id,
        task_title: data.task_title,
        task_description: data.task_description,
        task_id: data.task_id,
        task_category: data.task_category,
      };
    });

    userTasks
      .findOne({ user_id: req.session.userId })
      .then((task) => {
        task.pending_tasks.push({
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
    Admin.findOne({ number: 1 })
      .then((task) => {
        task.taskData.push({
          username: user.username,
          userId: user.unique_id,
          task_title: task_dat.task_title,
          task_description: task_dat.task_description,
          task_id: task_dat.task_id,
          task_category: task_dat.task_category,
          project_url: req.body.url,
          feedback: req.body.feedback,
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
      { $pull: { choosed_tasks: { _id: choosedResults[0].id } } }
    );

    res.redirect("/profile");

    // console.log(taskData._id)

    // console.log(choosedResults[0].id)
  }
});

router.post("/resubmit/:id", isEnabled, isAuthenticated, isHypeUser, async (req, res, next) => {
  const userData = await userTasks.findOne({ user_id: req.session.userId });
  if (!userData) {
    return res.send("User does not exists in the database");
  } else {
    const taskData = await userTasks.findOne({ user_id: req.session.userId });
    const task_dat = await Tasks.findOne({ task_id: req.params.id });
    const user = await User.findOne({ unique_id: req.session.userId });

    var declinedTasksArray = taskData.declined_tasks;
    var pendingTasksArray = taskData.pending_tasks;

    const declinedResults = declinedTasksArray.map(function (data) {
      return {
        id: data._id,
        task_title: data.task_title,
        task_description: data.task_description,
        task_id: data.task_id,
        task_category: data.task_category,
      };
    });

    userTasks
      .findOne({ user_id: req.session.userId })
      .then((task) => {
        task.pending_tasks.push({
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
    Admin.findOne({ number: 1 })
      .then((task) => {
        task.taskData.push({
          username: user.username,
          userId: user.unique_id,
          task_title: task_dat.task_title,
          task_description: task_dat.task_description,
          task_id: task_dat.task_id,
          task_category: task_dat.task_category,
          project_url: req.body.url,
          feedback: req.body.feedback,
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
      { $pull: { declined_tasks: { _id: declinedResults[0].id } } }
    );

    res.redirect("/profile");

    // console.log(taskData._id)

    // console.log(choosedResults[0].id)
  }
});

module.exports = router;
