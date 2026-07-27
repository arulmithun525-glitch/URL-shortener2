// Equivalent of app/models/__init__.py — associations mirror the
// SQLAlchemy relationship() declarations (cascade delete included,
// matching the existing ON DELETE CASCADE foreign keys in Postgres).
const { sequelize } = require('../database');

let Domain;
let Link;
let ClickEvent;

try {
  Domain = require('./domain.model');
  Link = require('./link.model');
  ClickEvent = require('./clickEvent.model');

  Domain.hasMany(Link, { foreignKey: 'domain_id', as: 'links', onDelete: 'CASCADE' });
  Link.belongsTo(Domain, { foreignKey: 'domain_id', as: 'domain' });

  Link.hasMany(ClickEvent, { foreignKey: 'link_id', as: 'clickEvents', onDelete: 'CASCADE' });
  ClickEvent.belongsTo(Link, { foreignKey: 'link_id', as: 'link' });
} catch (error) {
  console.warn('Model initialization failed:', error.message);
}

module.exports = { sequelize, Domain, Link, ClickEvent };
