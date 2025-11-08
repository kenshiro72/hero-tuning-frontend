import React from 'react';
import './CostumeSelector.css';

function CostumeSelector({ costumes, selectedCostume, onSelectCostume }) {
  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'C':
        return '#808080';
      case 'R':
        return '#4CAF50';
      case 'SR':
        return '#2196F3';
      case 'PUR':
        return '#9C27B0';
      default:
        return '#000';
    }
  };

  const getRarityStars = (starLevel) => {
    return '★'.repeat(starLevel);
  };

  return (
    <div className="costume-selector">
      <h2>コスチューム選択</h2>
      <div className="costume-grid">
        {costumes.map((costume) => (
          <div
            key={costume.id}
            className={`costume-card ${
              selectedCostume?.id === costume.id ? 'selected' : ''
            }`}
            onClick={() => onSelectCostume(costume)}
            style={{
              borderColor: getRarityColor(costume.rarity),
            }}
          >
            <div
              className="costume-rarity"
              style={{ backgroundColor: getRarityColor(costume.rarity) }}
            >
              {costume.rarity}
            </div>
            <h3>{costume.name}</h3>
            <div className="costume-stars">
              {getRarityStars(costume.star_level)}
            </div>
            <div className="costume-slots">
              {costume.slots?.length || 0} スロット
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CostumeSelector;
