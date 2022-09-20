const mongoose = require("mongoose");
const Schema = mongoose.Schema;

(taskSchema = new Schema({
    task_id: Number,
    task_title: String,
    task_description: String,
    big_description: String,
    task_category: String,
    advanceTask: Boolean
})),
  (Task = mongoose.model("Task", taskSchema));

module.exports = Task;
