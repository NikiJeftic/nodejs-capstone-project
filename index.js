const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const mongoose = require("mongoose");

mongoose.connect(process.env.MONGO_URI);

const userSchema = mongoose.Schema(
  {
    username: {
      type: String,
      unique: true,
    },
  },
  { versionKey: false }
);
const exerciseSchema = mongoose.Schema(
  {
    username: String,
    description: String,
    duration: Number,
    date: Date,
    userId: String,
  },
  { versionKey: false }
);

const User = mongoose.model("User", userSchema);
const Exercise = mongoose.model("Exercise", exerciseSchema);

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

// GET request /api/users
app.get("/api/users", async (req, res) => {
  const users = await User.find();
  res.send(users);
});

// GET request /api/users/:_id/logs
app.get("/api/users/:_id/logs", async (req, res) => {
  const userId = req.params._id;
  let { from, to, limit } = req.query;
  let foundUser;
  try {
    foundUser = await User.findById(userId);
  } catch (error) {
    foundUser = null;
  }
  if (!foundUser) {
    res.json({ message: "No user exists with that ID" });
  }
  let filter = { userId };
  let dateFilter = {};
  if (from) {
    dateFilter["$gte"] = new Date(from);
  }
  if (to) {
    dateFilter["$lte"] = new Date(to);
  }
  if (from || to) {
    filter.date = dateFilter;
  }
  if (!limit) {
    limit = 100;
  }
  let exercises = await Exercise.find(filter).limit(limit);
  exercises = exercises.map((exercise) => ({
    description: exercise.description,
    duration: exercise.duration,
    date: exercise.date.toDateString(),
  }));
  res.json({
    username: foundUser.username,
    count: exercises.length,
    _id: userId,
    log: exercises,
  });
});

// POST to /api/users username
app.post("/api/users", async (req, res) => {
  const username = req.body.username;
  const foundUser = await User.findOne({ username });
  if (foundUser) {
    res.json(foundUser);
  } else {
    const user = await User.create({
      username,
    });
    res.json(user);
  }
});

// POST to /api/users/:_id/exercises
app.post("/api/users/:_id/exercises", async (req, res) => {
  let { description, duration, date } = req.body;
  const userId = req.body[":_id"];
  let foundUser;
  try {
    foundUser = await User.findById(userId);
  } catch (error) {
    foundUser = null;
  }
  if (!foundUser) {
    res.json({ message: "No user exists with that ID" });
  }
  if (!date) {
    date = new Date();
  }
  if (date) {
    date = new Date(date);
  }
  await Exercise.create({
    username: foundUser.username,
    description,
    duration,
    date,
    userId,
  });
  res.send({
    username: foundUser.username,
    description,
    duration,
    date: date.toDateString(),
    userId,
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
