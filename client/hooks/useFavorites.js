import { useState, useEffect, useCallback } from 'react';
import { API_BASE } from '../config';

// Favoritos: listar, agregar, quitar. Quien llame a agregar puede hacer algo después (ej. pasar a otra frase)
export function useFavorites() {
  const [favoritos, setFavoritos] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargarFavoritos = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/favoritos`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setFavoritos(Array.isArray(data) ? data : []);
    } catch {
      setFavoritos([]);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarFavoritos();
  }, [cargarFavoritos]);

  const agregarFavorito = useCallback(async (content, author, nota) => {
    try {
      const res = await fetch(`${API_BASE}/favoritos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, author, nota }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 409) {
        alert(data.error || 'Ya está en favoritos');
        return;
      }
      if (!res.ok) throw new Error(data.error || 'No se pudo agregar');
      setFavoritos((prev) => [...prev, data]);
      return data;
    } catch (err) {
      alert(err.message || 'No se pudo agregar a favoritos');
      throw err;
    }
  }, []);

  const quitarFavorito = useCallback(async (id) => {
    try {
      const res = await fetch(`${API_BASE}/favoritos/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setFavoritos((prev) => prev.filter((f) => f.id !== id));
    } catch {
      alert('No se pudo quitar');
    }
  }, []);

  return {
    favoritos,
    cargandoFavoritos: cargando,
    cargarFavoritos,
    agregarFavorito,
    quitarFavorito,
  };
}
