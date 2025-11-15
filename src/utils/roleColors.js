// Roleごとの色設定
export const ROLE_COLORS = {
  Support: '#28a745',    // 緑
  Assault: '#ffc107',    // 黄
  Technical: '#6f42c1',  // 紫
  Strike: '#dc3545',     // 赤
  Rapid: '#007bff',      // 青
};

// Roleの色を取得する関数
export const getRoleColor = (role) => {
  return ROLE_COLORS[role] || '#6c757d'; // デフォルトはグレー
};

// Classの色設定
export const CLASS_COLORS = {
  HERO: '#007bff',    // 青
  VILLAIN: '#dc3545', // 赤
};

// Classの色を取得する関数
export const getClassColor = (classType) => {
  return CLASS_COLORS[classType] || '#6c757d';
};
