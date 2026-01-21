const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a task title'],
        trim: true,
        maxlength: [100, 'Title cannot be more than 100 characters']
    },
    description: {
        type: String,
        maxlength: [1000, 'Description cannot be more than 1000 characters']
    },
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: [true, 'Task must belong to a project']
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['todo', 'in-progress', 'review', 'completed', 'blocked'],
        default: 'todo'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
    },
    dueDate: {
        type: Date
    },
    estimatedHours: {
        type: Number,
        min: 0
    },
    actualHours: {
        type: Number,
        min: 0,
        default: 0
    },
    tags: [{
        type: String,
        trim: true
    }],
    attachments: [{
        name: String,
        url: String,
        key: String, // S3 key for deletion
        size: Number,
        type: String,
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    // Kanban Board fields
    boardColumn: {
        type: String,
        default: 'todo'
    },
    boardPosition: {
        type: Number,
        default: 0
    },
    swimlane: {
        type: String // priority, assignee, or custom
    },
    // Gantt Chart fields
    dependencies: [{
        task: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Task'
        },
        type: {
            type: String,
            enum: ['FS', 'SS', 'FF', 'SF'], // Finish-to-Start, Start-to-Start, Finish-to-Finish, Start-to-Finish
            default: 'FS'
        },
        lag: {
            type: Number,
            default: 0 // in days
        }
    }],
    duration: {
        type: Number, // in days
        default: 1
    },
    progress: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    startDate: {
        type: Date
    },
    // Calendar fields
    isMilestone: {
        type: Boolean,
        default: false
    },
    isRecurring: {
        type: Boolean,
        default: false
    },
    recurrenceRule: {
        type: String // RRULE format
    },
    // Activity tracking
    lastModifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    comments: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        text: {
            type: String,
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    completedAt: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt timestamp before saving
TaskSchema.pre('save', function (next) {
    this.updatedAt = Date.now();

    // Set completedAt when status changes to completed
    if (this.status === 'completed' && !this.completedAt) {
        this.completedAt = Date.now();
    }

    next();
});

// Create index for better query performance
TaskSchema.index({ project: 1, status: 1 });
TaskSchema.index({ assignedTo: 1 });

module.exports = mongoose.model('Task', TaskSchema);
