const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const path = require("path");

const dbPath = path.join(__dirname, "userData.db");
let app = express();
app.use(express.json());

let database = null;

const initalizeDbandServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is started");
    });
  } catch (e) {
    console.log(`${e.message}`);
    process.exit(1);
  }
};
initalizeDbandServer();

const validatePassword = (password) => {
  return password.length > 5;
};

app.post("/register/", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashPass = await bcrypt.hash(password, 10);
  const selectUserQuery = `SELECT * FROM user
     WHERE username='${username}';`;
  const dbUser = await database.get(selectUserQuery);
  if (dbUser === undefined) {
    const createUserQuery = `INSERT INTO user (username, name, password, gender, location)
        VALUES (
            '${username}',
            '${name}',
            '${hashPass}',
            '${gender}',
            '${location}'
            );`;
    if (validatePassword(password)) {
      await database.run(createUserQuery);
      response.send("user created successfully");
    } else {
      response.status(400);
      response.send("password is too short");
    }
  } else {
    response.status(400);
    response.send("user is already exist");
  }

  app.post("/login/", async (request, response) => {
    const { username, password } = request.body;
    const selectUserQuery = `SELECT * FROM user
    WHERE username= '${username}';`;
    const dbUser = await database.get(selectUserQuery);
    if (dbUser === undefined) {
      response.status(400);
      response.send("Invalid User");
    } else {
      const comparePass = await bcrypt.compare(password, dbUser.password);
      if (comparePass === true) {
        response.send("Login Successfully");
      } else {
        response.status(400);
        response.send("Invalid Password");
      }
    }
  });

  app.put("/change-password/", async (request, response) => {
    const { username, oldPassword, newPassword } = request.body;
    const selectUserQuery = `SELECT * FROM user
      WHERE username = '${username}';`;
    const dbUser = await database.get(selectUserQuery);
    if (dbUser === undefined) {
      response.status(400);
      response.send("Invalid User");
    } else {
      const comparePass = await bcrypt.compare(oldPassword, dbUser.password);
      if (comparePass) {
        if (validatePassword(newPassword)) {
          const hashedPass = await bcrypt.hash(newPassword, 10);
          const updateUserQuery = `UPDATE user
                    SET password = '${hashedPass}'
                    WHERE username = '${username}';`;
          await database.run(updateUserQuery);
          response.send("password updated successfully");
        } else {
          response.status(400);
          response.send("password is too short");
        }
      } else {
        response.status(400);
        response.send("invalid password");
      }
    }
  });
});

module.export = app;
