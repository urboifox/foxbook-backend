const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now(),
  },
  user: {
    firstName: String,
    lastName: String,
    email: String,
    role: String,
    avatar: String,
    _id: String,
  },
  image: {
    type: String,
  },
});

const Post = mongoose.model("Post", postSchema);
module.exports = Post;
