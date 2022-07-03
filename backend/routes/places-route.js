const express = require('express');

const {
  check
} = require('express-validator');

const placesControllers = require('../controllers/places-controllers')

const fileUpload = require('../middleware/file-upload')

const authJsonWebToken = require('../middleware/auth-jwt')


const router = express.Router();

// router.get은 app.js에서 사용하고 있는 초기 필터 뒤에 경로를 추가하는 기능이다.
// app.js에서는 app.use를 통해 기본 경로를 /api/places로 설정하고 있다.
// 그 뒤에 추가적인 경로가 필요하다면, 해당 router.get 메서드의 경로를 붙여 추가할 수 있다.
router.get('/:pid', placesControllers.getPlaceById);

router.get('/user/:uid', placesControllers.getPlacesByUserId)


// jwt이 유효한지 확인하기 위한 middleware
// 위에서부터 아래로 읽기때문에, 위 router에 대한 request가 열려 있는지 확인한 뒤
// 유효하지 않은 token이라면 아래의 post,patch에 대해 reject한다.



router.use(authJsonWebToken);



// '/' path로 post 요청을 하면, title 프로퍼티가 isEmpty() 비어있지 not() 않은지 확인한다.
router.post('/',
fileUpload.single('image')
,[
  check('title').notEmpty().bail(),
  check('description').isLength({
    min: 5
  }).bail(),
  check('address').notEmpty().bail()
  
], placesControllers.createPlace)

// 같은 경로로 또 다른 get 요청이 있다면 충돌이 발생하지만, patch와 get은 충돌이 일어나지 않는다.
router.patch('/:pid',
  fileUpload.single('image'),
  [
  check('title').notEmpty().bail(),
  check('description').isLength({ min: 5 }).bail(),
], placesControllers.updatePlaceById)

router.delete('/:pid', placesControllers.deletePlaceById)

module.exports = router;