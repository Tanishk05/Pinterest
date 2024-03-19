const mongoose = require('mongoose');


const commentSchema = mongoose.Schema({
  text: String,
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
  pin: { type: mongoose.Schema.Types.ObjectId, ref: 'pins' },
  date :{
    type : Date,
    default: Date.now()
  }
  
});




module.exports = mongoose.model('comment', commentSchema);