const Task = require('../models/Task');
const Project = require('../models/Project');
const Activity = require('../models/Activity');
const { uploadToS3, deleteFromS3 } = require('../config/fileUpload');

// Helper to emit socket events
const emitEvent = (req, event, data) => {
    if (req.io) {
        req.io.to(`project:${data.project}`).emit(event, data);
    }
};

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Private
exports.getTasks = async (req, res, next) => {
    try {
        let query;

        // Filter by project if provided
        if (req.query.project) {
            query = Task.find({ project: req.query.project });
        } else {
            query = Task.find();
        }

        const tasks = await query
            .populate('project', 'name')
            .populate('assignedTo', 'name email avatar')
            .populate('createdBy', 'name email')
            .populate('comments.user', 'name avatar')
            .populate('attachments.uploadedBy', 'name avatar')
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            count: tasks.length,
            data: tasks
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
exports.getTask = async (req, res, next) => {
    try {
        const task = await Task.findById(req.params.id)
            .populate('project', 'name status')
            .populate('assignedTo', 'name email avatar department')
            .populate('createdBy', 'name email')
            .populate('comments.user', 'name avatar')
            .populate('attachments.uploadedBy', 'name avatar');

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        res.status(200).json({
            success: true,
            data: task
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create new task
// @route   POST /api/tasks
// @access  Private
exports.createTask = async (req, res, next) => {
    try {
        // Verify project exists
        const project = await Project.findById(req.body.project);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        // Add user to req.body
        req.body.createdBy = req.user.id;
        req.body.lastModifiedBy = req.user.id;

        const task = await Task.create(req.body);

        // Populate for response
        const populatedTask = await Task.findById(task._id)
            .populate('assignedTo', 'name email avatar')
            .populate('createdBy', 'name email');

        // Log activity
        await Activity.logActivity({
            user: req.user.id,
            action: 'created',
            entity: 'task',
            entityId: task._id,
            entityName: task.title,
            project: project._id,
            changes: { status: task.status, priority: task.priority }
        });

        // Emit socket event
        emitEvent(req, 'task:created', populatedTask);

        res.status(201).json({
            success: true,
            data: populatedTask
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
exports.updateTask = async (req, res, next) => {
    try {
        let task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        // Capture previous state for activity logging
        const previousState = {
            status: task.status,
            priority: task.priority,
            assignedTo: task.assignedTo
        };

        req.body.lastModifiedBy = req.user.id;

        task = await Task.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        })
            .populate('assignedTo', 'name email avatar')
            .populate('project', 'name')
            .populate('attachments.uploadedBy', 'name avatar');

        // Determine changes for activity log
        const changes = {};
        if (req.body.status && req.body.status !== previousState.status) changes.status = { from: previousState.status, to: req.body.status };
        if (req.body.priority && req.body.priority !== previousState.priority) changes.priority = { from: previousState.priority, to: req.body.priority };
        if (req.body.assignedTo && req.body.assignedTo.toString() !== (previousState.assignedTo ? previousState.assignedTo.toString() : '')) changes.assignedTo = req.body.assignedTo;
        if (req.body.boardColumn && req.body.boardColumn !== task.boardColumn) changes.moved = true;

        // Log activity
        if (Object.keys(changes).length > 0) {
            let action = 'updated';
            if (changes.moved) action = 'moved';
            if (changes.assignedTo) action = 'assigned';
            if (changes.status && changes.status.to === 'completed') action = 'completed';

            await Activity.logActivity({
                user: req.user.id,
                action: action,
                entity: 'task',
                entityId: task._id,
                entityName: task.title,
                project: task.project._id,
                changes: changes
            });
        }

        // Emit socket event
        emitEvent(req, 'task:updated', task);

        res.status(200).json({
            success: true,
            data: task
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
exports.deleteTask = async (req, res, next) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        const taskTitle = task.title;
        const projectId = task.project;

        // Log activity
        await Activity.logActivity({
            user: req.user.id,
            action: 'deleted',
            entity: 'task',
            entityId: task._id,
            entityName: taskTitle,
            project: projectId
        });

        // Delete attachments from S3 if any
        if (task.attachments && task.attachments.length > 0) {
            for (const attachment of task.attachments) {
                if (attachment.key) {
                    await deleteFromS3(attachment.key);
                }
            }
        }

        await task.deleteOne();

        // Emit socket event
        if (req.io) {
            req.io.to(`project:${projectId}`).emit('task:deleted', { _id: req.params.id, project: projectId });
        }

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Add comment to task
// @route   POST /api/tasks/:id/comments
// @access  Private
exports.addComment = async (req, res, next) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        const comment = {
            user: req.user.id,
            text: req.body.text
        };

        task.comments.push(comment);
        await task.save();

        // Populate the new comment
        await task.populate('comments.user', 'name avatar');

        const newComment = task.comments[task.comments.length - 1];

        // Log activity
        await Activity.logActivity({
            user: req.user.id,
            action: 'commented',
            entity: 'task',
            entityId: task._id,
            entityName: task.title,
            project: task.project,
            changes: { text: req.body.text.substring(0, 50) + (req.body.text.length > 50 ? '...' : '') }
        });

        // Emit socket event
        emitEvent(req, 'comment:added', {
            taskId: task._id,
            comment: newComment,
            project: task.project
        });

        res.status(200).json({
            success: true,
            data: task
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Upload file attachment
// @route   POST /api/tasks/:id/attachments
// @access  Private
exports.uploadTaskFile = async (req, res, next) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Please upload a file'
            });
        }

        // Upload to S3
        const result = await uploadToS3(req.file, 'attachments');

        const attachment = {
            name: req.file.originalname,
            url: result.url,
            key: result.key,
            size: req.file.size,
            type: req.file.mimetype,
            uploadedBy: req.user.id
        };

        task.attachments.push(attachment);
        await task.save();

        await task.populate('attachments.uploadedBy', 'name avatar');
        const newAttachment = task.attachments[task.attachments.length - 1];

        // Log activity
        await Activity.logActivity({
            user: req.user.id,
            action: 'uploaded',
            entity: 'task',
            entityId: task._id,
            entityName: task.title,
            project: task.project,
            metadata: { fileName: attachment.name }
        });

        // Emit socket event
        emitEvent(req, 'file:uploaded', {
            taskId: task._id,
            attachment: newAttachment,
            project: task.project
        });

        res.status(200).json({
            success: true,
            data: task
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete file attachment
// @route   DELETE /api/tasks/:id/attachments/:fileId
// @access  Private
exports.deleteTaskFile = async (req, res, next) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        const attachment = task.attachments.id(req.params.fileId);

        if (!attachment) {
            return res.status(404).json({
                success: false,
                message: 'Attachment not found'
            });
        }

        // Check ownership or admin/project owner rights
        // (Assuming logic here, simplified for now to uploader or task creator)
        if (attachment.uploadedBy.toString() !== req.user.id &&
            task.createdBy.toString() !== req.user.id &&
            req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this file'
            });
        }

        // Delete from S3
        if (attachment.key) {
            await deleteFromS3(attachment.key);
        }

        // Remove from array (using pull)
        task.attachments.pull(req.params.fileId);
        await task.save();

        // Log activity
        await Activity.logActivity({
            user: req.user.id,
            action: 'deleted',
            entity: 'file',
            entityId: task._id,
            entityName: attachment.name,
            project: task.project
        });

        // Emit socket event
        emitEvent(req, 'file:deleted', {
            taskId: task._id,
            fileId: req.params.fileId,
            project: task.project
        });

        res.status(200).json({
            success: true,
            data: task
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update task position (Kanban/Gantt)
// @route   PUT /api/tasks/:id/position
// @access  Private
exports.updateTaskPosition = async (req, res, next) => {
    try {
        const { boardColumn, boardPosition, swimlane } = req.body;

        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        const changes = {};
        if (boardColumn && boardColumn !== task.boardColumn) {
            changes.fromColumn = task.boardColumn;
            changes.toColumn = boardColumn;
            task.boardColumn = boardColumn;
        }

        if (boardPosition !== undefined) task.boardPosition = boardPosition;
        if (swimlane) task.swimlane = swimlane;

        task.lastModifiedBy = req.user.id;

        await task.save();

        // Log activity only for column changes (moves)
        if (changes.toColumn) {
            await Activity.logActivity({
                user: req.user.id,
                action: 'moved',
                entity: 'task',
                entityId: task._id,
                entityName: task.title,
                project: task.project,
                changes: { column: changes }
            });
        }

        emitEvent(req, 'task:moved', {
            taskId: task._id,
            project: task.project,
            boardColumn: task.boardColumn,
            boardPosition: task.boardPosition,
            swimlane: task.swimlane
        });

        res.status(200).json({
            success: true,
            data: task
        });
    } catch (error) {
        next(error);
    }
};
