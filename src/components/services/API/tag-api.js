import apiClient from '../../config/axiosConfig';

// GET /api/schedeTecniche/tag?reparto=software&includeGlobal=1&search=...
export async function fetchTags(params = {}) {
  const { data } = await apiClient.get('/api/schedeTecniche/tag', { params });
  return data;
}

// GET /api/schedeTecniche/:id/tags
export async function fetchTagsScheda(schedaId) {
  const { data } = await apiClient.get(`/api/schedeTecniche/${schedaId}/tags`);
  return data;
}

// PUT /api/schedeTecniche/:id/tags  body: { tagIds: [...] }
export async function updateTagsScheda(schedaId, tagIds) {
  const { data } = await apiClient.put(`/api/schedeTecniche/${schedaId}/tags`, { tagIds });
  return data;
}

// =========================
// RICERCA TAG PER NAVBAR
// =========================

// GET /api/tags/autocomplete?q=press&reparto=software&includeGlobal=1&limit=10
export async function autocompleteTags(params = {}) {
  const cleanParams = {
    ...params,
    q: params.q ? String(params.q).replace(/^#/, '').trim() : '',
  };

  const { data } = await apiClient.get('/api/tags/autocomplete', {
    params: cleanParams,
  });

  return data;
}

// GET /api/tags/commesse-by-tag?tag=pressore_inverter
// oppure /api/tags/commesse-by-tag?tagId=9
export async function fetchCommesseByTag({ tag, tagId } = {}) {
  const params = {};

  if (tagId) {
    params.tagId = tagId;
  } else if (tag) {
    params.tag = String(tag).replace(/^#/, '').trim();
  }

  const { data } = await apiClient.get('/api/tags/commesse-by-tag', {
    params,
  });

  return data;
}

// --- CRUD tag ---
export async function createTag(payload) {
  const { data } = await apiClient.post('/api/tags', payload);
  return data;
}

export async function updateTag(id, payload) {
  const { data } = await apiClient.put(`/api/tags/${id}`, payload);
  return data;
}

export async function deleteTag(id) {
  const { data } = await apiClient.delete(`/api/tags/${id}`);
  return data;
}
