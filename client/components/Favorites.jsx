import { useState } from 'react';
import PropTypes from 'prop-types';

export default function Favorites({ favoritos, cargando, onQuitar }) {
  const [copiadoId, setCopiadoId] = useState(null);

  const copiar = (id, content, author) => {
    const texto = `"${content}" — ${author}`;
    navigator.clipboard.writeText(texto).then(() => {
      setCopiadoId(id);
      setTimeout(() => setCopiadoId(null), 2000);
    });
  };

  if (cargando) {
    return (
      <section className="card card-favorites">
        <h2 className="card-title">Mis favoritos</h2>
        <p className="muted">Cargando…</p>
      </section>
    );
  }

  return (
    <section className="card card-favorites">
      <h2 className="card-title">Mis favoritos</h2>

      {favoritos.length === 0 ? (
        <p className="muted empty-msg">Aún no tienes favoritos.</p>
      ) : (
        <ul className="favorites-list">
          {favoritos.map((f) => (
            <li key={f.id} className="favorite-item">
              <blockquote className="favorite-quote">"{f.content}"</blockquote>
              <p className="favorite-author">— {f.author}</p>
              {f.nota && (
                <p className="favorite-note"><strong>Mi nota:</strong> {f.nota}</p>
              )}
              <div className="favorite-actions">
                <button type="button" onClick={() => copiar(f.id, f.content, f.author)} className="btn btn-sm">
                  {copiadoId === f.id ? '¡Copiado!' : 'Copiar'}
                </button>
                <button type="button" onClick={() => onQuitar(f.id)} className="btn btn-sm btn-danger">
                  Quitar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

Favorites.propTypes = {
  favoritos: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      content: PropTypes.string,
      author: PropTypes.string,
      nota: PropTypes.string,
    })
  ).isRequired,
  cargando: PropTypes.bool.isRequired,
  onQuitar: PropTypes.func.isRequired,
};
