const memoryService = require("../services/memory.service");

const getMemories = async (req, res, next) => {
  try {
    const memories = await memoryService.getMemories(req.userId, req.query);
    return res.status(200).json({
      success: true,
      count: memories.length,
      memories
    });
  } catch (error) {
    next(error);
  }
};

const createMemory = async (req, res, next) => {
  try {
    const newMemory = await memoryService.createMemory(req.userId, req.body);
    return res.status(201).json({
      success: true,
      message: "Memory created successfully.",
      memory: newMemory
    });
  } catch (error) {
    next(error);
  }
};

const updateMemory = async (req, res, next) => {
  try {
    const updatedMemory = await memoryService.updateMemory(req.userId, req.params.id, req.body);
    return res.status(200).json({
      success: true,
      message: "Memory updated successfully.",
      memory: updatedMemory
    });
  } catch (error) {
    next(error);
  }
};

const deleteMemory = async (req, res, next) => {
  try {
    const result = await memoryService.deleteMemory(req.userId, req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const deleteAllMemories = async (req, res, next) => {
  try {
    const result = await memoryService.deleteAllMemories(req.userId);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMemories,
  createMemory,
  updateMemory,
  deleteMemory,
  deleteAllMemories
};
