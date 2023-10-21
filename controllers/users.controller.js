const httpStatus = require("../utils/httpStatus");
const User = require("../models/user.model");
const asyncWrapper = require("../middlewares/asyncWrapper");
const appError = require("../utils/appError");
const validator = require("validator");
const bcrypt = require("bcrypt");

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
  const { firstName, lastName, email, password, age, token, role } = req.body;
  const isEmailValid = validator.isEmail(email);
  if (!isEmailValid) {
    return next(appError(`Email is not valid`, 400, httpStatus.FAIL));
  }
  const oldUser = await User.findOne({ email });
  if (oldUser) {
    return next(appError(`Email Already exists`, 400, httpStatus.FAIL));
  }

  const hashedPass = await bcrypt.hash(password, 10);

  const newUser = new User({
    firstName,
    lastName,
    email,
    password: hashedPass,
    age: age || null,
    token: token || null,
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
    return next(appError(`Email is incorrect`));
  }
  const validPass = await bcrypt.compare(password, user.password);
  if (!validPass) {
    return next(appError(`Password is incorrect`));
  }
  res.json({ status: httpStatus.SUCCESS, data: { user: `Logged in!` } });
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
  const deletedUsers = await User.deleteMany({ avatar: null });
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
};
