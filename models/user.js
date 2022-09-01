const mongoose = require("mongoose");
const Schema = mongoose.Schema;

(userSchema = new Schema({
  unique_id: Number,
  email: String,
  verified: Boolean,
  username: String,
  school: String,
  fullname: String,
  age: Number,
  competitor_id: String,
  password: String,
  passwordConf: String,
  adminUser: Boolean,
  createdAt: {
    type: Date,
    default: Date.now,
  },
})),
  (User = mongoose.model("User", userSchema));

module.exports = User;
