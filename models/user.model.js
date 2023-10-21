const mongoose = require("mongoose");
const userRoles = require("../utils/userRoles");

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  age: String,
  password: {
    type: String,
    required: true,
  },
  token: String,
  role: {
    type: String,
    enum: [userRoles.USER, userRoles.ADMIN],
    default: userRoles.USER,
  },
  avatar: {
    type: String,
    default: "avatar.png",
  },
});

const User = mongoose.model("User", userSchema);

module.exports = User;
