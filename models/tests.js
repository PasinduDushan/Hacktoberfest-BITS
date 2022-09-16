const mongoose = require("mongoose");
const Schema = mongoose.Schema;

(testSchema = new Schema({
    test_id: Number,
    test_name: String,
    test_description: String,
    test_grade: String,
    test_link: String,
    createdAt: { 
      type:Date, 
      default: Date.now() 
    },
    expireAt:  { 
      type: Date, 
      default: undefined 
    }
})),
  (Test = mongoose.model("Test", testSchema));

module.exports = Test;
