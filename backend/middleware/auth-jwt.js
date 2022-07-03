
const HttpError = require('../models/http-error')

const jwt = require('jsonwebtoken')

module.exports = (req,res,next) => {
  // query parameters는 URL에서 물음표 다음에 오는 것들이다.
  // ex) ?token=something
  // token을 header에 작성함으로써 URL이 좀 더 깔끔하게 유지되고
  // 실제 metadata로 간주될 수 있다.

  //req.headers는 express에서 제공하며, request object의 headers property에 접근할 수 있게 한다.
  // = setHeaders Authorization.
  
  // 여기서의 토큰은 인증 헤더에 저장된 문자열(Bearer/Token)일 뿐이다.
  // Bearer 부분과 Token 부분중에서 필요한 것은 Token 부분이기에 split method 사용.
  if (req.method === 'OPTIONS') {
    return next();
  }
  try {
    const token = req.headers.authorization.split(' ')[1] // Authorization: Bearer TOKEN
    if(!token){
      throw new Error('인증 실패')
    }
    // verify는 decoding 된 payload를 반환한다. (앞서 signup에서  jwt sign메서드를 사용하여 생성한 jwt token.)
    // 그렇기 때문에 security key를 맞추어야 함.
    const decodedToken = jwt.verify(token,'jwt-donotshareyourtoken');

    // request에 동적 property추가
    // 인증이 필요한 또 다른 router 에서 사용할 수 있게 한다.
    req.userData = {userId: decodedToken.userId}
    
    next()
  }catch(err){
    const error = new HttpError('인증에 유효한 토큰이 존재하지 않습니다.',401);
    return next(error)
  }
  
}

