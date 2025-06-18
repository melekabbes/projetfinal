// melek
const express = require("express");
const cors = require("cors");
const path = require("path");
// ahmed
const methodOverride = require('method-override');
//melek
const app = express();

// Middleware CORS (ajuste l'origine si besoin)
app.use(cors({ origin: "http://localhost:8081" }));

// Parser JSON et URL-encoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//ahmed
// Pour supporter PUT/DELETE via _method dans form
app.use(methodOverride('_method'));
//melek
// Servir les fichiers statiques (CSS, JS, images génériques) dans /app
app.use(express.static(path.join(__dirname, "app")));
//rihab
// Servir le dossier uploads pour les images des films
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
//melek
// Configuration du moteur de vues
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "app", "views"));

// Import des modèles Sequelize
const db = require("./app/models");
//ahmed(salle,reservation)+melek(seance)+rihab(le reste)
// Import des routes
const moderatorRoutes = require("./app/routes/moderator.routes");
const filmRoutes = require("./app/routes/film.routes");
const reservationRoutes = require('./app/routes/reservation.routes');
const paymentRoutes = require('./app/routes/payments.routes');
//ahmed(salle,reservation)+melek(seance)+rihab(le reste)
// Utilisation des routes
app.use("/moderator", moderatorRoutes);
app.use("/", filmRoutes); // tes routes films ici
app.use('/reservations', reservationRoutes);
app.use('/payments', paymentRoutes);
// melek
// Autres routes API JSON
require('./app/routes/auth.routes')(app);
require('./app/routes/user.routes')(app);
require("./app/routes/page.routes")(app);

// Synchroniser la base de donnees et creer les rôles par défaut si besoin
db.sequelize.sync({ alter: true }).then(() => {
    console.log("Database synced");

    return db.role.count();
  })
  .then(count => {
    if (count === 0) {
      return db.role.bulkCreate([
        { id: 1, name: "user" },
        { id: 2, name: "admin" },
        { id: 3, name: "moderator" }
      ]);
    }
  })
  .then(() => {
    console.log("Default roles inserted.");
  })
  .catch(err => {
    console.error("Error during DB setup:", err);
  });

// Demarrage du serveur
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
