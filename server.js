const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

// Initialize the Express app
const app = express();

// Connect to MongoDB (replace with your MongoDB connection string)
mongoose.connect('mongodb://localhost:27017/student_database');

// Create a schema for student marks
const studentSchema = new mongoose.Schema({
  name: String,
  roll_no: String,
  semester: String,
  subjects: [
    {
      subject_name: String,
      marks: Number
    }
  ],
  total_marks: Number,
  average_marks: Number
});

// Create a model based on the schema
const Student = mongoose.model('Student', studentSchema);

// Middleware to parse form data
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static HTML form
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/form.html');
});

// Handle form submissions and perform calculations
app.post('/submit', async (req, res) => {
  try {
    const subjects = [
      { subject_name: req.body.subject1, marks: parseInt(req.body.marks1) },
      { subject_name: req.body.subject2, marks: parseInt(req.body.marks2) },
      { subject_name: req.body.subject3, marks: parseInt(req.body.marks3) },
      { subject_name: req.body.subject4, marks: parseInt(req.body.marks4) }
    ];

    // Calculate total and average marks
    const totalMarks = subjects.reduce((total, subject) => total + subject.marks, 0);
    const averageMarks = totalMarks / subjects.length;

    // Create the student data
    const studentData = new Student({
      name: req.body.name,
      roll_no: req.body.roll_no,
      semester: req.body.semester,
      subjects: subjects,
      total_marks: totalMarks,
      average_marks: averageMarks
    });

    // Save the data to MongoDB using async/await
    await studentData.save();  // Removed callback, using await

    // Redirect to the result page and pass the student's ID as a query parameter
    res.redirect(`/result?id=${studentData._id}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error saving data");
  }
});

// Handle the result page to show total and average marks
app.get('/result', async (req, res) => {
  try {
    // Fetch the student data by ID
    const student = await Student.findById(req.query.id);
    
    if (!student) {
      return res.send("Student data not found");
    }

    // Display the student result
    res.send(`
      <h1>Student Mark Details</h1>
      <p><strong>Name:</strong> ${student.name}</p>
      <p><strong>Roll No:</strong> ${student.roll_no}</p>
      <p><strong>Semester:</strong> ${student.semester}</p>
      
      <h2>Subject Marks:</h2>
      <ul>
        ${student.subjects.map(subject => `<li>${subject.subject_name}: ${subject.marks}</li>`).join('')}
      </ul>

      <p><strong>Total Marks:</strong> ${student.total_marks}</p>
      <p><strong>Average Marks:</strong> ${student.average_marks.toFixed(2)}</p>
      <a href="/">Go back to form</a>
    `);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching data");
  }
});

// Start the server
app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
