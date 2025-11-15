import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const charactersApi = {
  getAll: () => apiClient.get('/characters'),
  getById: (id) => apiClient.get(`/characters/${id}`),
  optimize: (id, customSkills, specialSlot1Skill = null, specialSlot2Skill = null, specialSlotEitherSkill = null) => {
    return apiClient.post(`/characters/${id}/optimize`, {
      custom_skills: customSkills,
      special_slot_1_skill: specialSlot1Skill,
      special_slot_2_skill: specialSlot2Skill,
      special_slot_either_skill: specialSlotEitherSkill
    });
  },
};

export const costumesApi = {
  getAll: () => apiClient.get('/costumes'),
  getById: (id) => apiClient.get(`/costumes/${id}`),
  getEffects: (id) => apiClient.get(`/costumes/${id}/effects`),
  unequipAll: (id) => apiClient.post(`/costumes/${id}/unequip_all`),
  applyConfiguration: (id, configuration) => apiClient.post(`/costumes/${id}/apply_configuration`, { configuration }),
};

export const memoriesApi = {
  getAll: () => apiClient.get('/memories'),
};

export const slotsApi = {
  equipMemory: (slotId, memoryId) =>
    apiClient.post(`/slots/${slotId}/equip`, { memory_id: memoryId }),
  unequipMemory: (slotId) => apiClient.post(`/slots/${slotId}/unequip`),
  levelUp: (slotId) => apiClient.post(`/slots/${slotId}/level_up`),
  levelDown: (slotId) => apiClient.post(`/slots/${slotId}/level_down`),
};

export default apiClient;
