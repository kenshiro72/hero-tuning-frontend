import axios from 'axios';

// 環境変数を使用してAPI_BASE_URLを設定（セキュリティ向上）
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    // CSRF保護のためのカスタムヘッダー
    // ブラウザの同一生成元ポリシーにより、他のドメインから設定できない
    'X-Requested-With': 'XMLHttpRequest',
  },
  // クレデンシャル（Cookie）を含める（将来の認証実装用）
  withCredentials: false, // 現在は認証なし。認証実装時にtrueに変更
  // タイムアウトを設定してDoS攻撃を防ぐ
  timeout: 30000, // 30秒
});

// 入力検証ヘルパー関数
const validateId = (id) => {
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    throw new Error('Invalid ID: must be a positive integer');
  }
  return numericId;
};

export const charactersApi = {
  getAll: () => apiClient.get('/characters'),
  getById: (id) => {
    validateId(id);
    return apiClient.get(`/characters/${id}`);
  },
  getWithVariants: (id) => {
    validateId(id);
    // パフォーマンス最適化: バリアントを一度に取得
    return apiClient.get(`/characters/${id}/with_variants`);
  },
  optimize: (id, customSkills, specialSlot1Skill = null, specialSlot2Skill = null, specialSlotEitherSkill = null) => {
    validateId(id);
    if (!Array.isArray(customSkills) || customSkills.length === 0) {
      throw new Error('customSkills must be a non-empty array');
    }
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
  getById: (id) => {
    validateId(id);
    return apiClient.get(`/costumes/${id}`);
  },
  getEffects: (id) => {
    validateId(id);
    return apiClient.get(`/costumes/${id}/effects`);
  },
  unequipAll: (id) => {
    validateId(id);
    return apiClient.post(`/costumes/${id}/unequip_all`);
  },
  applyConfiguration: (id, configuration) => {
    validateId(id);
    if (typeof configuration !== 'object' || configuration === null) {
      throw new Error('configuration must be an object');
    }
    return apiClient.post(`/costumes/${id}/apply_configuration`, { configuration });
  },
};

export const memoriesApi = {
  getAll: () => apiClient.get('/memories'),
  getSpecialSkills: () => apiClient.get('/memories/special_skills'),
};

export const slotsApi = {
  equipMemory: (slotId, memoryId) => {
    validateId(slotId);
    validateId(memoryId);
    return apiClient.post(`/slots/${slotId}/equip`, { memory_id: memoryId });
  },
  unequipMemory: (slotId) => {
    validateId(slotId);
    return apiClient.post(`/slots/${slotId}/unequip`);
  },
  levelUp: (slotId) => {
    validateId(slotId);
    return apiClient.post(`/slots/${slotId}/level_up`);
  },
  levelDown: (slotId) => {
    validateId(slotId);
    return apiClient.post(`/slots/${slotId}/level_down`);
  },
  setLevel: (slotId, level) => {
    validateId(slotId);
    if (!Number.isInteger(level) || level < 1) {
      throw new Error('level must be a positive integer');
    }
    return apiClient.post(`/slots/${slotId}/set_level`, { level });
  },
};

export default apiClient;
