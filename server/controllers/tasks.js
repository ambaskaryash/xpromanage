const Task = require('../models/Task');
const Project = require('../models/Project');

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
            .populate('comments.user', 'name avatar');

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

        const task = await Task.create(req.body);

        res.status(201).json({
            success: true,
            data: task
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

        task = await Task.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

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

        await task.remove();

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

        res.status(200).json({
            success: true,
            data: task
        });
    } catch (error) {
        next(error);
    }
};
