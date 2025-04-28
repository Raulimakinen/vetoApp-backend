const SERVER_URL = "https://your-server-url.com"; // tai esim. "http://10.0.2.2:3000" emulaattorilla

const loadTasks = async () => {
  try {
    const response = await fetch(`${SERVER_URL}/tasks`);
    const loadedTasks = await response.json();
    setTasks(loadedTasks);
  } catch (error) {
    console.log("Ei voitu ladata tehtäviä:", error);
  }
};

const saveTask = async () => {
  if (taskTitle.trim() === "" || taskDescription.trim() === "") {
    Alert.alert("Virhe", "Tehtävän nimi ja kuvaus ovat pakollisia!");
    return;
  }

  try {
    const response = await fetch(`${SERVER_URL}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: taskTitle, description: taskDescription }),
    });

    const newTask = await response.json();
    setTasks([...tasks, newTask]);
    setTaskTitle("");
    setTaskDescription("");
  } catch (error) {
    console.log("Virhe tehtävän tallennuksessa:", error);
  }
};

const removeTask = async (taskId) => {
  try {
    await fetch(`${SERVER_URL}/tasks/${taskId}`, {
      method: "DELETE",
    });

    const updatedTasks = tasks.filter((task) => task._id !== taskId);
    setTasks(updatedTasks);
  } catch (error) {
    console.log("Virhe tehtävän poistossa:", error);
  }
};