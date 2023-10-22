const httpStatus = require("../utils/httpStatus");
const User = require("../models/user.model");
const asyncWrapper = require("../middlewares/asyncWrapper");
const appError = require("../utils/appError");
const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const generateJWT = require("../utils/generateJWT");

const getAllUsers = asyncWrapper(async (_, res) => {
  const users = await User.find({}, { __v: false });
  res.status(200).json({ status: httpStatus.SUCCESS, data: { users } });
});

const getUser = asyncWrapper(async (req, res, next) => {
  const userId = req.params.userId;
  const user = await User.findById(userId);
  if (!user) {
    return next(appError(`User not found`, 404, httpStatus.FAIL));
  }
  res.status(200).json({ status: httpStatus.SUCCESS, data: { User } });
});

const register = asyncWrapper(async (req, res, next) => {
  const { firstName, lastName, email, password, age, role } = req.body;
  const isEmailValid = validator.isEmail(email);
  if (!isEmailValid) {
    return next(appError(`Email is not valid`, 400, httpStatus.FAIL));
  }
  const oldUser = await User.findOne({ email });
  if (oldUser) {
    return next(appError(`Email Already exists`, 400, httpStatus.FAIL));
  }

  const hashedPass = await bcrypt.hash(password, 10);

  const jwt_token = generateJWT({
    email,
  });

  const newUser = new User({
    firstName,
    lastName,
    email,
    password: hashedPass,
    age: age || null,
    token: jwt_token,
    role,
    avatar: req.file?.filename,
  });

  await newUser.save();

  res.status(201).json({ status: httpStatus.SUCCESS, data: { user: newUser } });
});

const login = asyncWrapper(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(
      appError(`Email and password are required`, 500, httpStatus.FAIL)
    );
  }
  const user = await User.findOne({ email });
  if (!user) {
    return next(
      appError(`Email or password are incorrect`, 400, httpStatus.FAIL)
    );
  }
  const validPass = await bcrypt.compare(password, user.password);
  if (validPass) {
    // logged in success
    const token = generateJWT({
      email,
      _id: user._id,
      role: user.role,
    });
    res.json({ status: httpStatus.SUCCESS, data: { token } });
  } else {
    return next(
      appError(`Email or password are incorrect`, 400, httpStatus.FAIL)
    );
  }
});

const profile = asyncWrapper(async (req, res, next) => {
  const userId = req.currentUser._id;
  const user = await User.findById(userId, {
    __v: false,
    password: false,
    token: false,
  });
  if (!user) {
    return next(appError(`User not found`, 404, httpStatus.FAIL));
  }
  res.status(200).json({ status: httpStatus.SUCCESS, data: { user } });
});

const deleteUser = asyncWrapper(async (req, res, next) => {
  const userId = req.params.userId;
  const user = await User.findById(userId);
  if (!user) {
    return next(appError(`user not found`, 404, httpStatus.FAIL));
  }
  await User.findByIdAndDelete(userId);
  res.json({ status: httpStatus.SUCCESS, data: null });
});

const updateUser = asyncWrapper(async (req, res, next) => {
  const userId = req.params.userId;
  const user = await User.findById(userId);
  if (!user) {
    return next(appError(`User not found`, 404, httpStatus.FAIL));
  }
  const newUser = await User.updateOne({ _id: userId }, req.body);
  res.json({ status: httpStatus.SUCCESS, data: { user: newUser } });
});

const filterUsers = asyncWrapper(async (req, res) => {
  const deletedUsers = await User.deleteMany({ age: "69" });
  res.json({ status: httpStatus.SUCCESS, data: { users: deletedUsers } });
});

module.exports = {
  getAllUsers,
  getUser,
  register,
  login,
  deleteUser,
  updateUser,
  filterUsers,
  profile,
};
