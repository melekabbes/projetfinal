const express = require("express");
const router = express.Router();
const db = require("../models");
const { Op } = require("sequelize");
router.get("/queues", async (req, res) => {
  try {
    const films = await db.film.findAll();
    const filmsWithBase64Image = films.map(film => {
      let base64Image = null;
      if (film.image_affiche) {
        base64Image = film.image_affiche.toString('base64');
      }
      return {
        ...film.dataValues,
        image_base64: base64Image
      };
    });
    res.render("queues", { films: filmsWithBase64Image });
  } catch (err) {
    console.error("Erreur affichage films:", err);
    res.status(500).send({ message: err.message });
  }
});
router.get("/user-seance/:filmId", async (req, res) => {
  try {
    const filmId = req.params.filmId;
    const film = await db.film.findByPk(filmId);
    if (!film) {
      return res.status(404).send('Film non trouvé');
    }
    const filmWithBase64 = {
      ...film.dataValues,
      image_base64: film.image_affiche ? film.image_affiche.toString('base64') : null
    };
    const seances = await db.seance.findAll({
      where: {
        id_film: filmId,
        date_heure: {
          [Op.gte]: new Date()
        }
      },
      include: [{
        model: db.salle,
        as: 'salle',
        required: true
      }],
      order: [['date_heure', 'ASC']]
    });

    res.render('user-seance', { 
      film: filmWithBase64,
      seances: seances
    });
    
  } catch (error) {
    console.error("Erreur lors de la récupération des séances:", error);
    res.status(500).send('Erreur serveur');
  }
});
router.post("/reservation/:seanceId", async (req, res) => {
  try {
    const userId = req.user?.id || 1; // pour test
    const seanceId = req.params.seanceId;
    const nombrePlaces = parseInt(req.body.nombre_places, 10) || 1;
    const seance = await db.seance.findByPk(seanceId);
    if (!seance) {
      return res.status(404).send('Séance non trouvée');
    }
    if (seance.places_disponibles < nombrePlaces || nombrePlaces <= 0) {
      return res.status(400).send('Nombre de places invalide ou insuffisant');
    }
    await db.reservation.create({
      id_utilisateur: userId,
      id_seance: seanceId,
      nb_places: nombrePlaces, 
      statut: 'en_attente',
      date_reservation: new Date() 
    });
    seance.places_disponibles -= nombrePlaces;
    await seance.save();
    res.redirect("/confirmation-reservation");
  } catch (error) {
    console.error("Erreur lors de la réservation:", error);
    res.status(500).send('Erreur serveur');
  }
});
router.get("/confirmation-reservation", (req, res) => {
  res.render("confirmation-reservation");
});
module.exports = router;
