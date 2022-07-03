const {
  validationResult
} = require('express-validator')

const HttpError = require('../models/http-error')

const User = require('../models/user')

const bcrypt = require('bcryptjs')

const jwt = require('jsonwebtoken');

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

  const {name,email,password} = req.body;


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


  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    const error = new HttpError('암호화에 실패하였습니다', 500);
    return next(error);
  }

  const createdUser = new User({
    name,
    email,
    image: req.file.path,
    password: hashedPassword,
    places: []
  })
  try {
    await createdUser.save()
  } catch (err) {
    const error = new HttpError('Creating accound failed.. please try again', 500)
    return next(error)
  }


  let token;
  try{
    token = jwt.sign(
      {
        userId: createdUser.id,
        email: createdUser.email
      },
      'jwt-donotshareyourtoken',
      {
        expiresIn: '1h'
      })
  }catch(err){
    const error = new HttpError('토큰 생성에 실패하였습니다.',500)
    return next(error);
  }
  
  res.status(201).json({
    userId: createdUser.id,
    email: createdUser.email,
    token: token
  })

};





const login = async (req, res, next) => {
  
  const {email,password} = req.body;

  let identifiedUser;
  try {
    identifiedUser = await User.findOne({email: email})
  } catch (err) {
    const error = new HttpError('알 수 없는 오류로 인해 로그인에 실패하였습니다.',500)
    return next(error)
  }

  if (!identifiedUser) {
    const error = new HttpError(' 이메일 또는 비밀번호 형식이 잘못되었습니다.', 401)
    return next(error)
  }

  let isValidPassword = false;
  
  try {
    // 지금 접속을 시도하는 사람이 입력한 email을 db에서 확인하여 입력과 일치하는 이메일을 찾은 뒤,
    // 입력한 비밀번호와 db 내 hashed password를 비교한다.
    isValidPassword = await bcrypt.compare(password, identifiedUser.password)
  } catch (err) {
    const error = new HttpError('암호화에 오류가 발생하였습니다.', 500)
    return next(error);
  }
  // false값을 반환하더라도 catch문으로 넘어가지 않기에 (error가 아닌 false 반환) false 처리 logic 작성
  if (!isValidPassword) {
    const error = new HttpError('이메일 또는 비밀번호의 형식이 잘못되었습니다.', 401)
    return next(error);
  }


  let token;
  try{
    token = jwt.sign(
      {userId: identifiedUser.id, email: identifiedUser.email},
      'jwt-donotshareyourtoken',
      {expiresIn: '1h'})
  }catch(err){
    const error = new HttpError('토큰 생성에 실패하였습니다.',500)
    return next(error);
  }

  res.json({
    userId: identifiedUser.id,
    email:identifiedUser.email,
    token:token
  });
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;