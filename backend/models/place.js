const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const placeSchema = new Schema({
    // 1단계 스키마 
    title:{type:String, required:true},
    description:{type:String, required:true},
    image:{type:String, required:true},
    address:{type:String, required:true},
    location: {
      lat:{type:Number, required:true},
      lng:{type:Number, required:true}
    },
    // MongoDB에게 creator는 User Collection내에 존재하는 ID임을 알려주고(mongoose.Types.ObjectId) ref를 통해 User Schema와 연결한다.
    // collection끼리 연결해주는 mongoose의 populate method에 중요하게 사용된다.
    creator:{type: mongoose.Types.ObjectId, required:true, ref: 'User'}
})
// model은 생성자 함수를 반환하기에 대문자로 시작하고, 단수형을 사용한다.
// model의 첫번째 인수는 컬렉션의 이름이 된다.
// 2번째 인수로 작성한 스키마를 인수로 전달하여, place 생성자 함수를 통해 
// 생성된 컬렉션에 들어가는 documents들이 해당 스키마의 구조를 갖게 만든다.

module.exports = mongoose.model('Place',placeSchema)