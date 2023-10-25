const httpStatus = require("../utils/httpStatus");
const Post = require("../models/post.model");
const asyncWrapper = require("../middlewares/asyncWrapper");
const appError = require("../utils/appError");
const User = require("../models/user.model");
const fs = require("fs");

const getAllPosts = asyncWrapper(async (_, res) => {
  const posts = await Post.find({}, { __v: false });
  res.status(200).json({ status: httpStatus.SUCCESS, data: { posts } });
});

const getPost = asyncWrapper(async (req, res, next) => {
  const postId = req.params.postId;
  const post = await Post.findById(postId);
  if (!post) {
    return next(appError(`Post not found`, 404, httpStatus.FAIL));
  }
  res.status(200).json({ status: httpStatus.SUCCESS, data: { post } });
});

const addPost = asyncWrapper(async (req, res, next) => {
  const data = await req.body;

  const newPost = new Post({
    ...data,
    image: req.file?.filename,
  });

  await newPost.save();
  const user = await User.findById(newPost.user._id);

  if (!user) {
    return next(appError(`User not found`, 404, httpStatus.FAIL));
  }

  user.posts.push(newPost);
  await user.save();

  res
    .status(201)
    .json({ status: httpStatus.SUCCESS, data: { post: newPost, data: data } });
});

const deletePost = asyncWrapper(async (req, res, next) => {
  const postId = req.params.postId;
  const post = await Post.findById(postId);
  if (!post) {
    return next(appError(`Post not found`, 404, httpStatus.FAIL));
  }

  if (post.image) {
    const path = `${__dirname}/../uploads/${post.image}`;
    if (fs.existsSync(path)) {
      fs.unlinkSync(path);
    }
  }
  await Post.findByIdAndDelete(postId);
  const user = await User.findById(post.user._id);

  user.posts = user.posts.filter((p) => p._id.toString() !== postId);
  await user.save();
  res.json({ status: httpStatus.SUCCESS, data: null });
});

const updatePost = asyncWrapper(async (req, res, next) => {
  const postId = req.params.postId;
  const post = await Post.findById(postId);
  if (!post) {
    return next(appError(`Post not found`, 404, httpStatus.FAIL));
  }

  const { title, content } = req.body;

  const newPost = await Post.findByIdAndUpdate(postId, {
    $set: { title, content },
  });

  const user = await User.findById(post.user._id);

  user.posts = user.posts.filter((p) => p._id !== postId);
  user.posts.push(newPost);
  await user.save();

  res.json({ status: httpStatus.SUCCESS, data: { post: newPost } });
});

const filterPosts = asyncWrapper(async (req, res) => {
  const deletedPosts = await Post.deleteMany({ __v: 0 });
  res.json({ status: httpStatus.SUCCESS, data: { posts: deletedPosts } });
});

module.exports = {
  getAllPosts,
  getPost,
  addPost,
  deletePost,
  updatePost,
  filterPosts,
};
