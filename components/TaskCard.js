import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Ionicons roskakori-ikonille

const TaskCard = ({ taskTitle, taskDescription, onPress }) => {
  return (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <Text style={styles.title}>{taskTitle}</Text>
        <Text>{taskDescription}</Text>
      </View>
      
      {/* Poistonappi roskakori-ikonilla */}
      <TouchableOpacity onPress={onPress} style={styles.deleteButton}>
        <Ionicons name="trash-bin" size={24} color="red" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    marginVertical: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardContent: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  deleteButton: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
});

export default TaskCard;