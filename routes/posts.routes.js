const express = require("express");
const router = express.Router();
const postsController = require("../controllers/posts.controller");
const multer = require("multer");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads");
  },
  filename: function (req, file, cb) {
    const ext = file.mimetype.split("/")[1];
    const fileName = `post-${Date.now()}.${ext}`;
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

router
  .route("/")
  .get(postsController.getAllPosts)
  .post(upload.single("image"), postsController.addPost);

router
  .route("/:postId")
  .get(postsController.getPost)
  .delete(postsController.deletePost)
  .patch(postsController.updatePost);

router.post("/filter", postsController.filterPosts);

module.exports = router;
