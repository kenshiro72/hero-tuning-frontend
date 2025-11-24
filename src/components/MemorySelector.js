import React, { useState, useEffect } from 'react';
import { memoriesApi } from '../api/client';
import { getRoleColor } from '../utils/roleColors';
import './MemorySelector.css';

function MemorySelector({ slot, localCostume, onSelect, onClose, onUnequip }) {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMemories();
  }, []);

  const loadMemories = async () => {
    try {
      const response = await memoriesApi.getAll();
      setMemories(response.data);
    } catch (error) {
      console.error('Failed to load memories:', error);
    } finally {
      setLoading(false);
    }
  };

  const canEquip = (memory) => {
    // roleが一致している必要がある
    if (slot.role !== memory.role) return false;

    // slot_classが指定されている場合は、memory_classも一致している必要がある
    if (slot.slot_class && slot.slot_class !== memory.memory_class) {
      return false;
    }

    // 選択しているキャラクター自身のメモリーは装着できない
    const costumeCharacterBase = localCostume.character.name.split('（')[0];
    const memoryCharacterBase = memory.character.name.split('（')[0];
    if (costumeCharacterBase === memoryCharacterBase) {
      return false;
    }

    // 同じコスチュームに同じメモリーを装着できない
    const alreadyEquipped = localCostume.slots.some(
      (s) => s.id !== slot.id && s.equipped_memory?.id === memory.id
    );
    if (alreadyEquipped) {
      return false;
    }

    return true;
  };

  const shouldShowMemory = (memory) => {
    // Role不一致と自分自身のメモリーは表示しない
    if (slot.role !== memory.role) return false;

    // Class不一致は表示しない
    if (slot.slot_class && slot.slot_class !== memory.memory_class) return false;

    const costumeCharacterBase = localCostume.character.name.split('（')[0];
    const memoryCharacterBase = memory.character.name.split('（')[0];
    if (costumeCharacterBase === memoryCharacterBase) return false;

    return true;
  };

  const getIncompatibleReason = (memory) => {
    const reasons = [];

    if (slot.role !== memory.role) {
      reasons.push('❌ Role不一致');
    }

    if (slot.slot_class && slot.slot_class !== memory.memory_class) {
      reasons.push('❌ Class不一致');
    }

    const costumeCharacterBase = localCostume.character.name.split('（')[0];
    const memoryCharacterBase = memory.character.name.split('（')[0];
    if (costumeCharacterBase === memoryCharacterBase) {
      reasons.push('❌ 自分自身のメモリー');
    }

    const alreadyEquipped = localCostume.slots.some(
      (s) => s.id !== slot.id && s.equipped_memory?.id === memory.id
    );
    if (alreadyEquipped) {
      reasons.push('❌ 既に装備済み');
    }

    return reasons.join(' ');
  };

  // 表示するメモリーをフィルタリング
  const visibleMemories = memories.filter(shouldShowMemory);
  const compatibleMemories = visibleMemories.filter(canEquip);
  const incompatibleMemories = visibleMemories.filter((m) => !canEquip(m));

  // 装備可能なメモリーをHEROとVILLAINで分ける
  const heroMemories = compatibleMemories.filter((m) => m.memory_class === 'HERO');
  const villainMemories = compatibleMemories.filter((m) => m.memory_class === 'VILLAIN');
  const noClassMemories = compatibleMemories.filter((m) => !m.memory_class);

  // キャラクター画像のパスを取得
  const getCharacterImage = (characterName) => {
    const baseName = characterName.split('（')[0];
    return `/images/characters/${baseName}.JPG`;
  };

  // スキルを2列に分割
  const getTuningSkills = (memory) => {
    const skillText = slot.slot_type === 'Normal'
      ? memory.tuning_skill
      : memory.special_tuning_skill;
    return skillText.split('、').map(s => s.trim());
  };

  // メモリーカードのレンダリング
  const renderMemoryCard = (memory, isCompatible = true) => {
    const skills = getTuningSkills(memory);
    const roleColor = getRoleColor(memory.role);

    // Role色を基に背景色を作成（薄い色）
    const backgroundColor = isCompatible
      ? `${roleColor}15` // 15は透明度（約8%）
      : '#f5f5f5';

    return (
      <div
        key={memory.id}
        className={`memory-card ${isCompatible ? 'compatible' : 'incompatible'}`}
        style={isCompatible ? {
          borderColor: roleColor,
          backgroundColor: backgroundColor
        } : {}}
        onClick={isCompatible ? () => onSelect(memory) : undefined}
      >
        <div className="memory-character-avatar">
          <img
            src={getCharacterImage(memory.character.name)}
            alt={memory.character.name}
            className="memory-character-image"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
          <div className="memory-character-initial" style={{ display: 'none' }}>
            {memory.character.name.charAt(0)}
          </div>
        </div>
        <div className="memory-skills-container">
          {skills.map((skill, index) => (
            <div key={index} className="memory-skill-row">
              {skill}
            </div>
          ))}
        </div>
        {!isCompatible && (
          <div className="incompatible-reason">
            {getIncompatibleReason(memory)}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <p>読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>メモリーを選択</h3>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="memory-list">
          {compatibleMemories.length > 0 && (
            <>
              <div className="memory-list-header">
                <h4>装備可能なメモリー</h4>
                {slot.equipped_memory && onUnequip && (
                  <button className="unequip-button-modal" onClick={() => onUnequip(slot)}>
                    装備解除
                  </button>
                )}
              </div>

              {heroMemories.length > 0 && (
                <>
                  <h5 className="memory-class-header">HERO</h5>
                  {heroMemories.map((memory) => renderMemoryCard(memory, true))}
                </>
              )}

              {villainMemories.length > 0 && (
                <>
                  <h5 className="memory-class-header">VILLAIN</h5>
                  {villainMemories.map((memory) => renderMemoryCard(memory, true))}
                </>
              )}

              {noClassMemories.length > 0 && (
                <>
                  {noClassMemories.map((memory) => renderMemoryCard(memory, true))}
                </>
              )}
            </>
          )}

          {incompatibleMemories.length > 0 && (
            <>
              <h4 className="incompatible-header">装備不可</h4>
              {incompatibleMemories.map((memory) => renderMemoryCard(memory, false))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default MemorySelector;
