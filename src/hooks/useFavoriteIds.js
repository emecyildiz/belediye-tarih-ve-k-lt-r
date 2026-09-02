import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../auth/useAuth';

export default function useFavoriteIds(type) {
  const [ids, setIds] = useState([]);
  const { user, loading } = useAuth();

  useEffect(() => {
    let active = true;
    if (loading) return () => { active = false; };
    if (!user) {
      setIds([]);
      return () => { active = false; };
    }
    api.getFavorites().then((favorites) => { if (active) setIds((favorites?.[type] || []).map(Number)); }).catch(() => {});
    return () => { active = false; };
  }, [loading, type, user]);

  useEffect(() => {
    const sync = (event) => {
      if (event.detail?.type === type) setIds((event.detail.ids || []).map(Number));
    };
    window.addEventListener('tkmbs:favorites-changed', sync);
    return () => window.removeEventListener('tkmbs:favorites-changed', sync);
  }, [type]);

  const toggle = async (id) => {
    if (!user) return { requiresLogin: true, type, id: Number(id), favorited: false, ids: [] };
    const result = await api.toggleFavorite(type, id);
    if (result) setIds((result.ids || []).map(Number));
    if (result) window.dispatchEvent(new CustomEvent('tkmbs:favorites-changed', { detail: result }));
    return result;
  };

  return [ids, toggle, setIds];
}
