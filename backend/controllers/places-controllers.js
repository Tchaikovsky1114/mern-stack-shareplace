
const HttpError = require('../models/http-error')

const {validationResult} = require('express-validator');
const getCoordsForAddress = require('../util/location')
const Place = require('../models/place')
const User = require('../models/user');
const { default: mongoose } = require('mongoose');



const getPlaceById = async (req,res,next) => {
  // req.params.dynamicSegment를 통해 사용자가 입력한 값을 받아올 수 있다.
  const placeId = req.params.pid;

  // findbyId 는 save와 다르게 프로미스를 반환하지 않는다.
  // 그렇기 때문에 ID를 찾은 후 exec을 통해 promise를 반환하게 한다
  let place;
  try{
    place = await Place.findById(placeId).exec()  
  }catch(err){
    const error = new HttpError('Something wrong.', 500)
    // next를 통해 반환한다.
    return next(error)
  }
  

  if(!place) {
   const error = new HttpError('Could not find a places for the provided id.',404)
   return next(error);
  }
  // Mongoose의 getter // setter.
  // Getter를 사용하면 MongoDB의 데이터를 보다 사용자 친화적인 형식으로 변환할 수 있고
  // Setter를 사용하면 사용자 데이터가 MongoDB에 도달하기 전에 변환할 수 있다.
  
  // _id의 밑줄 없애기.(암묵적으로 생성된 id는 _id로 만들어진다.)
  // mongoose는 기본적으로 모든 문서에 문자열로 이루어진 ID를 추가한다.
  // Mongoose는 Express에서 res.json()을 사용하여 문서를 JSON으로 변환할 때 getter를 명시하지 않아도 기본적으로 실행한다.
  // 평소에는 기본값으로 사용하기에 직접 getters를 호출할 필요가 없다.
  res.json({place: place.toObject({getters: true})}); // shorthand

  //Mongoose의 getter//setter와 ES6의 getter//setter의 차이점.
  //Mongoose setter는 설정되는 값을 변경할 수 있다는 점에서 Es6의 setter (접근자 프로퍼티)와 다르다.

  
}

const getPlacesByUserId = async (req,res,next) => {
  const userId = req.params.uid;

  // find method를 사용하여 collection 내부의 (생성자 함수로 이미 collection은 지정되어 있음) documents를 탐색할 수 있다.
  // 값을 탐색할 때에는 키:값 형식으로 찾는다.
  // MongoDB에서의 find method는, find를 통해 찾은 결과로서 cursor를 반환한다.
  //즉, cursor는 find method를 통해 찾은 쿼리 결과다.
  // 또한 커서로 돌아와서 다른 결과들을 통해 계속 반복할 수 있다.
  // Mongoose에서도 커서를 얻을 수 있을 수 있는데 find method 대신 cursor속성을 통해 바로 찾을 수 있다.

  // let places;
  let userWithPlaces
  try{
    // places = await Place.find({ creator: userId }).exec()
    userWithPlaces = await User.findById(userId).populate('places');
  }catch(err){
    const error = new HttpError('something wrong. please ensure username.',500);
    return next(error);
  }
  if(!userWithPlaces || userWithPlaces.length === 0){
    return next( new HttpError('not exist userplaces',404))
  }
  res.json({places: userWithPlaces.places.map(place => place.toObject({getters: true}))})
}





const createPlace = async (req,res,next) => {
  // 작성한 validatiors를 관찰할 수 있게 만드는 validationResult.
  const errors= validationResult(req);
  if(!errors.isEmpty()){
    console.log(errors);
    // 비동기 코드로 작업할 때 throw는 express에서 올바르게 작동하지 않으므로, next를 사용한다.
    return next(new HttpError ('입력하신 정보가 유효하지 않습니다', 422));
  }
  const {title, description, address, creator} = req.body;
  let coordinates;
  try{
    coordinates = await getCoordsForAddress(address)
  }catch(err){
    return next(new HttpError ('Coordinates can not found. please try again'),500)
  }

  // place schema로 생성한 Place생성자 함수로 객체 인자 전달 
  const createdPlace = new Place({
    title,
    description,
    address,
    location:coordinates,
    image: 'https://lh5.googleusercontent.com/p/AF1QipMH_S511fGMCBX4Wjx5mgNamkO_oycZScZbp4Oe=w426-h240-k-no',
    creator
  })
  
  let user;

  try{
    user = await User.findById(creator);
  }catch(err){
    const error = new HttpError('Creating place failed. please try again',500)
    return next(error)
  }

  if(!user){
    const error = new HttpError('Could not find user for provided id',404);
    return next(error);
  }

  try{
    // save method는 promise를 반환하며 스키마 생성자 함수를 통해 추가한 documents를 저장하기 위해 필요한 MongoDB 코드를 처리하는 method이다.
    //await createdPlace.save();
    
    // 2개 이상의 Collection에서의 작업 수행.

    // Place collection에 creator Document를 업데이트하고,
    // User collection의 places에 Place Collection의 places가 등록되게 만들려면 save method로는 할 수 없다. 
    // 연관되지 않거나 서로 다른 여러개의 작업들을 실행할 수 있어야 한다.
    // 그리고 여러개의 작업 중 하나가 실패하면 전체 작업을 실행을 취소할 수도 있어야 한다.
    // 즉 하나라도 실패하면 바로 catch문으로 넘어가야 한다.
    // 여러개의 작업이 모두 성공할 때에만 문서를 변경하고 싶을 때에는 transactions와 session을 사용해야 한다.
    // transaction이 하는 일 : 서로 분리된 여러 작업을 수행하고, 개별적으로 취소할 수 있다.
    // transaction은 session을 기반으로 만들어진다.
    // 따라서 transaction으로 작업하려면 먼저 session을 시작하고, tarnsaction이 성공하면
    // session이 종료된 뒤 transaction이 commit 된다.
    // 쉽게 설명하자면, 여러개의 작업들을 하나 씩(transaction) 수행하고,
    // 최종적으로 완료 되었을 때에만 tarnsaction이 작업한 결과들을 session이 최종 승인(committed)한다는 것이다. 


    // 1. transactions을 수행 할 session 생성
    const session = await mongoose.startSession()
    // 2. transaction start
    session.startTransaction();
    // 3. 실제 작업 1. createdPlace 객체를 session에 저장한다.
    // transactions 전체가 성공해야하기에 먼저 sessions에 저장.
    await createdPlace.save({session: session});
    
    // 4. model 간 연결
    // 여기서 사용하는 push는 javascript의 arrayMethod가 아닌, mongoose에서 제공하는 method로서 델간의 연결 관계를 설정한다.
    // user는 User collection의 creator document다.
    user.places.push(createdPlace)
    // 5. 실제 작업 2. user에 save한다.
    await user.save({session: session})
    // 6. transactions 종료
    await session.commitTransaction();
    
  }catch(err){
    const error = new HttpError('Creating place failed, please try again',500)
    return next(error);
  }



  console.log(user);
  // 생성은 201
  res.status(201).json({place: createdPlace})
}




const updatePlaceById = async (req,res,next) => {
  const errors= validationResult(req);
  if(!errors.isEmpty()){
    console.log(errors);
    
    throw new HttpError ('입력하신 정보가 유효하지 않습니다', 422)
  }
  
  const {title, description} = req.body;
  
  const placeId = req.params.pid;
  
  let place;

  try{
    place = await Place.findById(placeId).exec()
  }catch(err){
    const error = new HttpError('Could not find place',500)
    return next(error)
  }

  place.title = title;
  place.description = description;
 
  try{
    await place.save()
  }catch(err){
    const error = new HttpError('Could not change place information',500)
    return next(error)
  }
  
  res.status(200).json({place: place.toObject({getters: true})})
}

const deletePlaceById = async (req,res,next) => {
  
  const placeId = req.params.pid;
  
  let place;

  try{
    // 기존 정보를 덮어쓰거나 변경하기 위해서는 poulate method를 사용하여 access 권한을 얻는다.
    // populate method를 사용하기 위해서는 collection 간의 연결이 존재해야 한다. User.places.ref <==> Place.creator.ref
    // populate method는 문서에 대한 추가 정보를 참조한다.
    // 여기에서는 Place schema에 대한 정보가 있기 때문에 Place의 creator를 참조한다.
    place = await Place.findById(placeId).populate('creator');
  }catch(err){
    const error = new HttpError('Could not delete place.',500)
    return next(error)
  }



  if(!place) {
    const error = new HttpError(' Could not find place for this id', 404)
    return next(error);
  }

  try{
    const session = await mongoose.startSession();
    session.startTransaction();
    await place.remove({session:session})
    place.creator.places.pull(place);
    await place.creator.save({session:session});
    await session.commitTransaction();   
  }
  catch(err){
    const error = new HttpError('Could not delete place.',500)
    return next(error)
  }
  res.status(200).json({message: "deleted complate"})
}

exports.getPlaceById = getPlaceById
exports.getPlacesByUserId = getPlacesByUserId
exports.createPlace = createPlace
exports.updatePlaceById = updatePlaceById
exports.deletePlaceById = deletePlaceById