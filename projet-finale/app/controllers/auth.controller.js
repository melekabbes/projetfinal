const db = require("../models");
const config = require("../config/auth.config");
const User = db.user;
const Role = db.role;
 
const Op = db.Sequelize.Op;
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// SIGNUP
exports.signup = (req, res) => {
  User.create({
    username: req.body.username,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 8)
  })
    .then(user => {
      if (req.body.roles) {
        Role.findAll({
          where: {
            name: {
              [Op.or]: req.body.roles
            }
          }
        }).then(roles => {
          user.setRoles(roles).then(() => {
            res.send({ message: "User was registered successfully!" });
          });
        });
      } else {
        // par default role inte3ou ykoun user
        user.setRoles([1]).then(() => {
          res.send({ message: "User was registered successfully!" });
        });
      }
    })
    .catch(err => {
      res.status(500).send({ message: err.message });
    });
};

// SIGNIN
exports.signin = (req, res) => {
  User.findOne({
    where: { username: req.body.username }
  })
  .then(user => {
    // user mouch mawjoud
    if (!user) {
      return res.status(404).send({ message: "User Not found." });
    }
    // user mouch par defaut lesem ykon desactive
    if (!user.active) {
      return res.status(403).send({ message: "compte desactive. veuillez attendre que l'admin verifie ou active votre compte" });
    }
    const passwordIsValid = bcrypt.compareSync(req.body.password, user.password);
    // verifie itha l password true wala le
    if (!passwordIsValid) {
      return res.status(401).send({ message: "Invalid Password!" });
    }

    const token = jwt.sign({ id: user.id }, config.secret, {
      algorithm: "HS256",
      allowInsecureKeySizes: true,
      expiresIn: 86400
    });

    user.getRoles().then(roles => {
      const roleNames = roles.map(role => role.name);
      // ba3ed el connexion inta3 admin todh horlou l interface inte3ou
      if (roleNames.includes("admin")) {
        res.render("admin-dashboard", {
          token,
          username: user.username
        });
      } 
      // ba3ed el connexion inta3 moderateur todh horlou l interface inte3ou
      else if (roleNames.includes("moderator")) {
         res.render("moderator-dashboard", {
          token,
          username: user.username,
          email: user.email
        });
      } 
  else {
    res.render("user-dashboard", {
      username: user.username,
      email: user.email,
      plainPassword: req.body.password,
      token
    });
  }
  });
  })
  .catch(err => {
    res.status(500).send({ message: err.message });
  });
};




exports.listUsers = async (req, res) => {
  try {
    const users = await User.findAll({ include: Role });
    const filteredUsers = users.filter(user =>
      !user.roles.some(role => role.name === "admin")
    );

    res.render("user-list", { users: filteredUsers });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};


exports.promoteToModerator = async (req, res) => {
  console.log("PromoteToModerator called with userId:", req.body.userId);
  try {
    const user = await User.findOne({ where: { id: req.body.userId } });
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }
    const moderatorRole = await Role.findOne({ where: { name: "moderator" } });
    await user.addRole(moderatorRole);
    res.status(200).send({ message: "User promoted successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: err.message });
  }
};

exports.demoteFromModerator = async (req, res) => {
  try {
    const user = await User.findOne({ where: { id: req.body.userId } });
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    const moderatorRole = await Role.findOne({ where: { name: "moderator" } });
    const userRole = await Role.findOne({ where: { name: "user" } });
    // ne7i role moderator mil user
    await user.removeRole(moderatorRole);
    // Ajoute le rôle user
    await user.addRole(userRole);
    res.status(200).send({ message: "User demoted to user successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: err.message });
  }
};
exports.activerUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.body.userId);
    if (!user) return res.status(404).send({ message: "User not found" });
    await user.update({ active: true });
    res.status(200).send({ message: "User activer" });
  } catch (err) { res.status(500).send({ message: err.message }); }
};

exports.desactiverUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.body.userId);
    if (!user) return res.status(404).send({ message: "User not found" });
    await user.update({ active: false });
    res.status(200).send({ message: "User desactiver" });
  } catch (err) { res.status(500).send({ message: err.message }); }
};


