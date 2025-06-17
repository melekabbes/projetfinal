// importation des modules
const jwt = require("jsonwebtoken"); // bich nit3amlou m3a kol  tokens JWT
const config = require("../config/auth.config.js"); // Cle secrete JWT
const db = require("../models"); // acces 3al base de donnees
const User = db.user; // Modele User

// Verifie si mawjoud wala valide token JWT
verifyToken = (req, res, next) => {
  let token = req.headers["x-access-token"] || req.query.token; // raja3 token fi l’en-tête wala la query

  if (!token) {
    return res.status(403).send({
      message: "No token provided!" // mafama 7ata token mawjoud
    });
  }

  // Vérifie la validité du token
  jwt.verify(token, config.secret, (err, decoded) => {
    if (err) {
      return res.status(401).send({
        message: "Unauthorized!" // token ghalet wala saretlou expiration
      });
    }

    req.userId = decoded.id; // nstockew l'id inta3 l user décodé dans la requête
    next(); // nit3adew lil middleware ili ba3dha
  });
};
// Verifie si user howa admin
isAdmin = (req, res, next) => {
  User.findByPk(req.userId).then(user => {
    user.getRoles().then(roles => {
      for (let i = 0; i < roles.length; i++) {
        if (roles[i].name === "admin") {
          next(); // Si l user 3andou rôle admin deja autoriser
          return;
        }
      }

      res.status(403).send({
        message: "Require Admin Role!" // Refus d acces ken mouch admin
      });
    });
  });
};
// Verifie si user howa mederateur
isModerator = (req, res, next) => {
  User.findByPk(req.userId).then(user => {
    user.getRoles().then(roles => {
      for (let i = 0; i < roles.length; i++) {
        if (roles[i].name === "moderator") {
          next(); // ken moderateur autoriser
          return;
        }
      }

      res.status(403).send({
        message: "Require Moderator Role!" // Refus l acces ken mouch moderateur
      });
    });
  });
};

// Verifie si user howa admin wala moderateur
isModeratorOrAdmin = (req, res, next) => {
  User.findByPk(req.userId).then(user => {
    user.getRoles().then(roles => {
      for (let i = 0; i < roles.length; i++) {
        if (roles[i].name === "moderator" || roles[i].name === "admin") {
          next(); // Si we7ed mi 2 roles autoriser
          return;
        }
      }

      res.status(403).send({
        message: "Require Moderator or Admin Role!" // sinon mafamech acces
      });
    });
  });
};

// Exportation de kol les middlewares ily 3malthom lil user fi fichiers ro5rin
const authJwt = {
  verifyToken: verifyToken,
  isAdmin: isAdmin,
  isModerator: isModerator,
  isModeratorOrAdmin: isModeratorOrAdmin
};

module.exports = authJwt;
