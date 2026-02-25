import bcrypt from "bcryptjs";

// Define users with hashed passwords
export const users = [
  {
    id: 1,
    name: "Siddhi",
    email: "siddhi@gmail.com",
    password: bcrypt.hashSync("123", 10), // hashed password
  },
  {
    id: 2,
    name: "Bob",
    email: "bob@example.com",
    password: bcrypt.hashSync("mypassword", 10),
  },
];
