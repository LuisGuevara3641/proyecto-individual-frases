import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

export default function CurrentQuote({
  frase,
  cargando,
  error,
  todasEnFavoritos,
  autores,
  canGoBack,
  onRegresar,
  onOtraFrase,
  onReintentar,
  onAgregarFavorito,
  favoritos,
}) {
  const [nota, setNota] = useState('');
  const [copiado, setCopiado] = useState(false);

  const authorName = frase && (
    (frase.author != null && String(frase.author).trim())
      ? String(frase.author).trim()
      : (frase.author_id != null && Array.isArray(autores)
        ? (autores.find((a) => Number(a.id) === Number(frase.author_id))?.name || 'Anónimo')
        : 'Anónimo')
  );

  const yaEnFavoritos = frase && favoritos.some(
    (f) => String(f.content ?? '').trim() === String(frase.content ?? '').trim()
      && String(f.author ?? '').trim() === String(authorName ?? '').trim()
  );

  useEffect(() => {
    if (frase) setNota('');
  }, [frase?.content]);

  const copiar = () => {
    if (!frase) return;
    const texto = `"${frase.content}" — ${authorName}`;
    navigator.clipboard.writeText(texto).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
  };

  const agregar = () => {
    if (!frase) return;
    onAgregarFavorito(frase.content, authorName, nota.trim());
  };

  if (error && !frase) {
    return (
      <section className="card card-quote">
        <p className="error-msg">{error}</p>
        <button type="button" onClick={onReintentar} className="btn btn-primary">
          Reintentar
        </button>
      </section>
    );
  }

  if (!frase) {
    if (todasEnFavoritos) {
      return (
        <section className="card card-quote">
          <p className="muted">Todas las frases disponibles están en favoritos. Cuando lleguen más, podrás ver otras.</p>
        </section>
      );
    }
    return (
      <section className="card card-quote">
        <p className="muted">Cargando frase…</p>
      </section>
    );
  }

  return (
    <section className={`card card-quote ${cargando && frase ? 'card-loading' : ''}`}>
      {cargando && frase && (
        <div className="quote-loading-overlay">Cargando otra frase…</div>
      )}

      {frase && (
        <>
          <blockquote className="quote-text">"{frase.content}"</blockquote>
          <p className="quote-author">— {authorName}</p>

          <div className="btn-row">
            <button
              type="button"
              onClick={onRegresar}
              disabled={!canGoBack || cargando}
              className="btn"
              title="Ver la frase anterior"
            >
              Regresar
            </button>
            <button type="button" onClick={onOtraFrase} disabled={cargando} className="btn">
              {cargando ? 'Cargando…' : 'Otra frase'}
            </button>
            <button type="button" onClick={copiar} disabled={cargando} className="btn">
              {copiado ? '¡Copiado!' : 'Copiar'}
            </button>
            <button
              type="button"
              onClick={agregar}
              className="btn btn-primary"
              disabled={yaEnFavoritos || cargando}
            >
              {yaEnFavoritos ? 'Ya en favoritos' : 'Agregar a favoritos'}
            </button>
          </div>

          {!yaEnFavoritos && (
            <div className="form-group note-group">
              <label htmlFor="nota" className="label">Tu nota (opcional)</label>
              <input
                id="nota"
                type="text"
                placeholder="¿Por qué te gustó?"
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                className="input"
              />
            </div>
          )}
        </>
      )}
    </section>
  );
}

CurrentQuote.propTypes = {
  frase: PropTypes.shape({
    content: PropTypes.string,
    author: PropTypes.string,
    author_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }),
  cargando: PropTypes.bool.isRequired,
  error: PropTypes.string,
  todasEnFavoritos: PropTypes.bool.isRequired,
  autores: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      name: PropTypes.string,
    })
  ),
  canGoBack: PropTypes.bool.isRequired,
  onRegresar: PropTypes.func.isRequired,
  onOtraFrase: PropTypes.func.isRequired,
  onReintentar: PropTypes.func.isRequired,
  onAgregarFavorito: PropTypes.func.isRequired,
  favoritos: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      content: PropTypes.string,
      author: PropTypes.string,
      nota: PropTypes.string,
    })
  ).isRequired,
};
