const fs = require('fs');

const {validationResult} = require('express-validator');
const HttpError = require('../models/http-error')

const getCoordsForAddress = require('../util/location')

const Place = require('../models/place')
const User = require('../models/user');

const mongoose = require('mongoose');



const getPlaceById = async (req,res,next) => {
  const placeId = req.params.pid;

  let place;
  try{
    place = await Place.findById(placeId)
  }catch(err){
    const error = new HttpError('get place error ', 500)
    // next를 통해 반환한다.
    return next(error)
  }

  if(!place) {
   const error = new HttpError('Could not find a places for the provided id.',404)
   return next(error);
  }
  res.json({place: place.toObject({getters: true})});
}






const getPlacesByUserId = async (req,res,next) => {
  const userId = req.params.uid;


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
    // 비동기 코드로 작업할 때 throw는 express에서 올바르게 작동하지 않으므로, next를 사용한다.
    return next(new HttpError ('입력하신 정보가 유효하지 않습니다', 422));
  }

  const {title, description, address} = req.body;

  let coordinates;
  try{
    coordinates = await getCoordsForAddress(address)
  }catch(err){
    return next(err)
  }



  const createdPlace = new Place({
    title,
    description,
    address,
    location:coordinates,
    image: req.file.path,
    // auth-jwt에서 decodedToken으로 얻은 userId 
    creator:req.userData.userId
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
    const session = await mongoose.startSession()
    session.startTransaction();
    await createdPlace.save({session: session});    
    user.places.push(createdPlace)
    await user.save({session: session})
    await session.commitTransaction();
    
  }catch(err){
    const error = new HttpError('Creating place failed, please try again',500)
    return next(error);
  }
  res.status(201).json({place: createdPlace})
}



const updatePlaceById = async (req,res,next) => {
  const errors= validationResult(req);

  if(!errors.isEmpty()){    
    return next(new HttpError ('입력하신 정보가 유효하지 않습니다', 422))
  }
  
  const {title, description} = req.body;
  
  const placeId = req.params.pid;
  


  let place;

  try{
    place = await Place.findById(placeId)
  }catch(err){
    const error = new HttpError('Could not find place',500)
    return next(error)
  }

  place.title = title;
  place.description = description;
  // image 파일이 없을 때에는 title,description만 update될 수 있게 logic 작성
  if(req.file){
    place.image = req.file.path;
  }
  

  if(place.creator.toString() !== req.userData.userId){
    const error = new HttpError('허용된 접근자가 아닙니다.', 403)
    return next(error);
  }

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

  const imagePath = place.image;
  
  // populate로 찾았기 때문에 creator..
  if(place.creator.id !== req.userData.userId){
    const error = new HttpError('허용된 접근자가 아닙니다.',403);
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

  fs.unlink(imagePath, err => {console.log(err)})

  res.status(200).json({message: "deleted complate"})
}

exports.getPlaceById = getPlaceById
exports.getPlacesByUserId = getPlacesByUserId
exports.createPlace = createPlace
exports.updatePlaceById = updatePlaceById
exports.deletePlaceById = deletePlaceById