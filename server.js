const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());


mongoose.connect("mongodb+srv://vetoApp:veto23@mobilecluster.pbljy6k.mongodb.net/?retryWrites=true&w=majority&appName=mobileCluster", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Luo Task-schema
const Task = mongoose.model("Task", new mongoose.Schema({
  title: String,
  description: String,
}));

// Luo tehtävä
app.post("/tasks", async (req, res) => {
  const { title, description } = req.body;
  const task = new Task({ title, description });
  await task.save();
  res.status(201).send(task);
});

// Hae kaikki tehtävät
app.get("/tasks", async (req, res) => {
  const tasks = await Task.find();
  res.send(tasks);
});

// Poista tehtävä
app.delete("/tasks/:id", async (req, res) => {
  await Task.findByIdAndDelete(req.params.id);
  res.send({ success: true });
});

// Käynnistä serveri
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});