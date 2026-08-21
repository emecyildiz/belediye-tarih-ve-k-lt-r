import { useEffect, useState } from 'react';
import api from '../services/api';

export default function useFavoriteIds(type) {
  const [ids, setIds] = useState([]);

  useEffect(() => {
    let active = true;
    api.getFavorites().then((favorites) => { if (active) setIds((favorites?.[type] || []).map(Number)); }).catch(() => {});
    return () => { active = false; };
  }, [type]);

  const toggle = async (id) => {
    const result = await api.toggleFavorite(type, id);
    if (result) setIds((result.ids || []).map(Number));
    return result;
  };

  return [ids, toggle, setIds];
}
