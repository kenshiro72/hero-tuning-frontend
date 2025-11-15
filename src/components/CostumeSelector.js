import React, { useState } from 'react';
import { getRoleColor } from '../utils/roleColors';
import './CostumeSelector.css';

function CostumeSelector({ costumes, selectedCostume, onSelectCostume }) {
  const [searchText, setSearchText] = useState('');
  const [special1Role, setSpecial1Role] = useState('');
  const [special2Role, setSpecial2Role] = useState('');
  const [eitherSpecialRole, setEitherSpecialRole] = useState('');
  const [rarityFilter, setRarityFilter] = useState('');

  const roles = ['Support', 'Assault', 'Technical', 'Strike', 'Rapid'];
  const rarities = ['C', 'R', 'SR', 'PUR'];
  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'C':
        return '#808080'; // グレー
      case 'R':
        return '#dc3545'; // 赤
      case 'SR':
        return '#ffd700'; // 金
      case 'PUR':
        return 'linear-gradient(90deg, #ffb3ba, #ffdfba, #ffffba, #baffc9, #bae1ff, #e0bbff)'; // パステル虹
      default:
        return '#000';
    }
  };

  const getRarityStyle = (rarity) => {
    if (rarity === 'PUR') {
      return {
        background: 'linear-gradient(90deg, #ffb3ba, #ffdfba, #ffffba, #baffc9, #bae1ff, #e0bbff)',
      };
    }
    return {
      backgroundColor: getRarityColor(rarity),
    };
  };

  // コスチュームをベース名でグループ化
  const getBaseName = (name) => {
    return name.split('〈')[0];
  };

  // ボタンに表示するテキストを取得
  const getButtonText = (name) => {
    if (name.includes('〈')) {
      // 〈〉がある場合は〈〉内の文字のみを抽出
      const match = name.match(/〈(.+?)〉/);
      return match ? match[1] : name;
    } else {
      // 〈〉がない場合は「デフォルト」
      return 'デフォルト';
    }
  };

  // スペシャルスロットのRoleを取得
  const getSpecialSlotRoles = (costume) => {
    if (!costume.slots) return [];
    const specialSlots = costume.slots
      .filter(slot => slot.slot_type === 'Special')
      .sort((a, b) => a.slot_number - b.slot_number);
    return specialSlots.map(slot => slot.role);
  };

  // 検索テキストとスペシャルスロットのRoleでフィルタリング
  const filteredCostumes = costumes.filter((costume) => {
    // テキスト検索
    if (searchText && !costume.name.toLowerCase().includes(searchText.toLowerCase())) {
      return false;
    }

    // レアリティフィルタ
    if (rarityFilter && costume.rarity !== rarityFilter) {
      return false;
    }

    // スペシャルスロットのRole検索
    const specialSlotRoles = getSpecialSlotRoles(costume);

    // どちらかのスペシャルスロットに指定したRoleが含まれているか
    if (eitherSpecialRole) {
      const hasRole = specialSlotRoles.includes(eitherSpecialRole);
      if (!hasRole) {
        return false;
      }
    }

    // スペシャル1のRoleでフィルタリング
    if (special1Role && specialSlotRoles[0] !== special1Role) {
      return false;
    }

    // スペシャル2のRoleでフィルタリング
    if (special2Role && specialSlotRoles[1] !== special2Role) {
      return false;
    }

    return true;
  });

  const groupedCostumes = filteredCostumes.reduce((groups, costume) => {
    const baseName = getBaseName(costume.name);
    if (!groups[baseName]) {
      groups[baseName] = [];
    }
    groups[baseName].push(costume);
    return groups;
  }, {});

  return (
    <div className="costume-selector">
      <div className="costume-selector-header">
        <h2>コスチューム選択</h2>
        <div className="search-controls">
          <input
            type="text"
            className="costume-search-input"
            placeholder="コスチューム名で検索..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <div className="role-filters">
            <select
              className="role-select"
              value={rarityFilter}
              onChange={(e) => setRarityFilter(e.target.value)}
            >
              <option value="">レアリティ: 全て</option>
              {rarities.map((rarity) => (
                <option key={rarity} value={rarity}>
                  レアリティ: {rarity}
                </option>
              ))}
            </select>
            <select
              className="role-select"
              value={eitherSpecialRole}
              onChange={(e) => setEitherSpecialRole(e.target.value)}
            >
              <option value="">スペシャル1or2: 全て</option>
              {roles.map((role) => (
                <option key={role} value={role}>
                  スペシャル1or2: {role}
                </option>
              ))}
            </select>
            <select
              className="role-select"
              value={special1Role}
              onChange={(e) => setSpecial1Role(e.target.value)}
            >
              <option value="">スペシャル1: 全て</option>
              {roles.map((role) => (
                <option key={role} value={role}>
                  スペシャル1: {role}
                </option>
              ))}
            </select>
            <select
              className="role-select"
              value={special2Role}
              onChange={(e) => setSpecial2Role(e.target.value)}
            >
              <option value="">スペシャル2: 全て</option>
              {roles.map((role) => (
                <option key={role} value={role}>
                  スペシャル2: {role}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      {Object.keys(groupedCostumes).length === 0 ? (
        <div className="no-results">検索結果がありません</div>
      ) : (
        Object.entries(groupedCostumes).map(([baseName, costumes]) => (
        <div key={baseName} className="costume-group">
          <h3 className="costume-group-title">{baseName}</h3>
          <div className="costume-grid">
            {costumes.map((costume) => (
              <div
                key={costume.id}
                className={`costume-card ${
                  selectedCostume?.id === costume.id ? 'selected' : ''
                } ${costume.rarity === 'PUR' ? 'rainbow-border' : ''}`}
                onClick={() => onSelectCostume(costume)}
                style={{
                  borderColor: costume.rarity !== 'PUR' ? getRarityColor(costume.rarity) : undefined,
                }}
              >
                <div
                  className="costume-rarity"
                  style={getRarityStyle(costume.rarity)}
                >
                  {'★'.repeat(costume.star_level)}
                </div>
                <h3>{getButtonText(costume.name)}</h3>
                <div className="special-slot-indicators">
                  {getSpecialSlotRoles(costume).map((role, index) => (
                    <div
                      key={index}
                      className="special-slot-dot"
                      style={{ backgroundColor: getRoleColor(role) }}
                      title={`Special ${index + 1}: ${role}`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )))}
    </div>
  );
}

export default CostumeSelector;
