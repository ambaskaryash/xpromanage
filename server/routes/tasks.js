const express = require('express');
const router = express.Router();
const {
    getTasks,
    getTask,
    createTask,
    updateTask,
    deleteTask,
    addComment,
    uploadTaskFile,
    deleteTaskFile,
    updateTaskPosition
} = require('../controllers/tasks');
const { protect } = require('../middleware/auth');
const { upload } = require('../config/fileUpload');

router.route('/')
    .get(protect, getTasks)
    .post(protect, createTask);

router.route('/:id')
    .get(protect, getTask)
    .put(protect, updateTask)
    .delete(protect, deleteTask);

router.route('/:id/position')
    .put(protect, updateTaskPosition);

router.route('/:id/comments')
    .post(protect, addComment);

router.route('/:id/attachments')
    .post(protect, upload.single('file'), uploadTaskFile);

router.route('/:id/attachments/:fileId')
    .delete(protect, deleteTaskFile);

module.exports = router;
