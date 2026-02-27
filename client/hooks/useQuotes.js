import { useState, useEffect, useCallback, useRef } from 'react';
import { API_BASE, MAX_RECENT_QUOTES } from '../config';

// Si la frase trae author_id, busca el nombre en la lista de autores
function resolverAutor(data, autoresList) {
  if (!data) return 'Anónimo';
  if (data.author != null && String(data.author).trim()) return String(data.author).trim();
  if (data.author_id == null) return 'Anónimo';
  const a = (autoresList || []).find((x) => Number(x.id) === Number(data.author_id));
  return a?.name || 'Anónimo';
}

// Listado de frases, la que se muestra, siguiente/atrás y carga. Usa favoritos y autores para no repetir favoritas
export function useQuotes(favoritos, autores, favoritosLoaded) {
  const [listadoFrases, setListadoFrases] = useState([]);
  const [frase, setFrase] = useState(null);
  const [cargandoListado, setCargandoListado] = useState(true);
  const [errorFrase, setErrorFrase] = useState(null);
  const [todasEnFavoritos, setTodasEnFavoritos] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);

  const recientesRef = useRef([]);
  const historyRef = useRef([]);
  const fraseRef = useRef(null);
  const initialPickDoneRef = useRef(false);
  const listRequestedRef = useRef(false);

  useEffect(() => {
    fraseRef.current = frase;
  }, [frase]);

  const enFavoritos = useCallback(
    (item) =>
      favoritos.some((f) => {
        const c = String((item?.content ?? '').trim());
        const a = String(resolverAutor(item, autores)).trim();
        return String(f.content ?? '').trim() === c && String(f.author ?? '').trim() === a;
      }),
    [favoritos, autores]
  );

  const elegirSiguienteFrase = useCallback(() => {
    const recientes = recientesRef.current;
    const list = listadoFrases;
    if (!list.length) return null;
    const candidatos = list.filter((item) => {
      const clave = item._id || item.content || '';
      if (!clave) return true;
      if (recientes.includes(clave)) return false;
      if (enFavoritos(item)) return false;
      return true;
    });
    const sinFavoritos = list.filter((item) => !enFavoritos(item));
    const pool = candidatos.length ? candidatos : sinFavoritos;
    if (pool.length === 0) return null;
    const elegida = pool[Math.floor(Math.random() * pool.length)];
    if (!elegida) return null;
    const clave = elegida._id || elegida.content;
    if (clave) {
      recientes.push(clave);
      if (recientes.length > MAX_RECENT_QUOTES) recientes.shift();
    }
    return elegida;
  }, [listadoFrases, enFavoritos]);

  const mostrarSiguienteFrase = useCallback(() => {
    setTodasEnFavoritos(false);
    const actual = fraseRef.current;
    if (actual) {
      historyRef.current.push(actual);
      setCanGoBack(true);
    }
    const siguiente = elegirSiguienteFrase();
    setFrase(siguiente);
    if (siguiente === null && listadoFrases.length > 0) setTodasEnFavoritos(true);
  }, [elegirSiguienteFrase, listadoFrases.length]);

  const regresarFrase = useCallback(() => {
    const history = historyRef.current;
    let encontrada = null;
    while (history.length > 0) {
      const anterior = history.pop();
      if (!enFavoritos(anterior)) {
        encontrada = anterior;
        break;
      }
    }
    if (encontrada) setFrase(encontrada);
    setCanGoBack(history.some((f) => !enFavoritos(f)));
  }, [enFavoritos]);

  const cargarListado = useCallback(async () => {
    initialPickDoneRef.current = false;
    setCargandoListado(true);
    setErrorFrase(null);
    historyRef.current = [];
    setCanGoBack(false);
    try {
      const res = await fetch(`${API_BASE}/frases`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = (data && data.error) || `Error ${res.status} al cargar las frases.`;
        setErrorFrase(msg);
        setListadoFrases([]);
        setFrase(null);
        return;
      }
      const arr = Array.isArray(data) ? data : [];
      setListadoFrases(arr);
      recientesRef.current = [];
      setTodasEnFavoritos(false);
      if (arr.length === 0) {
        setFrase(null);
        setErrorFrase('No se pudieron cargar frases. Comprueba la conexión.');
      } else {
        fetch(`${API_BASE}/frases/extra`)
          .then((r) => r.json().catch(() => []))
          .then((extra) => {
            if (!Array.isArray(extra) || extra.length === 0) return;
            setListadoFrases((prev) => {
              const keys = new Set(prev.map((f) => (f.content || '').trim().toLowerCase()));
              const nuevas = extra.filter((f) => !keys.has((f.content || '').trim().toLowerCase()));
              return nuevas.length ? [...prev, ...nuevas] : prev;
            });
          })
          .catch(() => {});
      }
    } catch (err) {
      setErrorFrase(err.message || 'Error al cargar las frases.');
      setListadoFrases([]);
      setFrase(null);
    } finally {
      setCargandoListado(false);
    }
  }, []);

  useEffect(() => {
    if (!favoritosLoaded || listRequestedRef.current) return;
    listRequestedRef.current = true;
    cargarListado();
  }, [favoritosLoaded, cargarListado]);

  useEffect(() => {
    if (listadoFrases.length > 0 && !cargandoListado && !initialPickDoneRef.current) {
      initialPickDoneRef.current = true;
      mostrarSiguienteFrase();
    }
  }, [listadoFrases, cargandoListado, mostrarSiguienteFrase]);

  const reintentar = useCallback(() => {
    listRequestedRef.current = false;
    cargarListado();
  }, [cargarListado]);

  return {
    listadoFrases,
    frase,
    cargandoListado,
    errorFrase,
    todasEnFavoritos,
    canGoBack,
    mostrarSiguienteFrase,
    regresarFrase,
    cargarListado,
    reintentar,
    enFavoritos,
    resolverAutor,
  };
}
