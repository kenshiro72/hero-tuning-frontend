import React, { useState, useEffect } from 'react';
import { slotsApi, costumesApi } from '../api/client';
import MemorySelector from './MemorySelector';
import { getRoleColor } from '../utils/roleColors';
import './SlotDisplay.css';

function SlotDisplay({ costume: initialCostume }) {
  const [costume, setCostume] = useState(initialCostume);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [effects, setEffects] = useState(null);
  const [loading, setLoading] = useState(false);

  // 親コンポーネントからcostumeが変更されたときに内部状態を更新
  useEffect(() => {
    const initializeCostume = async () => {
      if (!initialCostume) return;

      setCostume(initialCostume);
      setEffects(null); // 効果表示もリセット

      // ノーマルスロットを最大レベルに設定
      if (initialCostume?.slots) {
        const normalSlots = initialCostume.slots.filter(slot => slot.slot_type === 'Normal');
        let needsRefresh = false;

        for (const slot of normalSlots) {
          if (slot.current_level < slot.max_level) {
            needsRefresh = true;
            try {
              // 最大レベルまでレベルアップ
              const levelDiff = slot.max_level - slot.current_level;
              for (let i = 0; i < levelDiff; i++) {
                await slotsApi.levelUp(slot.id);
              }
            } catch (error) {
              console.error('Failed to level up slot:', error);
            }
          }
        }

        // スロット情報を更新（新しいコスチュームIDを指定）
        if (needsRefresh) {
          await refreshCostume(initialCostume.id);
        }

        // メモリーが装備されている場合、自動的に効果を表示
        const hasEquippedMemories = initialCostume.slots.some(slot => slot.equipped_memory);
        if (hasEquippedMemories) {
          // 少し待ってから効果を読み込む（レベル調整が完了するのを待つ）
          setTimeout(async () => {
            try {
              const response = await costumesApi.getEffects(initialCostume.id);
              setEffects(response.data);
            } catch (error) {
              console.error('Failed to load effects:', error);
            }
          }, 500);
        }
      }
    };

    initializeCostume();
  }, [initialCostume]);

  const getClassBadge = (slotClass) => {
    if (!slotClass) return null;
    return (
      <span className={`class-badge ${slotClass.toLowerCase()}`}>
        {slotClass === 'HERO' ? 'H' : 'V'}
      </span>
    );
  };

  const refreshCostume = async (costumeId = null) => {
    try {
      const targetId = costumeId || costume.id;
      const response = await costumesApi.getById(targetId);
      setCostume(response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to refresh costume:', error);
      alert('コスチューム情報の更新に失敗しました');
    }
  };

  const handleEquipMemory = async (memory) => {
    if (!selectedSlot) return;

    setLoading(true);
    try {
      await slotsApi.equipMemory(selectedSlot.id, memory.id);
      await refreshCostume();
      await loadEffects(); // 自動的に効果を再計算
      setSelectedSlot(null);
    } catch (error) {
      console.error('Failed to equip memory:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnequipMemory = async (slot) => {
    setLoading(true);
    try {
      await slotsApi.unequipMemory(slot.id);
      const updatedCostume = await refreshCostume();
      await loadEffects(); // 自動的に効果を再計算
      // 装備解除後もモーダルを開いたままにするため、selectedSlotを更新
      if (updatedCostume && selectedSlot) {
        const updatedSlot = updatedCostume.slots.find(s => s.id === selectedSlot.id);
        if (updatedSlot) {
          setSelectedSlot(updatedSlot);
        }
      }
    } catch (error) {
      console.error('Failed to unequip memory:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLevelChange = async (slot, newLevel) => {
    const currentLevel = slot.current_level;
    if (newLevel === currentLevel) return;

    setLoading(true);
    try {
      const levelDiff = newLevel - currentLevel;
      if (levelDiff > 0) {
        // レベルアップ
        for (let i = 0; i < levelDiff; i++) {
          await slotsApi.levelUp(slot.id);
        }
      } else {
        // レベルダウン
        for (let i = 0; i < Math.abs(levelDiff); i++) {
          await slotsApi.levelDown(slot.id);
        }
      }
      await refreshCostume();
      await loadEffects(); // 自動的に効果を再計算
    } catch (error) {
      console.error('Failed to change level:', error);
      alert('レベル変更に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const loadEffects = async () => {
    try {
      const response = await costumesApi.getEffects(costume.id);
      setEffects(response.data);
    } catch (error) {
      console.error('Failed to load effects:', error);
      alert('効果の取得に失敗しました');
    }
  };

  const handleUnequipAll = async () => {
    // 確認ダイアログを表示
    if (!window.confirm('全てのメモリーを解除しますか？\nこの操作は取り消せません。')) {
      return;
    }

    setLoading(true);
    try {
      await costumesApi.unequipAll(costume.id);
      await refreshCostume();
      setEffects(null); // 効果表示もクリア
      setSelectedSlot(null); // モーダルを閉じる
    } catch (error) {
      console.error('Failed to unequip all memories:', error);
      alert('全解除に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const normalSlots = costume.slots
    ?.filter((slot) => slot.slot_type === 'Normal')
    .sort((a, b) => a.slot_number - b.slot_number) || [];

  const specialSlots = costume.slots
    ?.filter((slot) => slot.slot_type === 'Special')
    .sort((a, b) => a.slot_number - b.slot_number) || [];

  // 左列: Special 1 + Normal 1-5
  const specialSlot1 = specialSlots.find(slot => slot.slot_number === 11);
  const normalSlots1to5 = normalSlots.filter(slot => slot.slot_number >= 1 && slot.slot_number <= 5);

  // 右列: Special 2 + Normal 6-10
  const specialSlot2 = specialSlots.find(slot => slot.slot_number === 12);
  const normalSlots6to10 = normalSlots.filter(slot => slot.slot_number >= 6 && slot.slot_number <= 10);

  const renderSlotCard = (slot) => (
    <div
      key={slot.id}
      className={`slot-card ${slot.equipped_memory ? 'equipped' : 'empty'} ${
        slot.slot_type === 'Special' ? 'special' : ''
      } clickable`}
      style={{ borderColor: getRoleColor(slot.role) }}
      onClick={() => !loading && setSelectedSlot(slot)}
    >
      <div className="slot-info-left">
        <div className="slot-header">
          <span className="slot-number">
            {slot.slot_type === 'Normal'
              ? `Slot ${slot.slot_number}`
              : `Special ${slot.slot_number - 10}`}
          </span>
          {getClassBadge(slot.slot_class)}
        </div>
        <div
          className="slot-role"
          style={{ backgroundColor: getRoleColor(slot.role) }}
        >
          {slot.role}
        </div>
      </div>

      <div className="slot-content">
        {slot.equipped_memory ? (
          <div className="equipped-memory">
            <div className="memory-character-name">
              {slot.equipped_memory.character.name}
            </div>
            <div className="memory-tuning">
              {slot.slot_type === 'Normal' ? (
                <>{slot.equipped_memory.tuning_skill}</>
              ) : (
                <>{slot.equipped_memory.special_tuning_skill}</>
              )}
            </div>
          </div>
        ) : (
          <div className="empty-slot-message">
            クリックして装備
          </div>
        )}
      </div>

      {slot.slot_type === 'Normal' && (
        <div className="slot-level-dropdown" onClick={(e) => e.stopPropagation()}>
          <select
            value={slot.current_level}
            onChange={(e) => handleLevelChange(slot, parseInt(e.target.value))}
            disabled={loading}
            className="level-select"
          >
            {Array.from({ length: slot.max_level }, (_, i) => i + 1).map((level) => (
              <option key={level} value={level}>
                Lv.{level}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );

  return (
    <div className="slot-display">
      <div className="slot-display-header">
        <h2>{costume.name} - スロット情報</h2>
        <button
          className="unequip-all-button"
          onClick={handleUnequipAll}
          disabled={loading}
        >
          全て解除
        </button>
      </div>

      <div className="slots-container">
        <div className="slots-column">
          {specialSlot1 && (
            <div className="slot-group">
              <h4>Special 1</h4>
              {renderSlotCard(specialSlot1)}
            </div>
          )}
          <div className="slot-group">
            <h4>Normal Slots 1-5</h4>
            <div className="slots-vertical">
              {normalSlots1to5.map(renderSlotCard)}
            </div>
          </div>
        </div>

        <div className="slots-column">
          {specialSlot2 && (
            <div className="slot-group">
              <h4>Special 2</h4>
              {renderSlotCard(specialSlot2)}
            </div>
          )}
          <div className="slot-group">
            <h4>Normal Slots 6-10</h4>
            <div className="slots-vertical">
              {normalSlots6to10.map(renderSlotCard)}
            </div>
          </div>
        </div>
      </div>

      {effects && (
        <div className="effects-display">
          <h3>チューニング効果</h3>
          {Object.keys(effects.tuning_effects).length > 0 ? (
            <div className="effects-list">
              {(() => {
                // CSVの順番でソート
                const skillOrder = [
                  '最大HP＋', '最大GP＋', '最大瀕死HP＋', '対HP攻撃力＋', '対GP攻撃力＋',
                  '"個性"技α攻撃力＋', '"個性"技β攻撃力＋', '"個性"技γ攻撃力＋', '格闘攻撃力＋',
                  'HP防御力＋', '対"個性"技α防御力＋', '対"個性"技β防御力＋', '対"個性"技γ防御力＋',
                  '対格闘攻撃防御力＋', '走り速度＋', 'ダッシュ速度＋', '壁移動速度＋', '瀕死移動速度＋',
                  '壁ジャンプ高さ＋', '前方ジャンプ高さ＋', '垂直ジャンプ高さ＋', '"個性"技αリロード＋',
                  '"個性"技βリロード＋', '"個性"技γリロード＋', '特殊アクションリロード＋', 'PU/PCリロード＋'
                ];

                const sortedEffects = Object.entries(effects.tuning_effects).sort((a, b) => {
                  const indexA = skillOrder.indexOf(a[0]);
                  const indexB = skillOrder.indexOf(b[0]);
                  if (indexA === -1 && indexB === -1) return 0;
                  if (indexA === -1) return 1;
                  if (indexB === -1) return -1;
                  return indexA - indexB;
                });

                return sortedEffects.map(([skill, data]) => (
                  <div key={skill} className="effect-item">
                    <span className="effect-name">{skill}</span>
                    <span className="effect-value">{data.value}</span>
                    <span className="effect-description">{data.description}</span>
                  </div>
                ));
              })()}
            </div>
          ) : (
            <p>装備されているメモリーがありません</p>
          )}

          {effects.special_skills.length > 0 && (
            <>
              <h4>スペシャルチューニングスキル</h4>
              <div className="special-skills-list">
                {effects.special_skills.map((skill, index) => (
                  <div key={index} className="special-skill-item">
                    {skill}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {selectedSlot && (
        <MemorySelector
          slot={selectedSlot}
          costume={costume}
          onSelect={handleEquipMemory}
          onClose={() => setSelectedSlot(null)}
          onUnequip={handleUnequipMemory}
        />
      )}
    </div>
  );
}

export default SlotDisplay;
