const db = require('../models');
const Paiement = db.paiement;
const Reservation = db.reservation;

exports.getPayments = async (req, res) => {
  try {
    console.log('User ID:', req.userId);
    
    // Trouver les réservations de l'utilisateur avec les paiements associés
    const reservations = await Reservation.findAll({
      where: { id_utilisateur: req.userId },
      include: [{
        model: Paiement,
        as: 'paiement' // Assurez-vous que c'est le bon nom d'association
      }],
      order: [[{model: Paiement, as: 'paiement'}, 'date_paiement', 'DESC']]
    });

    // Extraire et formater les paiements
    const payments = reservations
      .filter(res => res.paiement) // Ne garder que les réservations avec paiement
      .map(res => ({
        montant: res.paiement.montant,
        methode: res.paiement.methode_paiement,
        statut: res.paiement.statut,
        date_paiement: res.paiement.date_paiement,
        // Vous pouvez ajouter d'autres infos de réservation si besoin
        nb_places: res.nb_places
      }));

    console.log('Paiements trouvés:', payments);
    
    res.render('payments', { 
      payments,
      token: req.query.token
    });
  } catch (error) {
    console.error('Erreur détaillée:', error);
    res.status(500).send('Erreur serveur: ' + error.message);
  }
};