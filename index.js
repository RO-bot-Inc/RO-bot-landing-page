const { exec } = require('child_process');
const path = require("path")
const express = require("express")
const nodemailer = require('nodemailer')
const app = express()

app.use(express.static(path.join(__dirname, "public")))
app.use(express.static(path.join(__dirname, "pages")))
app.use(express.json())

// Create email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

app.post('/submit-form', async (req, res) => {
  try {
    const { fullName, email, dealership, role, challenge } = req.body;
    
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Send to yourself
      subject: 'New Waitlist Signup',
      text: `
        New signup:
        Name: ${fullName}
        Email: ${email}
        Dealership: ${dealership}
        Role: ${role}
        Challenge: ${challenge}
      `
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({ success: false });
  }
});

app.get("/", (req,res) => {
  exec('npx tailwindcss -i ./input.css -o ./public/out.css', (err, stdout, stderr) => {
    if (err) {
      console.error('Error building CSS:', err);
      return;
    }
  });
  res.sendFile(path.join(__dirname, "pages/index.html"))
})

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`)
})