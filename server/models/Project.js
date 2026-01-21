const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a project name'],
        trim: true,
        maxlength: [100, 'Name cannot be more than 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Please add a description'],
        maxlength: [500, 'Description cannot be more than 500 characters']
    },
    status: {
        type: String,
        enum: ['planning', 'active', 'on-hold', 'completed', 'cancelled'],
        default: 'planning'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
    },
    startDate: {
        type: Date,
        required: [true, 'Please add a start date']
    },
    endDate: {
        type: Date,
        required: [true, 'Please add an end date']
    },
    budget: {
        type: Number,
        default: 0
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    teamMembers: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        role: {
            type: String,
            enum: ['owner', 'manager', 'developer', 'designer', 'tester'],
            default: 'developer'
        },
        addedAt: {
            type: Date,
            default: Date.now
        }
    }],
    tags: [{
        type: String,
        trim: true
    }],
    progress: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    // Kanban Board Configuration
    boardConfig: {
        columns: {
            type: [{
                id: String,
                name: String,
                color: String,
                limit: Number, // WIP limit
                position: Number
            }],
            default: [
                { id: 'todo', name: 'To Do', color: '#e2e8f0', limit: 0, position: 0 },
                { id: 'in-progress', name: 'In Progress', color: '#3b82f6', limit: 0, position: 1 },
                { id: 'review', name: 'Review', color: '#f59e0b', limit: 0, position: 2 },
                { id: 'completed', name: 'Completed', color: '#10b981', limit: 0, position: 3 }
            ]
        },
        swimlanes: {
            enabled: { type: Boolean, default: false },
            groupBy: { type: String, enum: ['priority', 'assignee', 'none'], default: 'none' }
        }
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
ProjectSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// Cascade delete tasks when a project is deleted
ProjectSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
    await this.model('Task').deleteMany({ project: this._id });
    next();
});

module.exports = mongoose.model('Project', ProjectSchema);
