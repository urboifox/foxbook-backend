const httpStatus = require("../utils/httpStatus");
const Post = require("../models/post.model");
const asyncWrapper = require("../middlewares/asyncWrapper");
const appError = require("../utils/appError");

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

const addPost = asyncWrapper(async (req, res) => {
  const { title, description } = req.body;
  const newPost = new Post({
    title,
    description,
    image: req.file.filename || null,
  });

  await newPost.save();
  res.status(201).json({ status: httpStatus.SUCCESS, data: { post: newPost } });
});

const deletePost = asyncWrapper(async (req, res, next) => {
  const postId = req.params.postId;
  const post = await Post.findById(postId);
  if (!post) {
    return next(appError(`Post not found`, 404, httpStatus.FAIL));
  }
  await Post.findByIdAndDelete(postId);
  res.json({ status: httpStatus.SUCCESS, data: null });
});

const updatePost = asyncWrapper(async (req, res, next) => {
  const postId = req.params.postId;
  const post = await Post.findById(postId);
  if (!post) {
    return next(appError(`Post not found`, 404, httpStatus.FAIL));
  }
  const newPost = await Post.updateOne({ _id: postId }, req.body);
  res.json({ status: httpStatus.SUCCESS, data: { post: newPost } });
});

const filterPosts = asyncWrapper(async (req, res) => {
  const deletedPosts = await Post.deleteMany({ image: null });
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
