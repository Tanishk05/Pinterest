const express = require("express");
const router = express.Router();
const userModel = require(`./users`);
const localStrategy = require(`passport-local`);
const passport = require("passport");
const upload = require(`./multer`);
const pinsModel = require(`./pins`);
const commentModel = require(`./comments`);

// const GoogleStrategy = require('passport-google-oidc');
// require('dotenv').config();

passport.use(new localStrategy(userModel.authenticate()));

// // google strategy code for passport js
// passport.use(new GoogleStrategy({
//     clientID: process.env['GOOGLE_CLIENT_ID'],
//     clientSecret: process.env['GOOGLE_CLIENT_SECRET'],
//     callbackURL: '/oauth2/redirect/google',
//     scope: ['profile', 'email']
// }, async function verify(issuer, profile, cb) {
//     console.log(profile)
//     let user = await userModel.findOne({ email: profile.emails[0].value });
//     if (user) {
//         return cb(null, user);
//     }

//     let newUser = await userModel.create({
//         name: profile.displayName,
//         email: profile.emails[0].value,
//     });
//     await newUser.save();
//     return cb(null, newUser)
// }));

router.get("/", function (req, res, next) {
  const error = req.flash(`error`);
  res.render("index", { error });
});

router.post(`/register`, function (req, res, next) {
  var newUser = new userModel({
    username: req.body.username,
    email: req.body.email,
    profile: req.body.profile,
    fullname: req.body.fullname,
  });

  userModel.register(newUser, req.body.password).then(function () {
    passport.authenticate(`local`)(req, res, function () {
      res.redirect(`/profile`);
    });
  });
});

// router.get('/login/federated/google', passport.authenticate(`google`));

// router.get('/oauth2/redirect/google', passport.authenticate('google', {
//     successRedirect: '/profile',
//     failureRedirect: '/'
// }));

router.get(`/profile`, Isloggedin, async function (req, res, next) {
  const user = await userModel
    .findOne({ username: req.session.passport.user })
    .populate(`pins`);
  const loginuser = await userModel
    .findOne({ username: req.session.passport.user })
    .populate(`savedpins`);
  res.render("profile", { user, loginuser });
});

router.get(`/createaccount`, function (req, res, next) {
  res.render("register");
});

router.post(
  `/uploadprofile`,
  upload.single(`profile`),
  Isloggedin,
  async function (req, res, next) {
    const user = req.user;
    user.profile = req.file.filename;
    await user.save();

    res.redirect("/editprofile");
  }
);

router.get(`/editprofile`, Isloggedin, function (req, res, next) {
  const user = req.user;
  res.render("editprofile", { user });
});

router.post(`/saveprofile`, Isloggedin, async function (req, res, next) {
  const user = req.user;
  user.username = req.body.username;
  user.email = req.body.email;
  user.firstname = req.body.firstname;
  user.lastname = req.body.lastname;
  user.About = req.body.About;
  user.website = req.body.website;
  await user.save();

  const loginuser = await userModel
    .findOne({ username: req.session.passport.user })
    .populate(`savedpins`);

  res.render(`profile`, { user, loginuser });
});

router.get(`/createpin`, Isloggedin, async function (req, res, next) {
  const user = req.user;
  res.render(`createpins`, { user });
});

router.post(
  `/uploadpin`,
  upload.single(`pinimage`),
  Isloggedin,
  async function (req, res, next) {
    const loginuser = req.user;
    const createdpin = await pinsModel.create({
      title: req.body.title,
      description: req.body.description,
      image: req.file.filename,
      link: req.body.link,
      board: req.body.board,
      topics: req.body.topics,
      user: loginuser,
    });

    loginuser.pins.push(createdpin._id);
    await loginuser.save();

    res.redirect(`/profile`);
  }
);

router.get(`/home`, Isloggedin, async function (req, res, next) {
  const user = await userModel
    .findOne({ username: req.session.passport.user })
    .populate(`pins`);

  const allpins = await pinsModel.find().populate(`user`);

  console.log(allpins);

  res.render(`home`, { allpins, user });
});

// Save pin route
router.get("/save/:pinId", Isloggedin, async (req, res) => {
  const user = await userModel.findOne({ username: req.session.passport.user });

  const pin = await pinsModel.findById({ _id: req.params.pinId });

  // Check if the pin is not already saved by the user
  if (!user.savedpins.includes(pin._id)) {
    // Add the pin to the user's savedPins array
    user.savedpins.push(pin._id);

    // Check if the user is not already in the savedByUsers array of the pin
    if (!pin.savedby.includes(user._id)) {
      // Add the user to the pin's savedByUsers array
      pin.savedby.push(user._id);
    }
  }

  // Save changes
  await user.save();
  await pin.save();

  res.redirect(`/home`);
  //  res.json(user)
});

// Unsave pin route
router.get("/unsave/:pinId", Isloggedin, async (req, res) => {
  const user = await userModel
    .findOne({ username: req.session.passport.user })
    .populate(`savedpins`);

  const pin = await pinsModel
    .findById({ _id: req.params.pinId })
    .populate(`savedby`);

  // Check if the pin is saved by the user

  user.savedpins.splice(user.savedpins.indexOf(pin._id), 1);

  pin.savedby.splice(pin.savedby.indexOf(user._id), 1);

  await user.save();
  await pin.save();

  res.redirect(`/home`);
  // res.json(user)
});

router.get(`/board/:pinId/:boardname`, Isloggedin, async function (req, res) {
  // console.log(allboards);

  const pin = await pinsModel
    .findById({ _id: req.params.pinId })
    .populate(`user`);

  const allboards = await pinsModel
    .find({
      board: req.params.boardname,
      _id: { $ne: req.params.pinId }, // $ne stands for "not equal"
    })
    .populate(`user`);

  const loginuser = await userModel
    .findOne({ username: req.session.passport.user })
    .populate(`savedpins`);
  const user = req.user;

  res.render(`board`, { allboards, pin, loginuser, user });
});

router.post(
  `/login`,
  passport.authenticate("local", {
    successRedirect: `/profile`,
    failureRedirect: `/`,
    failureFlash: true,
  }),
  function (req, res, next) {}
);

router.get("/logoutnow", function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

function Isloggedin(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/");
}

router.get(`/:username/savedpins`, Isloggedin, async (req, res, next) => {
  const user = await userModel
    .findOne({ username: req.session.passport.user })
    .populate(`savedpins`);

  res.render(`savedpins`, { user });
});

router.get(`/openpin/:pinId`, Isloggedin, async (req, res) => {
  const openpin = await pinsModel
    .findById({ _id: req.params.pinId })
    .populate(`user`);

  const loginuser = await userModel
    .findOne({ username: req.session.passport.user })
    .populate(`savedpins`);

  const commentpinuser = await commentModel
    .find({ pin: openpin })
    .populate(`user`);

  const user = req.user;
  // console.log(commentpinuser);

  res.render(`openpin`, { openpin, loginuser, commentpinuser, user });
});

router.get(
  `/follow/:followeruser/:pinId`,
  Isloggedin,
  async function (req, res, next) {
    const followeduser = await userModel.findById({
      _id: req.params.followeruser,
    });

    const followinguser = await userModel.findOne({
      username: req.session.passport.user,
    });

    if (followeduser.followers.indexOf(followinguser._id) === -1) {
      followeduser.followers.push(followinguser._id);
    } else {
      followeduser.followers.splice(
        followinguser.followers.indexOf(followinguser._id),
        1
      );
    }

    if (followinguser.following.indexOf(followeduser._id) === -1) {
      followinguser.following.push(followeduser._id);
    } else {
      followinguser.following.splice(
        followeduser.following.indexOf(followinguser._id),
        1
      );
    }

    await followeduser.save();
    await followinguser.save();

    res.redirect(`/openpin/${req.params.pinId}`);
  }
);

router.get(`/profile/:open`, Isloggedin, async function (req, res) {
  const openuser = await userModel
    .findById({ _id: req.params.open })
    .populate(`pins`);

  const openusersaved = await userModel
    .findById({ _id: req.params.open })
    .populate(`savedpins`);

  const loginuser = await userModel
    .findOne({ username: req.session.passport.user })
    .populate(`savedpins`);

  const user = req.user;

  res.render(`openprofile`, { openuser, loginuser, user, openusersaved });
});

router.get(
  `/follow/:followeruser`,
  Isloggedin,
  async function (req, res, next) {
    const followeduser = await userModel.findById({
      _id: req.params.followeruser,
    });

    const followinguser = await userModel.findOne({
      username: req.session.passport.user,
    });

    if (followeduser.followers.indexOf(followinguser._id) === -1) {
      followeduser.followers.push(followinguser._id);
    } else {
      followeduser.followers.splice(
        followinguser.followers.indexOf(followinguser._id),
        1
      );
    }

    if (followinguser.following.indexOf(followeduser._id) === -1) {
      followinguser.following.push(followeduser._id);
    } else {
      followinguser.following.splice(
        followeduser.following.indexOf(followinguser._id),
        1
      );
    }

    await followeduser.save();
    await followinguser.save();

    res.redirect(`/profile/${req.params.followeruser}`);
  }
);

router.post(`/comment/:pinId`, Isloggedin, async (req, res, next) => {
  const loginuser = await userModel.findOne({
    username: req.session.passport.user,
  });
  const pintocomment = await pinsModel
    .findById({ _id: req.params.pinId })
    .populate(`comments`);

  const createdcomment = await commentModel.create({
    text: req.body.comment,
    user: loginuser._id,
    pin: pintocomment._id,
  });

  pintocomment.comments.push(createdcomment._id);
  await pintocomment.save();
  await loginuser.save();

  // res.send("successfully created comment");

  res.redirect(`/openpin/${req.params.pinId}`);
});

router.get(`/edit/:pinId`, Isloggedin, async (req, res) => {
  const loggedinuser = await userModel.findOne({
    username: req.session.passport.user,
  });
  const editpin = await pinsModel
    .findById({ _id: req.params.pinId })
    .populate(`user`);
  const user = req.user;

  res.render(`editpin`, { editpin, loggedinuser, user });
});

router.post(`/savepin/:PinId`, Isloggedin, async function (req, res) {
  const savedpin = await pinsModel.findByIdAndUpdate(
    { _id: req.params.PinId },
    {
      title: req.body.title,
      description: req.body.description,
      link: req.body.link,
      board: req.body.board,
    },
    { new: true }
  );

  res.redirect(`/profile`);
  // res.send("saved successfully")
});

router.get(`/deletepin/:PinId`, Isloggedin, async function (req, res) {
  const pintodelete = await pinsModel.findByIdAndDelete({
    _id: req.params.PinId,
  });

  res.redirect(`/profile`);
});

router.get(`/add/accounts`, Isloggedin, async (req, res) => {
  const user = req.user;
  res.render(`account`, { user });
});

router.get(`/logout`, Isloggedin, async (req, res) => {
  res.render(`logoutpage`);
});

router.get(`/search/:query`, Isloggedin, async (req, res) => {
  try {
    const regex = new RegExp(`^${req.params.query}`, "i");
    const allusers = await userModel.find({ username: regex });

    res.json(allusers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get(`/search/pin/:pin`, Isloggedin, async (req, res) => {
  try {
    const regex = new RegExp(`^${req.params.pin}`, "i");
    const allpins = await pinsModel.find({ board: regex }).populate(`user`);

    res.json(allpins);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get(`/comment/delete/:comment/:pin`, Isloggedin, async (req, res) => {
  try {
    const commentId = req.params.comment;
    const pinId = req.params.pin;

    const commentToDelete = await commentModel.findById(commentId);
    if (!commentToDelete) {
      return res.status(404).send("Comment not found");
    }

    const pinToUpdate = await pinsModel.findById(pinId).populate("comments");
    if (!pinToUpdate) {
      return res.status(404).send("Pin not found");
    }

    const commentIndex = pinToUpdate.comments.findIndex((comment) =>
      comment._id.equals(commentId)
    );
    if (commentIndex !== -1) {
      pinToUpdate.comments.splice(commentIndex, 1);
      await pinToUpdate.save();

      await commentModel.findByIdAndDelete({ _id: commentId });

      res.redirect(`/openpin/${pinId}`);
    } else {
      return res.status(404).send("Comment not found in pin");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

router.post(
  `/comment/edit/:commentId/:openpinId`,
  Isloggedin,
  async (req, res) => {
    const commenttoedit = await commentModel.findByIdAndUpdate(
      { _id: req.params.commentId },
      { text: req.body.editcomment },
      { new: true }
    );

    res.redirect(`/openpin/${req.params.openpinId}`);
  }
);

module.exports = router;
