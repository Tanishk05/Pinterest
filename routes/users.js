const mongoose = require(`mongoose`);

mongoose.set("strictQuery", false);
mongoose.connect(
  "mongodb+srv://Tanishk:Tan%406242@cluster0.gsi4lxi.mongodb.net/Pinterest?retryWrites=true&w=majority&appName=cluster0"
);
const passportlocalmongoose = require(`passport-local-mongoose`);

const userSchema = mongoose.Schema({
  username: {
    type: String,
  },
  email: {
    type: String,
  },
  password: {
    type: String,
  },
  profile: String,
  fullname: String,
  firstname: String,
  lastname: String,
  About: String,
  website: String,
  pins: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: `pins`,
    },
  ],
  savedpins: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: `pins`,
    },
  ],

  followers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: `users`,
    },
  ],

  following: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: `users`,
    },
  ],

  socketId: String,
});

userSchema.plugin(passportlocalmongoose);

module.exports = mongoose.model("users", userSchema);
