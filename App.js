import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
  Pressable
} from 'react-native';
import { AntDesign, Feather, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SERVER_URL = "https://vetoapp-backend.onrender.com";

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${SERVER_URL}/tasks`);
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }
      
      const loadedTasks = await response.json();
      setTasks(loadedTasks);
      
      // Save tasks to AsyncStorage as a backup
      await AsyncStorage.setItem('tasks', JSON.stringify(loadedTasks));
    } catch (error) {
      console.error("Failed to load tasks:", error);
      setError("Failed to load tasks. Please check your connection and try again.");
      
      // Try to load from AsyncStorage if network request fails
      try {
        const storedTasks = await AsyncStorage.getItem('tasks');
        if (storedTasks) {
          setTasks(JSON.parse(storedTasks));
        }
      } catch (storageError) {
        console.error("Failed to load from storage:", storageError);
      }
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const saveTask = async () => {
    if (taskTitle.trim() === "" || taskDescription.trim() === "") {
      Alert.alert("Error", "Task title and description are required!");
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${SERVER_URL}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          title: taskTitle, 
          description: taskDescription,
          priority: taskPriority
        }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const newTask = await response.json();
      setTasks([newTask, ...tasks]);
      
      // Update AsyncStorage
      await AsyncStorage.setItem('tasks', JSON.stringify([newTask, ...tasks]));
      
      // Clear input fields
      setTaskTitle("");
      setTaskDescription("");
      setTaskPriority("medium");
      
      // Hide keyboard
      Keyboard.dismiss();
    } catch (error) {
      console.error("Error saving task:", error);
      setError("Failed to save task. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTaskCompletion = async (taskId) => {
    try {
      // First update the UI optimistically
      const updatedTasks = tasks.map(task => 
        task._id === taskId ? {...task, completed: !task.completed} : task
      );
      setTasks(updatedTasks);
      
      // Use PUT instead of PATCH for better compatibility
      const taskToUpdate = tasks.find(t => t._id === taskId);
      if (!taskToUpdate) return;
      
      const response = await fetch(`${SERVER_URL}/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          completed: !taskToUpdate.completed 
        }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const updatedTask = await response.json();
      
      // Update AsyncStorage
      await AsyncStorage.setItem('tasks', JSON.stringify(updatedTasks));
    } catch (error) {
      console.error("Error toggling task:", error);
      // Revert the optimistic update
      loadTasks();
      Alert.alert("Error", "Failed to update task status. Please try again.");
    }
  };

  const removeTask = async (taskId) => {
    Alert.alert(
      "Delete Task",
      "Are you sure you want to delete this task?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              // Optimistic update
              const updatedTasks = tasks.filter((task) => task._id !== taskId);
              setTasks(updatedTasks);
              
              const response = await fetch(`${SERVER_URL}/tasks/${taskId}`, {
                method: "DELETE",
              });

              if (!response.ok) {
                throw new Error(`Server responded with ${response.status}`);
              }

              // Update AsyncStorage
              await AsyncStorage.setItem('tasks', JSON.stringify(updatedTasks));
            } catch (error) {
              console.error("Error deleting task:", error);
              // Revert the optimistic update
              loadTasks();
              Alert.alert("Error", "Failed to delete task. Please try again.");
            }
          }
        }
      ]
    );
  };

  const getPriorityColor = (priority) => {
    if (!priority) return '#ffa64d'; // Default to medium color
    
    switch (priority) {
      case 'high':
        return '#ff4d4d';
      case 'medium':
        return '#ffa64d';
      case 'low':
        return '#4da6ff';
      default:
        return '#ffa64d';
    }
  };

  const renderPriorityButton = (value, label) => {
    const isSelected = taskPriority === value;
    return (
      <TouchableOpacity
        style={[
          styles.priorityButton,
          { backgroundColor: isSelected ? getPriorityColor(value) : '#f0f0f0' }
        ]}
        onPress={() => setTaskPriority(value)}
      >
        <Text style={[
          styles.priorityButtonText,
          { color: isSelected ? 'white' : '#555' }
        ]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  if (isLoading && tasks.length === 0) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Loading tasks...</Text>
      </View>
    );
  }

  return (
    <Pressable onPress={Keyboard.dismiss} style={{flex: 1}}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : null}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Task Manager</Text>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={loadTasks}
            disabled={isLoading}
          >
            <Feather name="refresh-cw" size={20} color="#555" />
          </TouchableOpacity>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Task Title"
            value={taskTitle}
            onChangeText={setTaskTitle}
            maxLength={50}
          />
          
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Task Description"
            value={taskDescription}
            onChangeText={setTaskDescription}
            multiline={true}
            numberOfLines={3}
            maxLength={200}
          />
          
          <View style={styles.priorityContainer}>
            <Text style={styles.priorityLabel}>Priority:</Text>
            <View style={styles.priorityButtons}>
              {renderPriorityButton('low', 'Low')}
              {renderPriorityButton('medium', 'Medium')}
              {renderPriorityButton('high', 'High')}
            </View>
          </View>

          <TouchableOpacity
            style={styles.addButton}
            onPress={saveTask}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <AntDesign name="plus" size={20} color="#fff" />
                <Text style={styles.addButtonText}>Add Task</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.taskListTitle}>
          Your Tasks ({tasks.length})
        </Text>

        {tasks.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Feather name="clipboard" size={64} color="#ccc" />
            <Text style={styles.emptyStateText}>No tasks yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Add your first task using the form above
            </Text>
          </View>
        ) : (
          <ScrollView style={styles.taskList}>
            {tasks.map((task) => (
              <View 
                key={task._id} 
                style={[
                  styles.taskItem,
                  task.completed && styles.taskItemCompleted
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.taskCheckbox,
                    task.completed && styles.taskCheckboxChecked
                  ]}
                  onPress={() => toggleTaskCompletion(task._id)}
                >
                  {task.completed && (
                    <AntDesign name="check" size={16} color="#fff" />
                  )}
                </TouchableOpacity>
                
                <View style={styles.taskContent}>
                  <View style={styles.taskHeader}>
                    <Text 
                      style={[
                        styles.taskTitle,
                        task.completed && styles.taskTextCompleted
                      ]}
                      numberOfLines={1}
                    >
                      {task.title || "Untitled Task"}
                    </Text>
                    <View 
                      style={[
                        styles.priorityBadge,
                        { backgroundColor: getPriorityColor(task.priority || 'medium') }
                      ]}
                    >
                      <Text style={styles.priorityBadgeText}>
                        {task.priority ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1) : 'Medium'}
                      </Text>
                    </View>
                  </View>
                  
                  <Text 
                    style={[
                      styles.taskDescription,
                      task.completed && styles.taskTextCompleted
                    ]}
                    numberOfLines={2}
                  >
                    {task.description || "No description"}
                  </Text>
                  
                  <Text style={styles.taskDate}>
                    {task.createdAt ? new Date(task.createdAt).toLocaleDateString() : "Unknown date"}
                  </Text>
                </View>
                
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => removeTask(task._id)}
                >
                  <MaterialIcons name="delete-outline" size={24} color="#ff4d4d" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 10,
    color: '#555',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  refreshButton: {
    padding: 5,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 10,
    margin: 10,
    borderRadius: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  errorText: {
    color: '#c62828',
  },
  inputContainer: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  priorityContainer: {
    marginBottom: 12,
  },
  priorityLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  priorityButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priorityButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  priorityButtonText: {
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    padding: 14,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  taskListTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    color: '#333',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#888',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  taskList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  taskItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  taskItemCompleted: {
    backgroundColor: '#f9f9f9',
    opacity: 0.8,
  },
  taskCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4CAF50',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskCheckboxChecked: {
    backgroundColor: '#4CAF50',
  },
  taskContent: {
    flex: 1,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  taskDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  taskTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#888',
  },
  taskDate: {
    fontSize: 12,
    color: '#aaa',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginLeft: 8,
  },
  priorityBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  deleteButton: {
    padding: 4,
    marginLeft: 8,
  },
});