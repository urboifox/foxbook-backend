const express = require("express");
const router = express.Router();
const usersController = require("../controllers/users.controller");
const multer = require("multer");
const verifyToken = require("../middlewares/verifyToken");
const allowedTo = require("../middlewares/allowedTo");
const userRoles = require("../utils/userRoles");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads");
  },
  filename: function (req, file, cb) {
    const ext = file.mimetype.split("/")[1];
    const fileName = `user-${Date.now()}.${ext}`;
    cb(null, fileName);
  },
});
const fileFilter = (req, file, cb) => {
  const type = file.mimetype.split("/")[0];
  if (type === `image`) {
    cb(null, true);
  } else {
    cb(appError.create(`The file must be an image`, 400), false);
  }
};
const upload = multer({ storage, fileFilter });

router.route("/").get(verifyToken, usersController.getAllUsers);

router.post("/register", upload.single("avatar"), usersController.register);
router.post("/login", usersController.login);

router
  .route("/:userId")
  .get(usersController.getUser)
  .delete(verifyToken, allowedTo(userRoles.ADMIN), usersController.deleteUser)
  .patch(usersController.updateUser);

router.post("/filter", usersController.filterUsers);

module.exports = router;
