const mongoose = require("mongoose");
const Schema = mongoose.Schema;

(verificationSchema = new Schema({
  unique_id: Number,
  verification_link: String,
  verified: Boolean,
})),
  (Verification = mongoose.model("Verification", verificationSchema));

module.exports = Verification;
