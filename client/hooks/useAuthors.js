import { useState, useEffect, useCallback } from 'react';
import { API_BASE } from '../config';

// Carga la lista de autores al montar
export function useAuthors() {
  const [autores, setAutores] = useState([]);

  const cargarAutores = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/autores`);
      const data = await res.json();
      setAutores(Array.isArray(data) ? data : []);
    } catch {
      setAutores([]);
    }
  }, []);

  useEffect(() => {
    cargarAutores();
  }, [cargarAutores]);

  return { autores };
}
