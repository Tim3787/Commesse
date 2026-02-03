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

// --- CRUD tag (se li metti in un router dedicato /api/tags) ---
// Se invece vuoi farli passare da /schedeTecniche, dimmelo e cambio i path.

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
