const mongoose = require("mongoose");
const Schema = mongoose.Schema;

(adminSchema = new Schema({
  number: Number,
  taskData: [{ username: String, userId: Number, task_title: String, task_description: String, task_id: Number, task_category: String }]
})),
  (Admin = mongoose.model("Admin", adminSchema));

module.exports = Admin;
