const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://NIVIN:Nivin23@cluster0.wdtxlhm.mongodb.net/projectsync?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB', err);
  });

const Contact = mongoose.model('Contact', {
  fullName: String,
  email: String,
  phone: String,
  message: String,
  created: { type: Date, default: Date.now },
  inPipelines: { type: Array, default: [] },
  currentPipelineStage: { type: String, default: 'New Lead' }, 
  tags:{type:Array,default:[]}
});

const User = mongoose.model('User',{
  fullName:String,
  companyName:String,
  email:String,
  password:String,
  isTeamMemeber:{type:Boolean,default:false},
  created: { type: Date, default: Date.now }
})

const TeamMember = mongoose.model('TeamMember',{
  fullName:String,
  companyName:String,
  email:String,
  password:String,
  isTeamMemeber:{type:Boolean,default:true},
  completedTasks:{ type: Array, default: [] },
  pendingTasks:{ type: Array, default: [] },
  dueTasks:{ type: Array, default: [] },
  newLeads:{ type: Array, default: [] },
  closedLeads:{type: Array, default: []},
  created: { type: Date, default: Date.now }
})

//project schema

const projectSchema = new mongoose.Schema({
  projectName: String,
  projectDesc: String,
  tasks: [
    {
      taskId: {
        type: Number,
        unique: true,
        required: true,
        default: function () {
          // Generate a random 6-digit ID
          return Math.floor(100000 + Math.random() * 900000);
        },
      },
      taskName: String,
      taskDesc: String,
      taskDate: Date,
      completed: { type: Boolean, default: false },
      subtasks: [
        {
          subTaskName: String,
          subTaskDesc: String,
          subTaskDate: Date,
          completed: { type: Boolean, default: false },
          subTaskId: {
            type: Number,
            unique: true,
            required: true,
            default: function () {
              // Generate a random 6-digit ID
              return Math.floor(1000 + Math.random() * 9000);
            },
          },
        },
      ],
    },
  ],
  created: { type: Date, default: Date.now },
});

// Define a pre-save hook
projectSchema.pre('save', function (next) {
  // Loop through the tasks and update subtasks.completed accordingly
  this.tasks.forEach(task => {
    if (task.completed) {
      task.subtasks.forEach(subtask => {
        subtask.completed = true;
      });
    }
  });

  next(); // Continue with the save operation
});

const Project = mongoose.model('Project', projectSchema);

module.exports = {
  Contact,
  User,
  TeamMember,
  Project
};
