const { exec } = require('child_process');
const path = require("path")
const express = require("express")
const app = express()

app.use(express.static(path.join(__dirname, "public")))
app.use(express.static(path.join(__dirname, "pages")))

app.get("/", (req,res) => {
  exec('npx tailwindcss -i ./input.css -o ./public/out.css', (err, stdout, stderr) => {
    if (err) {
      console.error('Error building CSS:', err);
      return;
    }
  });
  res.sendFile(path.join(__dirname, "public/index.html"))
})

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`)
})