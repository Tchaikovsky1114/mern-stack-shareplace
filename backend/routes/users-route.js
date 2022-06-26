const express = require('express');

const usersControllers = require('../controllers/users-controllers');

const {
  check
} = require('express-validator')

const router = express.Router();




router.get('/', usersControllers.getUsers)

router.post('/signup', [
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