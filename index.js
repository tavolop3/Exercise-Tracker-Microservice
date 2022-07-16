const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const bodyParser = require('body-parser')
const mongoose = require('mongoose');

app.use(bodyParser.urlencoded({extended:false}));
app.use(cors());
app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

//connection with mongo
const uri = process.env['MONGO_URI'];
mongoose.connect(uri,{useNewUrlParser:true,useUnifiedTopology:true});

const Schema = mongoose.Schema;
let userSchema = new Schema({
  username:{
    type:String,
    required:true
  }
});
let exerciseSchema = new Schema({
  username:{
    type:String,
    required:true
  },
  userId:{
    type:mongoose.Types.ObjectId,
    required:true
  },
  description:{
    type:String,
    required:true
  },
  duration:{
    type:Number,
    required:true
  },
  date:{
    type:String,
    required:true
  }
});
const userModel = mongoose.model('user',userSchema);
const exerciseModel = mongoose.model('exercise',exerciseSchema);

app.post('/api/users', (req,res) => {
  let username = req.body.username;
  userModel.create({'username':username}, (err,data) => {
    if(err) return console.error(err);
    res.json({'username':username,'_id':data._id});
    console.log('User created'+" -> " + data.username);
  });
});

app.post('/api/users/:_id/exercises', (req,res) => {
  let userId = req.params._id;
  let description = req.body.description;
  let duration = parseInt(req.body.duration);
  console.log('req date:'+req.body.date);
  let date = req.body.date;
  if(!date)
    date = new Date().toDateString();
  else{
    date = date.replaceAll('-','/');
    date = new Date(date).toDateString();
  }
  console.log('final date: '+date);
  console.log('sig')
  userModel.findById(userId,(err,data) => {
    if(err) return console.error(err);
    let username = data.username;
    let exerciseObj = {'userId':userId,'username':username,'date':date,'duration':duration,'description':description};
    exerciseModel.create(exerciseObj, (er,dat) =>{
      if(er) return console.error(er);
      res.json({'_id':userId,'username':username,'date':date,'duration':duration,'description':description});
      console.log('Exercise created');
    });
  });
});

app.get('/api/users', (req,res) => {
  userModel.find((err,data) => {
    if(err) return console.error(err);
    res.send(data); 
  });
});

function fixDate(date){
  if(date){
    date = date.replaceAll('-','/');
    date = new Date(date).toDateString();
  }
  return date;
}

app.get('/api/users/:_id/logs',(req,res) => {
  let userId = req.params._id;
  let from = fixDate(req.query.from);
  let to = fixDate(req.query.to);
  let limit = parseInt(req.query.limit);
  if(!limit)
    limit = 0;
  let condition = {'userId':userId};
  console.log(from,to);
  if(from && to){
    condition['$gte'] = from;
    condition['$lte'] = to;
  }else{
    condition = {'userId':userId}
  }
  console.log(condition)
  console.log('limit='+limit)
  exerciseModel.find(condition).limit(limit).exec((err,data) => {
    if(err) return console.error(err);
    res.json({'_id':userId,'username':data[0].username,'count':data.length,'log':data});
    console.log('Data returned');
  });
});

/*app.get('/api/users/:_id/logs',(req,res) => {
  let userId = req.params._id;
  exerciseModel.find({'userId':userId},(err,data) => {
    if(err) return console.error(err);
    res.json({'_id':userId,'username':data[0].username,'count':data.length,'log':data});
    Console.log('Data returned');
  });
});*/

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
