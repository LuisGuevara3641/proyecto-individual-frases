// Punto de entrada: usa los hooks y pinta Explorar / Favoritos
import { useState } from 'react';
import { useTheme } from './hooks/useTheme';
import { useAuthors } from './hooks/useAuthors';
import { useFavorites } from './hooks/useFavorites';
import { useQuotes } from './hooks/useQuotes';
import CurrentQuote from './components/CurrentQuote';
import Favorites from './components/Favorites';

export default function App() {
  const [tab, setTab] = useState('frases');

  const { tema, setTema } = useTheme();
  const { autores } = useAuthors();
  const {
    favoritos,
    cargandoFavoritos,
    agregarFavorito,
    quitarFavorito,
  } = useFavorites();

  const {
    frase,
    cargandoListado,
    errorFrase,
    todasEnFavoritos,
    canGoBack,
    mostrarSiguienteFrase,
    regresarFrase,
    reintentar,
  } = useQuotes(favoritos, autores, !cargandoFavoritos);

  const handleAgregarFavorito = async (content, author, nota) => {
    try {
      await agregarFavorito(content, author, nota);
      mostrarSiguienteFrase();
    } catch (_) {}
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-top">
          <h1 className="page-title">Frases</h1>
          <button
            type="button"
            className="btn btn-icon"
            onClick={() => setTema((t) => (t === 'noche' ? 'dia' : 'noche'))}
            title={tema === 'noche' ? 'Modo día' : 'Modo noche'}
            aria-label={tema === 'noche' ? 'Modo día' : 'Modo noche'}
          >
            {tema === 'noche' ? '☀️' : '🌙'}
          </button>
        </div>
        <p className="page-desc">
          Explora frases, guarda con tu nota y copia cuando quieras.
        </p>
        <nav className="tabs">
          <button
            type="button"
            className={`tab ${tab === 'frases' ? 'tab-active' : ''}`}
            onClick={() => setTab('frases')}
          >
            Explorar
          </button>
          <button
            type="button"
            className={`tab ${tab === 'favoritos' ? 'tab-active' : ''}`}
            onClick={() => setTab('favoritos')}
          >
            Favoritos {favoritos.length > 0 && `(${favoritos.length})`}
          </button>
        </nav>
      </header>

      <main className="main">
        {tab === 'frases' && (
          <CurrentQuote
            frase={frase}
            cargando={cargandoListado}
            error={errorFrase}
            todasEnFavoritos={todasEnFavoritos}
            autores={autores}
            canGoBack={canGoBack}
            onRegresar={regresarFrase}
            onOtraFrase={mostrarSiguienteFrase}
            onReintentar={reintentar}
            onAgregarFavorito={handleAgregarFavorito}
            favoritos={favoritos}
          />
        )}
        {tab === 'favoritos' && (
          <Favorites
            favoritos={favoritos}
            cargando={cargandoFavoritos}
            onQuitar={quitarFavorito}
          />
        )}
      </main>
    </div>
  );
}
