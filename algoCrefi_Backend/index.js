require("dotenv").config();

const app = require("./app");
const connectDB = require("./src/configs/db");

// connect database
connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});