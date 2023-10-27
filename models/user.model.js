const mongoose = require("mongoose");
const userRoles = require("../utils/userRoles");
const Post = require("./post.model");

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
    default: "https://foxbook.s3.eu-central-1.amazonaws.com/avatar.png",
  },
  posts: [Post.schema],
});

const User = mongoose.model("User", userSchema);

module.exports = User;
