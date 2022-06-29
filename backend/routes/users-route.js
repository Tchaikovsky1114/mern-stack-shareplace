const express = require('express');

const usersControllers = require('../controllers/users-controllers');

const {
  check
} = require('express-validator')

const router = express.Router();

const fileUpload = require('../middleware/file-upload')



router.get('/', usersControllers.getUsers)

// multer middleware 부착 (fileUpload.single('image'))
// key 값이 image인 파일을 가져온다.
router.post(
  '/signup',
  fileUpload.single('image'),
  [
    check('name').isLength({
      min: 3
    }),
    check('email').normalizeEmail().isEmail(),
    check('password').isLength({
      min: 8,
      max: 14
    })
  ], usersControllers.signup)

router.post('/login', usersControllers.login)


module.exports = router;