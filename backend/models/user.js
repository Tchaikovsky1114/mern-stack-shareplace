const mongoose = require('mongoose');
// mongoose unique validator를 통해서 unique이메일을 확인하고, 추가할 수 있다.
const uniqueValidator = require('mongoose-unique-validator')
const Schema = mongoose.Schema;

const userSchema = new Schema({
    // 1단계 스키마 
    name:{type:String, required:true},
    // unique를 통해서 쿼리 프로세스 속도를 빠르게 한다.
    email:{type:String, required:true, unique: true},
    password:{type:String, required:false, minlength: 8},
    image: {type: String, required: false},
    // User collection과 Place collection을 연결한다.
    // 한 user가 여러개의 places를 가질 수 있으므로 배열 형태로 저장. 
    places: [{type: mongoose.Types.ObjectId, required:true, ref: 'Place'}]
})


//unique-validator는 unique의 존재 유무도 파악한다.
userSchema.plugin(uniqueValidator);


// model은 생성자 함수를 반환하기에 대문자로 시작하고, 단수형을 사용한다.
// model의 첫번째 인수는 컬렉션의 이름이 된다.
// model의 2번째 인수로 작성한 스키마에 객체를 인수로 전달하여, place 생성자 함수를 통해 생성된 컬렉션에 들어가는 documents들이 해당 스키마의 구조를 갖게 만든다.

module.exports = mongoose.model('User',userSchema)