const httpStatus = require("../utils/httpStatus");
const User = require("../models/user.model");
const asyncWrapper = require("../middlewares/asyncWrapper");
const appError = require("../utils/appError");
const validator = require("validator");
const bcrypt = require("bcrypt");
const generateJWT = require("../utils/generateJWT");
const fs = require("fs");
const Post = require("../models/post.model");
const path = require("path");
const { uploadFile } = require("../utils/s3");

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
  res.status(200).json({ status: httpStatus.SUCCESS, data: { user } });
});

const register = asyncWrapper(async (req, res, next) => {
  const file = req.file;

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

  let response;
  if (file) {
    response = await uploadFile(file).catch((err) => {
      console.log(`error in uploading file: ${err}`);
    });
  }

  const newUser = new User({
    firstName,
    lastName,
    email,
    password: hashedPass,
    age: age || null,
    token: jwt_token,
    role,
    posts: [],
    avatar: response?.Location,
  });

  await newUser.save();

  const path = `${__dirname}/../uploads/${response?.Key}`;
  if (fs.existsSync(path)) {
    fs.unlinkSync(path);
  }

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

  const { firstName, lastName, age, email, role } = req.body;

  const file = req.file;

  try {
    let response;
    if (file) {
      response = await uploadFile(file).catch((err) => {
        console.log(`error in uploading file: ${err}`);
      });
    }

    await Post.updateMany(
      { "user._id": userId },
      {
        $set: {
          "user.firstName": firstName,
          "user.lastName": lastName,
          "user.age": age,
          "user.email": email,
          "user.role": role,
          "user.avatar": response?.Location,
        },
      }
    ).catch((err) => console.log(err));

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          firstName,
          lastName,
          age,
          email,
          role,
          avatar: response?.Location || user.avatar,
        },
      },
      { new: true }
    );

    console.log(updatedUser);

    const path = `${__dirname}/../uploads/${response?.Key}`;
    if (fs.existsSync(path)) {
      fs.unlinkSync(path);
    }

    res.json({ status: httpStatus.SUCCESS, data: { user: updatedUser } });
  } catch (error) {
    res.json({ status: httpStatus.FAIL, message: error.message });
  }
});

module.exports = {
  getAllUsers,
  getUser,
  register,
  login,
  deleteUser,
  updateUser,
  profile,
};
