function handleError(err, res) {
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({ error: err.errors.map((e) => e.message).join(', ') });
  }
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({ error: 'Cette valeur existe déjà' });
  }
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({ error: 'Catégorie inexistante' });
  }
  console.error(err);
  return res.status(500).json({ error: 'Erreur serveur' });
}

module.exports = { handleError };