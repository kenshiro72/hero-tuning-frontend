import React, { useState, useEffect } from 'react';
import { memoriesApi } from '../api/client';
import { getRoleColor } from '../utils/roleColors';
import './MemorySelector.css';

function MemorySelector({ slot, costume, onSelect, onClose, onUnequip }) {
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
    const costumeCharacterBase = costume.character.name.split('（')[0];
    const memoryCharacterBase = memory.character.name.split('（')[0];
    if (costumeCharacterBase === memoryCharacterBase) {
      return false;
    }

    // 同じコスチュームに同じメモリーを装着できない
    const alreadyEquipped = costume.slots.some(
      (s) => s.id !== slot.id && s.equipped_memory_id === memory.id
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

    const costumeCharacterBase = costume.character.name.split('（')[0];
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

    const costumeCharacterBase = costume.character.name.split('（')[0];
    const memoryCharacterBase = memory.character.name.split('（')[0];
    if (costumeCharacterBase === memoryCharacterBase) {
      reasons.push('❌ 自分自身のメモリー');
    }

    const alreadyEquipped = costume.slots.some(
      (s) => s.id !== slot.id && s.equipped_memory_id === memory.id
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
                  {heroMemories.map((memory) => (
                    <div
                      key={memory.id}
                      className="memory-card compatible"
                      onClick={() => onSelect(memory)}
                    >
                      <div className="memory-name">{memory.character.name}</div>
                      <div className="memory-skills">
                        {slot.slot_type === 'Normal' ? (
                          <div className="tuning-skill">
                            {memory.tuning_skill}
                          </div>
                        ) : (
                          <div className="special-skill">
                            {memory.special_tuning_skill}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              )}

              {villainMemories.length > 0 && (
                <>
                  <h5 className="memory-class-header">VILLAIN</h5>
                  {villainMemories.map((memory) => (
                    <div
                      key={memory.id}
                      className="memory-card compatible"
                      onClick={() => onSelect(memory)}
                    >
                      <div className="memory-name">{memory.character.name}</div>
                      <div className="memory-skills">
                        {slot.slot_type === 'Normal' ? (
                          <div className="tuning-skill">
                            {memory.tuning_skill}
                          </div>
                        ) : (
                          <div className="special-skill">
                            {memory.special_tuning_skill}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              )}

              {noClassMemories.length > 0 && (
                <>
                  {noClassMemories.map((memory) => (
                    <div
                      key={memory.id}
                      className="memory-card compatible"
                      onClick={() => onSelect(memory)}
                    >
                      <div className="memory-name">{memory.character.name}</div>
                      <div className="memory-skills">
                        {slot.slot_type === 'Normal' ? (
                          <div className="tuning-skill">
                            {memory.tuning_skill}
                          </div>
                        ) : (
                          <div className="special-skill">
                            {memory.special_tuning_skill}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </>
          )}

          {incompatibleMemories.length > 0 && (
            <>
              <h4 className="incompatible-header">装備不可</h4>
              {incompatibleMemories.map((memory) => (
                <div key={memory.id} className="memory-card incompatible">
                  <div className="memory-name">{memory.character.name}</div>
                  <div className="incompatible-reason">
                    {getIncompatibleReason(memory)}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default MemorySelector;
