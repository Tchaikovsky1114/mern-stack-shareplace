
const {
  validationResult
} = require('express-validator')

const HttpError = require('../models/http-error')

const User = require('../models/user')


const getUsers = async (req, res, next) => {
  // 찾고자 하는 documents의 양이 많다면, negative 방식을 사용하여 필요없는 document를 제거하고 불러올 수 있다.
  let users;
  try {
    users = await User.find({}, '-password');
  } catch (err) {
    const error = new HttpError('Fetching users failed', 500)
    return next(error)
  }
  res.json({
    users: users.map(user => user.toObject({
      getters: true
    }))
  })
};







const signup = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const error = new HttpError('입력 정보를 확인해주세요.', 422)
    return next(error)
  }

  const {
    name,
    email,
    password,
  } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({
      email: email
    })
  } catch (err) {
    const error = new HttpError('Signing up failed, please try again later', 500)
    return next(error);
  }

  if (existingUser) {
    const error = new HttpError('Email exists already, please login instead', 422)
    return next(error);
  }

  const createdUser = new User({
    name,
    email,
    image: req.file.path,
    password,
    places: []
  })

  try {
    await createdUser.save()
  } catch (err) {
    const error = new HttpError('Creating accound failed.. please try again', 500)
    return next(error)
  }
  res.status(201).json({
    user: createdUser.toObject({
      getters: true
    },
    )
  });
};

const login = async (req, res, next) => {
  const {
    email,
    password
  } = req.body;
  
  let identifiedUser;
  try {
    identifiedUser = await User.findOne({
      email: email
    })
  } catch (err) {
    const error = new HttpError('Logging is failed. please try again')
    return next(error)
  }

  if (!identifiedUser || identifiedUser.password !== password) {
    const error = new HttpError(' email or password is invalid. credentials seem to be wrong.', 401)
    return next(error)
  }
  res.status(200).json({message: 'Logged in',
  user: identifiedUser.toObject({getters:true})
});
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;