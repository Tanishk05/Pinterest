const mongoose = require('mongoose');

const pinSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  },

  link:String,

  board : {
    type :String,
    required : true,
  },

  topics : String,

  user : {
    type: mongoose.Schema.Types.ObjectId,
    ref : `users`
  },
   
  
  createdAt: {
    type: Date,
    default: Date.now
  },

  savedby :[{
       type: mongoose.Schema.Types.ObjectId,
       ref : `users`
  }],

  comments :[{
    type : mongoose.Schema.Types.ObjectId,
    ref : `comment`
  }]

   
  
});


module.exports = mongoose.model("pins", pinSchema);

