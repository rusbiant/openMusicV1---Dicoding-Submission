const mapDBToModel = ({
  id,
  name,
  year,
  created_at,
  updated_at,
  cover,
}) => ({
  id,
  name,
  year,
  createdAt: created_at,
  updatedAt: updated_at,
  cover,
});

module.exports = { mapDBToModel };
