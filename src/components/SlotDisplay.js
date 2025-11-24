import React, { useState, useEffect, useCallback } from 'react';
import { costumesApi } from '../api/client';
import MemorySelector from './MemorySelector';
import { getRoleColor } from '../utils/roleColors';
import './SlotDisplay.css';

function SlotDisplay({ initialCostume, localCostume, onUpdateLocalCostume }) {
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [effects, setEffects] = useState(null);

  // エフェクト計算（ローカル状態のスロット構成を送信）
  const calculateEffects = useCallback(async () => {
    if (!localCostume) return;

    try {
      // ローカル状態のスロット情報を準備
      const slotsData = localCostume.slots.map(slot => ({
        id: slot.id,
        current_level: slot.current_level,
        equipped_memory_id: slot.equipped_memory?.id || null
      }));

      const response = await costumesApi.calculateEffects(localCostume.id, slotsData);
      setEffects(response.data);
    } catch (error) {
      console.error('Failed to calculate effects:', error);
    }
  }, [localCostume]);

  // コスチューム変更時の初期化処理
  useEffect(() => {
    if (!initialCostume || !localCostume) return;

    setEffects(null); // 効果表示をリセット

    // 全スロット（ノーマル＋スペシャル）を最大レベルに設定（ローカル状態のみ）
    const allSlots = localCostume.slots || [];
    const needsLevelUp = allSlots.some(slot => slot.current_level < slot.max_level);

    if (needsLevelUp) {
      onUpdateLocalCostume(prevState => {
        const newState = JSON.parse(JSON.stringify(prevState));
        newState.slots.forEach(slot => {
          if (slot.current_level < slot.max_level) {
            slot.current_level = slot.max_level;
          }
        });
        return newState;
      });
    }
  }, [initialCostume, localCostume, onUpdateLocalCostume]); // initialCostume.idが変わった時のみ実行

  // localCostumeが変更されたときに効果を自動計算
  useEffect(() => {
    if (!localCostume) return;

    // メモリーが装備されている場合のみ効果を計算
    const hasEquippedMemories = localCostume.slots?.some(slot => slot.equipped_memory);
    if (hasEquippedMemories) {
      calculateEffects();
    } else {
      setEffects(null); // メモリーがない場合は効果をクリア
    }
  }, [localCostume, calculateEffects]);

  const getClassBadge = (slotClass) => {
    if (!slotClass) return null;
    return (
      <span className={`class-badge ${slotClass.toLowerCase()}`}>
        {slotClass === 'HERO' ? 'H' : 'V'}
      </span>
    );
  };

  // メモリー装備（ローカル状態のみ更新、DB保存なし）
  const handleEquipMemory = (memory) => {
    if (!selectedSlot) return;

    // ローカル状態を更新（useEffectが自動的に効果を再計算）
    onUpdateLocalCostume(prevState => {
      const newState = JSON.parse(JSON.stringify(prevState));
      const slot = newState.slots.find(s => s.id === selectedSlot.id);
      if (slot) {
        slot.equipped_memory = memory;
      }
      return newState;
    });

    setSelectedSlot(null);
  };

  // メモリー解除（ローカル状態のみ更新、DB保存なし）
  const handleUnequipMemory = (slot) => {
    // ローカル状態を更新（useEffectが自動的に効果を再計算）
    onUpdateLocalCostume(prevState => {
      const newState = JSON.parse(JSON.stringify(prevState));
      const targetSlot = newState.slots.find(s => s.id === slot.id);
      if (targetSlot) {
        targetSlot.equipped_memory = null;
      }
      return newState;
    });

    // 装備解除後もモーダルを開いたままにする場合、selectedSlotを更新
    if (selectedSlot && selectedSlot.id === slot.id) {
      const updatedSlot = localCostume.slots.find(s => s.id === slot.id);
      if (updatedSlot) {
        setSelectedSlot({ ...updatedSlot, equipped_memory: null });
      }
    }
  };

  // 全メモリー解除（ローカル状態のみ更新、DB保存なし）
  const handleUnequipAll = () => {
    onUpdateLocalCostume(prevState => {
      const newState = JSON.parse(JSON.stringify(prevState));
      newState.slots.forEach(slot => {
        slot.equipped_memory = null;
      });
      return newState;
    });

    setSelectedSlot(null); // モーダルを閉じる
    // 効果はuseEffectが自動的にクリア
  };

  const normalSlots = localCostume?.slots
    ?.filter((slot) => slot.slot_type === 'Normal')
    .sort((a, b) => a.slot_number - b.slot_number) || [];

  const specialSlots = localCostume?.slots
    ?.filter((slot) => slot.slot_type === 'Special')
    .sort((a, b) => a.slot_number - b.slot_number) || [];

  // 左列: Special 1 + Normal 1-5
  const specialSlot1 = specialSlots.find(slot => slot.slot_number === 11);
  const normalSlots1to5 = normalSlots.filter(slot => slot.slot_number >= 1 && slot.slot_number <= 5);

  // 右列: Special 2 + Normal 6-10
  const specialSlot2 = specialSlots.find(slot => slot.slot_number === 12);
  const normalSlots6to10 = normalSlots.filter(slot => slot.slot_number >= 6 && slot.slot_number <= 10);

  const renderSlotCard = (slot) => {
    // チューニングスキルを「、」で分割
    const getTuningSkills = () => {
      if (!slot.equipped_memory) return [];
      const skillText = slot.slot_type === 'Normal'
        ? slot.equipped_memory.tuning_skill
        : slot.equipped_memory.special_tuning_skill;
      return skillText.split('、').map(s => s.trim());
    };

    const skills = getTuningSkills();
    const roleColor = getRoleColor(slot.role);
    // メモリー選択と同じ背景色を適用（Specialスロットも含む）
    const backgroundColor = `${roleColor}15`;

    return (
      <div
        key={slot.id}
        className={`slot-card ${slot.equipped_memory ? 'equipped' : 'empty'} ${
          slot.slot_type === 'Special' ? 'special' : ''
        } clickable`}
        style={{
          borderColor: roleColor,
          backgroundColor: backgroundColor
        }}
        onClick={() => setSelectedSlot(slot)}
      >
        {getClassBadge(slot.slot_class)}

        <div className="slot-content">
          {slot.equipped_memory ? (
            <div className="equipped-memory">
              <div className="memory-character-avatar">
                <img
                  src={getCharacterImage(slot.equipped_memory.character.name)}
                  alt={slot.equipped_memory.character.name}
                  className="memory-character-image"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="memory-character-initial" style={{ display: 'none' }}>
                  {slot.equipped_memory.character.name.charAt(0)}
                </div>
              </div>
              <div className="memory-skills">
                {skills.map((skill, index) => (
                  <div key={index} className="skill-row">
                    {skill}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="empty-slot-message">クリック</div>
          )}
        </div>
      </div>
    );
  };

  // キャラクター画像のパスを取得
  const getCharacterImage = (characterName) => {
    const baseName = characterName.split('（')[0];
    return `/images/characters/${baseName}.JPG`;
  };

  return (
    <div className="slot-display">
      <div className="slot-display-header">
        <h2>{localCostume?.name}</h2>
        <button
          className="unequip-all-button"
          onClick={handleUnequipAll}
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
            <div className="all-effects">
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
                  <div key={skill} className="effect-row">
                    <span className="skill-name">{skill}:</span>
                    <span className="skill-value">{data.value}</span>
                  </div>
                ));
              })()}
            </div>
          ) : (
            <p>装備されているメモリーがありません</p>
          )}

          <div className="effects-notice">
            <p>※ 各スロットが最大レベルの時の数値です。</p>
            <p>※ 誤差が生じる場合があります。</p>
          </div>
        </div>
      )}

      {selectedSlot && (
        <MemorySelector
          slot={selectedSlot}
          localCostume={localCostume}
          onSelect={handleEquipMemory}
          onClose={() => setSelectedSlot(null)}
          onUnequip={handleUnequipMemory}
        />
      )}
    </div>
  );
}

export default SlotDisplay;
