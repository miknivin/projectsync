//import db
const { response } = require('express')
const db = require('./db')
const jwt = require('jsonwebtoken')
const {Contact,User,TeamMember,Project} = require('./db');


// Function to update a contact by ID
async function updateContactById(contactId, updateData) {
  try {
    const updatedContact = await Contact.findByIdAndUpdate(
      contactId,
      updateData,
      { new: true }
    );

    if (!updatedContact) {
      throw new Error('Contact not found');
    }

    return updatedContact;
  } catch (error) {
    throw error;
  }
}

// Function to fetch contacts data from MongoDB
  async function fetchDataFromDatabase() {
      try {
        const data = await Contact.find(); // Fetch all documents from the "Contact" collection
        return data;
      } catch (error) {
        console.error('Error fetching data from MongoDB:', error);
        throw error;
      }
    }

  //logic for registeration
  const register = async (fullName, email, password, companyName, isTeamMember) => {
    try {
      // 1- Find if the user email exists
      const existingUser = await db.User.findOne({ email });
  
      if (existingUser) {
        // 3- If the email already exists, return an error code 401
        return {
          statusCode: 401,
          message: "Email Already Exist"
        };
      } else {
        // 4- Create a new user
        const newUser = new db.User({
          fullName,
          email,
          password,
          companyName,
          isTeamMember
        });
  
        // 5- Save the new user
        await newUser.save();
  
        return {
          statusCode: 200,
          message: "User saved successfully"
        };
      }
    } catch (error) {
      console.error("Error:", error);
      return {
        statusCode: 500,
        message: "Internal Server Error"
      };
    }
  };
  
  //logic for login
  const login = async (email, password) => {
    try {
      // Check if a user with the provided email exists in the database
      const user = await db.User.findOne({ email });
  
      if (!user) {
        return {
          statusCode: 401,
          message: 'User not found',
        };
      }
  
      // Check if the provided password matches the user's stored password
      if (user.password !== password) {
        return {
          statusCode: 401,
          message: 'Incorrect password',
        };
      }
  
      // If both email and password are correct, generate a JWT token for authentication
      const token = jwt.sign({ userId: user._id }, 'secret-key');
  
      return {
        statusCode: 200,
        message: 'Login successful',
        token, // Send the generated JWT token as part of the response
      };
    } catch (error) {
      console.error('Error during login:', error);
      return {
        statusCode: 500,
        message: 'Internal Server Error',
      };
    }
  };

  // Logic for team member registration
  const registerTeamMember = async (fullName, email, password, companyName) => {
    try {
      // Check if the user email exists
      const existingTeamMember = await db.TeamMember.findOne({ email });
  
      if (existingTeamMember) {
        return {
          statusCode: 401,
          message: "Email Already Exist",
        };
      } else {
        // Create a new team member
        const newTeamMember = new db.TeamMember({
          fullName,
          email,
          password,
          companyName,
        });
  
        // Save the new team member
        await newTeamMember.save();
  
        return {
          statusCode: 200,
          message: "Team member saved successfully",
        };
      }
    } catch (error) {
      console.error("Error:", error);
      return {
        statusCode: 500,
        message: "Internal Server Error",
      };
    }
  };
  
// Logic for team member login
const loginTeamMember = async (email, password) => {
  try {
    const teamMember = await db.TeamMember.findOne({ email });

    if (!teamMember) {
      return {
        statusCode: 401,
        message: "User not found",
      };
    }

    if (teamMember.password !== password) {
      return {
        statusCode: 401,
        message: "Invalid Password",
      };
    }

    // Generate a JWT token for successful login
    const token = jwt.sign({ userId: teamMember._id }, 'secret-key',);

    return {
      statusCode: 200,
      message: "Login successful",
      token, // Include the generated token in the response
    };
  } catch (error) {
    console.error("Error during team member login:", error);
    return {
      statusCode: 500,
      message: "Internal Server Error",
    };
  }
};

// Function to get a team member by email to set it to local storage
async function getTeamMemberByEmail(email) {
  try {
    const teamMember = await db.TeamMember.findOne({ email });
    return teamMember;
  } catch (error) {
    console.error('Error fetching team member by email:', error);
    throw error;
  }
}

const getAllTeamMembers = async () => {
  try {
    // Query MongoDB to fetch all team members
    const teamMembers = await TeamMember.find()

    return teamMembers;
  } catch (error) {
    // Handle any errors that occur during the database query
    console.error('Error fetching all team members:', error);
    throw error; // You can choose to handle errors as needed
  }
};


// To update all team members
async function updateAllTeamMembers(updatedTeamMembers) {
  try {
    for (const updatedMember of updatedTeamMembers) {
      // Find the team member in your database based on their _id
      const teamMember = await TeamMember.findById(updatedMember._id);

      if (!teamMember) {
        return { statusCode: 404, message: 'Team member not found' };
      }

      // Update the newLeads property with the new leads
      teamMember.newLeads = updatedMember.newLeads;

      // Save the updated team member back to the database
      await teamMember.save();
    }

    return { statusCode: 200, message: 'Team members updated successfully' };
  } catch (error) {
    console.error('Error updating team members:', error);
    return { statusCode: 500, message: 'Internal Server Error' };
  }
}

// Update a single team memer by _id
async function updateTeamMemberById(teamMemberId, updatedTeamMemberData) {
  try {
    const teamMember = await TeamMember.findById(teamMemberId);

    if (!teamMember) {
      return { statusCode: 404, message: 'Team member not found' };
    }

    // Update the team member's data with fields from updatedTeamMemberData
    Object.keys(updatedTeamMemberData).forEach((field) => {
      teamMember[field] = updatedTeamMemberData[field];
    });

    // Save the updated team member back to the database
    await teamMember.save();

    return { statusCode: 200, message: 'Team member updated successfully' };
  } catch (error) {
    console.error('Error updating team member:', error);
    return { statusCode: 500, message: 'Internal Server Error' };
  }
}




// Function to create a new project
const createProject = async (projectName, projectDesc, tasks) => {
  try {
    // Check if a project with the same name already exists
    const existingProject = await Project.findOne({ projectName });

    if (existingProject) {
      return {
        statusCode: 400,
        message: 'Project with the same name already exists',
      };
    }

    // Create a new project with a unique ID
    const newProject = new Project({
      projectName,
      projectDesc,
      tasks,
    });

    // Save the new project to the database
    await newProject.save();

    return {
      statusCode: 200,
      message: 'Project created successfully',
      project: newProject, // Include the newly created project in the response
    };
  } catch (error) {
    console.error('Error creating project:', error);
    return {
      statusCode: 500,
      message: 'Internal Server Error',
    };
  }
};

//logic for getting all projects
async function getAllProjects() {
  try {
    // Use Mongoose's find method to retrieve all projects
    const projects = await Project.find();
    return projects;
  } catch (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }
}

async function updateProject(projectId, updatedData) {
  try {
    const project = await Project.findById(projectId);

    if (!project) {
      return { statusCode: 404 };
    }

    // Extract updated project details
    const { projectName, projectDesc, tasks } = updatedData;

    if (projectName) {
      project.projectName = projectName;
    }
    if (projectDesc) {
      project.projectDesc = projectDesc;
    }

    if (tasks) {
      tasks.forEach((updatedTask) => {
        // Find the existing task by _id
        const existingTaskById = project.tasks.find(
          (task) => task.taskId === updatedTask.taskId
        );

        // Find the existing task by taskName
        const existingTaskByName = project.tasks.find(
          (task) => task.taskName === updatedTask.taskName
        );

        if (existingTaskById) {
          // Update existing task properties based on _id match
          Object.assign(existingTaskById, updatedTask);
          console.log('Updated task by _id:', existingTaskById);
        } else if (existingTaskByName) {
          // Update existing task properties based on taskName match
          Object.assign(existingTaskByName, updatedTask);
          console.log('Updated task by taskName:', existingTaskByName);
        } else {
          // Add new task
          project.tasks.push(updatedTask);
          console.log('Added new task');
        }
      });
    }

    // Save the updated project
    await project.save();

    return { statusCode: 200 };
  } catch (err) {
    console.error(err);
    return { statusCode: 500 };
  }
}



//logic for getting project details with id
  async function getProjectById(projectId) {
    try {
      // Find the project by ID
      const project = await Project.findById(projectId);

      return project;
    } catch (err) {
      console.error(err);
      throw err; // You can handle the error in the route handler
    }
  }


  module.exports = {
    fetchDataFromDatabase,
    register,
    login,
    registerTeamMember,
    loginTeamMember,
    getTeamMemberByEmail,
    createProject,
    getAllProjects,
    updateProject,
    getProjectById,
    getAllTeamMembers,
    updateAllTeamMembers,
    updateTeamMemberById,
    updateContactById
  };