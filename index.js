const express = require('express');
const bodyParser = require('body-parser');
const { Contact,User,TeamMember, Project } = require('./server/db'); // Import the Contact model
const logic = require('./server/logic');
const cors = require('cors');
const mongoose = require('mongoose');
const { JsonWebTokenError } = require('jsonwebtoken');
const jwt = require('jsonwebtoken')
const app = express();
app.use(cors({
  origin: 'http://localhost:4200'
}));
// Middleware for parsing JSON and URL-encoded form data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Connect to MongoDB while using findone
mongoose.connect('mongodb+srv://NIVIN:Nivin23@cluster0.wdtxlhm.mongodb.net/projectsync?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch(err => {
    console.error('Error connecting to MongoDB:', err);
  });


// Handle form submission
app.post('/contacts/submit-form', async (req, res) => {
  const { fullName, email, phone, message } = req.body;

  // Create a new contact document
  const newContact = new Contact({
    fullName,
    email,
    phone,
    message,
    currentPipelineStage: 'New Lead'
  });

  // Save the document to MongoDB
  try {
    // Save the document to MongoDB and await the promise
    await newContact.save();
    res.status(200).json({ message: 'Form submitted successfully' });
    console.log(req.body);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});


// Handle GET request to retrieve data from the database
app.get('/contacts/submitted-data', async (req, res) => {
  try {
    const data = await logic.fetchDataFromDatabase(); // Use the fetchDataFromDatabase function
    res.status(200).json(data);
    // console.log('Data Fetched succesfully'); // Send the data as JSON response
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

//get contact data from id
app.get('/contacts/:id', async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    res.status(200).json(contact);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Handle PUT request to update pipeline stage
app.put('/contacts/update-pipeline-stage/:contactId', async (req, res) => {
  const contactId = req.params.contactId;
  const newPipelineStage = req.body.newPipelineStage; // Assuming you send the new pipeline stage in the request body

  try {
    // Update the pipeline stage for the contact with the given ID
    await Contact.findByIdAndUpdate(contactId, { currentPipelineStage: newPipelineStage });

    res.status(200).json({ message: 'Pipeline stage updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

// Update a contact by ID route
app.put('/contacts/update/:id', async (req, res) => {
  const contactId = req.params.id;
  const updateData = req.body;
  try {
    const updatedContact = await logic.updateContactById(contactId, updateData);
    res.json(updatedContact);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a contact by _id
app.delete('/contacts/delete/:id', async (req, res) => {
  try {
    const contactId = req.params.id;

    // Use Mongoose to find and remove the contact by _id
    const deletedContact = await Contact.findByIdAndRemove(contactId);

    if (!deletedContact) {
      // If contact is not found, send a 404 status code
      return res.status(404).json({ message: 'Contact not found' });
    }

    res.status(200).json({ message: 'Contact deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Register route
app.post('/users/register', async (req, res) => {
  const { fullName, email, password, companyName, isTeamMember } = req.body;

  try {
    const result = await logic.register(fullName, email, password, companyName, isTeamMember);
    res.status(result.statusCode).json({ message: result.message });
    console.log(req.body);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Login route for user authentication and token generation
app.post('/users/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Call the login function to authenticate the user and generate a token
    const loginResult = await logic.login(email, password);

    if (loginResult.statusCode === 200) {
      // If login is successful, set the token in the response header
      res.header('user-token', loginResult.token);
      res.status(200).json({ message: 'Login successful', token: loginResult.token });
    } else {
      // If login fails, send an error response
      res.status(loginResult.statusCode).json({ message: loginResult.message });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Handle POST request for team member registration
app.post('/team-members/register', async (req, res) => {
  const { fullName, email, password, companyName } = req.body;

  try {
    const registrationResult = await logic.registerTeamMember(
      fullName,
      email,
      password,
      companyName
    );

    if (registrationResult.statusCode === 200) {
      res.status(200).json({ message: 'Team member registration successful' });
    } else {
      res.status(registrationResult.statusCode).json({
        message: registrationResult.message,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

//post method for team member login

app.post('/team-members/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const loginResult = await logic.loginTeamMember(email, password);

    if (loginResult.statusCode === 200) {
      // Authentication successful, you can generate and return a JWT token here
      const token = loginResult.token;
      res.status(200).json({ message: 'Login successful', token });
    } else {
      res.status(loginResult.statusCode).json({
        message: loginResult.message,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

//get method to fetch team member id with email

// Define an API endpoint to fetch a team member by email
app.get('/team-members/get-by-email/:email', async (req, res) => {
  const email = req.params.email; // Get the email from the URL parameter

  try {
    // Call the logic function to fetch the team member by email
    const teamMember = await logic.getTeamMemberByEmail(email);

    if (teamMember) {
      // If a team member is found, send it as a JSON response
      res.status(200).json(teamMember);
    } else {
      // If no team member is found, send a 404 status code
      res.status(404).json({ message: 'Team member not found' });
    }
  } catch (error) {
    console.error('Error fetching team member by email:', error);
    // Handle any errors that occur during the database query
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// GET request to retrieve all team members
app.get('/team-members', async (req, res) => {
  try {
    const teamMembers = await logic.getAllTeamMembers();
    res.status(200).json(teamMembers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

//put request to update all team members

app.put('/team-members/update-all', async (req, res) => {
  const updatedTeamMembers = req.body;

  try {
    const updateResult = await logic.updateAllTeamMembers(updatedTeamMembers);

    if (updateResult.statusCode === 200) {
      res.status(200).json({ message: 'Team members updated successfully' });
    } else {
      res.status(updateResult.statusCode).json({
        message: updateResult.message,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// DELETE request to remove a team member by _id
app.delete('/team-members/delete/:id', async (req, res) => {
  const teamMemberId = req.params.id;

  try {
    // Use Mongoose's findByIdAndRemove to delete the team member by _id
    const deletedTeamMember = await TeamMember.findByIdAndRemove(teamMemberId);

    if (deletedTeamMember) {
      res.status(200).json({ message: 'Team member deleted successfully' });
    } else {
      res.status(404).json({ message: 'Team member not found' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


// Create a POST request handler for project creation
app.post('/projects/create', async (req, res) => {
  // Extract data from the request body
  const { projectName, projectDesc, tasks } = req.body;

  try {
    // Call the createProject function to create the project
    const result = await logic.createProject(projectName, projectDesc, tasks);

    // Check the statusCode in the result to send an appropriate response
    if (result.statusCode === 200) {
      res.status(200).json({ message: 'Project created successfully', project: result.project });
    } else if (result.statusCode === 400) {
      res.status(400).json({ message: 'Project with the same name already exists' });
    } else {
      res.status(500).json({ message: 'Internal Server Error' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// GET request to retrieve all project data
app.get('/projects', async (req, res) => {
  try {
    // Call the getAllProjects function to fetch all project data
    const projects = await logic.getAllProjects();
    // Send the fetched projects as a JSON response
    res.status(200).json(projects);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// PUT request to update tasks and subtasks completed status
app.put('/projects/update-task-status/:projectId/:taskId', async (req, res) => {
  const projectId = req.params.projectId;
  const taskId = req.params.taskId;

  try {
    // Find the project by projectId
    const project = await Project.findById(projectId);

    // Find the task by taskId within the project
    const task = project.tasks.id(taskId);

    // Update the task's completed status to true
    task.completed = true;

    // Save the updated project
    await project.save();

    res.status(200).json({ message: 'Task status updated to true successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

app.put('/team-members/update/:id', async (req, res) => {
  const teamMemberId = req.params.id;
  const updatedTeamMemberData = req.body;

  try {
    const updateResult = await logic.updateTeamMemberById(teamMemberId, updatedTeamMemberData);

    if (updateResult.statusCode === 200) {
      res.status(200).json({ message: 'Team member updated successfully' });
    } else {
      res.status(updateResult.statusCode).json({
        message: updateResult.message,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


app.put('/projects/update-task-status/:projectId/:taskId/:completed', async (req, res) => {
  const projectId = req.params.projectId;
  const taskId = req.params.taskId;
  const completed = req.params.completed === 'true';// Extract the completed status from the request body

  try {
    // Find the project by projectId
    const project = await Project.findById(projectId);

    // Find the task by taskId within the project
    const task = project.tasks.id(taskId);

    // Update the task's completed status based on the 'completed' value received in the request body
    task.completed = completed;

    // Save the updated project
    await project.save();

    res.status(200).json({ message: 'Task status updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

// PUT request to update subtask status
app.put('/projects/update-subtask-status/:projectId/:taskId/:subtaskId/:completed', async (req, res) => {
  const projectId = req.params.projectId;
  const taskId = req.params.taskId;
  const subtaskId = req.params.subtaskId;
  const completed = req.params.completed === 'true'; // Convert the completed parameter to a boolean

  try {
    // Find the project by projectId
    const project = await Project.findById(projectId);

    // Find the task by taskId within the project
    const task = project.tasks.id(taskId);

    // Check if the task has subtasks
    if (!task.subtasks || task.subtasks.length === 0) {
      return res.status(400).json({ message: 'No subtasks found for the given task' });
    }

    // Find the subtask by subtaskId within the task
    const subtask = task.subtasks.id(subtaskId);

    // Check if the subtask exists
    if (!subtask) {
      return res.status(404).json({ message: 'Subtask not found' });
    }

    // Update the subtask's completed status based on the 'completed' parameter
    subtask.completed = completed;

    // Save the updated project
    await project.save();

    res.status(200).json({ message: 'Subtask status updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

// PUT request to update a project, including tasks and subtasks
app.put('/projects/update/:projectId', async (req, res) => {
  const projectId = req.params.projectId;

  try {
    // Call the updateProject function from logic.js
    const result = await logic.updateProject(projectId, req.body);

    if (result.statusCode === 200) {
      res.status(200).json({ message: 'Project updated successfully' });
    } else if (result.statusCode === 404) {
      res.status(404).json({ message: 'Project not found' });
    } else {
      res.status(500).json({ message: 'Internal Server Error' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

// GET request to retrieve project details by ID
app.get('/projects/:projectId', async (req, res) => {
  const projectId = req.params.projectId;

  try {
    // Call the getProjectById function from logic.js
    const project = await logic.getProjectById(projectId);

    if (project) {
      res.status(200).json(project);
    } else {
      res.status(404).json({ message: 'Project not found' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});


// DELETE request to delete a task by taskId within a project by projectId
// DELETE request to delete a task by taskId within a project by projectId
app.delete('/projects/delete-task/:projectId/:taskId', async (req, res) => {
  const projectId = req.params.projectId;
  const taskId = req.params.taskId;

  try {
    // Find the project by projectId
    const project = await Project.findById(projectId);

    // Check if the project exists
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Use forEach to find the task with matching taskId and remove it
    let taskIndex = -1;
    project.tasks.forEach((task, index) => {
      if (task.taskId === parseInt(taskId)) {
        taskIndex = index;
      }
    });

    // If the task was found, remove it
    if (taskIndex !== -1) {
      project.tasks.splice(taskIndex, 1);

      // Save the updated project
      await project.save();

      return res.status(200).json({ message: 'Task deleted successfully' });
    } else {
      return res.status(404).json({ message: 'Task not found' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

// DELETE request to delete a project by ID
app.delete('/projects/delete/:projectId', async (req, res) => {
  const projectId = req.params.projectId;

  try {
    // Use Mongoose's findByIdAndDelete to delete the project by ID
    const deletedProject = await Project.findByIdAndDelete(projectId);

    if (deletedProject) {
      res.status(200).json({ message: 'Project deleted successfully' });
    } else {
      res.status(404).json({ message: 'Project not found' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});



// Start the server on port 5000
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
