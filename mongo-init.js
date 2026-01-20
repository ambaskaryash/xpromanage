// MongoDB initialization script
db = db.getSiblingDB('xpromanage');

// Create collections
db.createCollection('users');
db.createCollection('projects');
db.createCollection('tasks');
db.createCollection('teams');

// Create indexes for better performance
db.users.createIndex({ email: 1 }, { unique: true });
db.projects.createIndex({ createdBy: 1 });
db.tasks.createIndex({ project: 1 });
db.tasks.createIndex({ assignedTo: 1 });

print('Database initialized successfully!');
