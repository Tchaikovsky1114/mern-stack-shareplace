const express = require('express');

// bodyParser는 객체 및 배열과 같은 일반적인 자바스크립트 자료구조를 추출하고 변환한다.
// 이후 next 함수를 자동으로 호출하여 다음 미들웨어에 도달하게 한다.
const bodyParser = require('body-parser')

const mongoose = require('mongoose');

const placesRoutes = require('./routes/places-route');
const usersRoutes = require('./routes/users-route')

const HttpError = require('./models/http-error')

const app = express();

app.use(bodyParser.json());

// CORS 해결하기 위한 Headers설정.
app.use((req,res,next)=> {
  // 접근할 수 있는 호스트를 설정한다. '*'같은 경우 모든 도메인을 허용한다.
  res.setHeader('Access-Control-Allow-Origin', '*');
  // 들어올 수 있는 RequestHeader를 설정한다.
  res.setHeader('Access-Control-Allow-Headers','Origin, X-Requested-With, Content-Type','Accept','Authorization')
  // 들어올 수 있는 Http Request Method를 설정한다.
  res.setHeader('Access-Control-Allow-Methods','GET,POST,PATCH,DELETE')
  next();
})


app.use('/api/places',placesRoutes)
app.use('/api/users',usersRoutes);

// 존재하지 않는 경로에 대한 error handling.
// 상위 router처리에서 처리되지 않은 요청만을 받아올 수 있게 순서를 조정한다.
// react-router-dom@5에서 404 page처리를 switch의 제일 끝단에 작성하는 것과 같은 원리.
app.use((req,res,next)=>{
  const error = new HttpError('존재하지 않는 경로입니다.', 404);
  throw error;
  
})

// 4개의 인수를 제공하면 error 인수를 받는다.
app.use((error,req,res,next) =>{
  if(res.headerSent){
    return next(error)
  }
  res.status(error.code || 500)
  res.json({message: error.message || 'An unknown error occurred'});
});


// listen 이전에 mongo connect
mongoose.connect('mongodb+srv://placeshere:83Kn%40Cwc!ujwrDE@cluster0.jxzg0ao.mongodb.net/shareplaces?retryWrites=true&w=majority')
.then(()=>{
  app.listen(5050);
}).catch((err)=>{
  console.log(err,'can not connect to database')
});
