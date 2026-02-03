import { useState, useEffect } from 'react';

export const usePersistedFilters = (key, initialValue) => {
  const [filters, setFilters] = useState(() => {
    const savedFilters = localStorage.getItem(key);
    return savedFilters ? JSON.parse(savedFilters) : initialValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(filters));
  }, [key, filters]);

  return [filters, setFilters];
};

export const usePersistedState = (key, initialValue) => {
  const [state, setState] = useState(() => {
    const savedState = localStorage.getItem(key);
    return savedState ? JSON.parse(savedState) : initialValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);

  return [state, setState];
};
