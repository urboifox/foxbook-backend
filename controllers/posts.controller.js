const httpStatus = require("../utils/httpStatus");
const Post = require("../models/post.model");
const asyncWrapper = require("../middlewares/asyncWrapper");
const appError = require("../utils/appError");
const User = require("../models/user.model");
const fs = require("fs");
const { uploadFile } = require("../utils/s3");

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
  const file = req.file;

  let response;
  if (file) {
    response = await uploadFile(file).catch((err) => {
      console.log(`error in uploading file: ${err}`);
    });
  }

  const newPost = new Post({
    ...data,
    image: response?.Location,
  });

  await newPost.save();
  const user = await User.findById(newPost.user._id);

  if (!user) {
    return next(appError(`User not found`, 404, httpStatus.FAIL));
  }

  user.posts.push(newPost);
  await user.save();

  const path = `${__dirname}/../uploads/${response?.Key}`;
  if (fs.existsSync(path)) {
    fs.unlinkSync(path);
  }

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

  const updatedPost = await Post.findOneAndUpdate(
    { _id: postId },
    { $set: { title, content } },
    { new: true }
  );

  if (!updatedPost) {
    return next(appError(`Failed to update the post`, 500, httpStatus.FAIL));
  }

  // Update the user's posts array
  const user = await User.findById(post.user._id);

  // Find and update the old post in the user's posts array
  const index = user.posts.findIndex((p) => p._id.toString() === postId);

  if (index !== -1) {
    user.posts[index] = updatedPost;
    await user.save();
  }

  res.json({ status: httpStatus.SUCCESS, data: { post: updatedPost } });
});

module.exports = {
  getAllPosts,
  getPost,
  addPost,
  deletePost,
  updatePost,
};
