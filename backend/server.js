const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
mongoose.connect("mongodb+srv://vetoApp:veto23@mobilecluster.pbljy6k.mongodb.net/?retryWrites=true&w=majority&appName=mobileCluster")
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("MongoDB connection error:", err));

// Task model - enhanced with new fields while preserving compatibility
const Task = mongoose.model("Task", new mongoose.Schema({
  title: String,
  description: String,
  completed: { 
    type: Boolean, 
    default: false 
  },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
}));

// API Routes

// Get all tasks
app.get("/tasks", async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.status(200).json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ message: "Error fetching tasks", error: error.message });
  }
});

// Create a new task
app.post("/tasks", async (req, res) => {
  try {
    const { title, description, priority } = req.body;
    
    if (!title || !description) {
      return res.status(400).json({ message: "Title and description are required" });
    }
    
    const task = new Task({ 
      title, 
      description,
      priority: priority || 'medium'
    });
    
    const savedTask = await task.save();
    res.status(201).json(savedTask);
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ message: "Error creating task", error: error.message });
  }
});

// Update a task
app.put("/tasks/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const update = req.body;
    
    const updatedTask = await Task.findByIdAndUpdate(
      id,
      update,
      { new: true }
    );
    
    if (!updatedTask) {
      return res.status(404).json({ message: "Task not found" });
    }
    
    res.status(200).json(updatedTask);
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ message: "Error updating task", error: error.message });
  }
});

// Toggle task completion status - THIS IS THE NEW ENDPOINT
app.patch("/tasks/:id/toggle", async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id);
    
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    
    task.completed = !task.completed;
    const updatedTask = await task.save();
    
    res.status(200).json(updatedTask);
  } catch (error) {
    console.error("Error toggling task status:", error);
    res.status(500).json({ message: "Error toggling task status", error: error.message });
  }
});

// Delete a task
app.delete("/tasks/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedTask = await Task.findByIdAndDelete(id);
    
    if (!deletedTask) {
      return res.status(404).json({ message: "Task not found" });
    }
    
    res.status(200).json({ message: "Task deleted successfully", id });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ message: "Error deleting task", error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});