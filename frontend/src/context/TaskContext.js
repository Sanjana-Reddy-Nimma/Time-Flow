import React, { createContext, useContext, useState, useCallback } from "react";
import { tasksAPI } from "../utils/api";
import toast from "react-hot-toast";

const TaskContext = createContext(null);

export const TaskProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchTasks = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const { data } = await tasksAPI.getAll(params);
      setTasks(data.tasks);
      return data.tasks;
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, []);

  const createTask = useCallback(async (taskData) => {
    try {
      const { data } = await tasksAPI.create(taskData);
      setTasks((prev) => [data.task, ...prev]);
      toast.success("Task created!");
      return data.task;
    } catch (err) {
      const msg =
        err.response?.data?.errors?.[0]?.msg ||
        err.response?.data?.error ||
        "Failed to create task";
      toast.error(msg);
      throw err;
    }
  }, []);

  const updateTask = useCallback(async (id, taskData) => {
    try {
      const { data } = await tasksAPI.update(id, taskData);
      setTasks((prev) => prev.map((t) => (t._id === id ? data.task : t)));
      toast.success("Task updated!");
      return data.task;
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update task");
      throw err;
    }
  }, []);

  const updateTaskStatus = useCallback(async (id, status) => {
    try {
      const { data } = await tasksAPI.updateStatus(id, status);
      setTasks((prev) => prev.map((t) => (t._id === id ? data.task : t)));
      toast.success(`Task ${status}!`);
    } catch (err) {
      toast.error("Failed to update status");
    }
  }, []);

  const deleteTask = useCallback(async (id) => {
    try {
      await tasksAPI.delete(id);
      setTasks((prev) => prev.filter((t) => t._id !== id));
      toast.success("Task deleted");
    } catch (err) {
      toast.error("Failed to delete task");
    }
  }, []);

  const toggleSubtask = useCallback(async (taskId, subtaskId) => {
    try {
      const { data } = await tasksAPI.toggleSubtask(taskId, subtaskId);
      setTasks((prev) => prev.map((t) => (t._id === taskId ? data.task : t)));
    } catch (err) {
      toast.error("Failed to update subtask");
    }
  }, []);

  return (
    <TaskContext.Provider
      value={{
        tasks,
        loading,
        fetchTasks,
        createTask,
        updateTask,
        updateTaskStatus,
        deleteTask,
        toggleSubtask,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error("useTasks must be used within TaskProvider");
  return ctx;
};
