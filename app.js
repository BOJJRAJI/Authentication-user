const express = require("express");
const app = express();
app.use(express.json());

const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

const bcrypt = require("bcrypt");

const path = require("path");
const dbPath = path.join(__dirname, "userData.db");

let db = null;

let initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Sever Running on http://localhost/3000");
    });
  } catch (e) {
    console.log(`DB Error:${e.message}`);
  }
};

initializeDbAndServer();

//Register user API
app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const getUserQuery = `SELECT * FROM user where username='${username}';`;
  const dbUser = await db.get(getUserQuery);

  if (dbUser === undefined) {
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      const addUserQuery = `
      INSERT INTO user (username,name,password,gender,location)
      VALUES
      (
          '${username}',
          '${name}',
          '${password}',
          '${gender}',
          '${location}'
      );
      `;
      await db.run(addUserQuery);
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//Login User
app.post("/login", async (request, response) => {
  const { username, password } = request.body;

  const userDetails = `SELECT * FROM user WHERE username ='${username}'`;
  const dbUser = await db.get(userDetails);

  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordValid = await bcrypt.compare(
      request.body.password,
      dbUser.password
    );
    if (isPasswordValid === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//update Password

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;

  const getUserQuery = `SELECT * FROM user where username='${username}';`;
  const dbUser = await db.get(getUserQuery);

  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(
      oldPassword,
      dbUser.password
    );
    if (isPasswordMatched === true) {
      if (password.length < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        const updatePasswordQuery = `
      UPDATE user SET 
      password=${hashedNewPassword}
      WHERE username='${username}'

      ;`;
        response.status(200);
        response.send("Password updated");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});

module.exports = app;
