import React, { useState, useEffect, useCallback } from 'react';
import { slotsApi, costumesApi } from '../api/client';
import MemorySelector from './MemorySelector';
import { getRoleColor } from '../utils/roleColors';
import './SlotDisplay.css';

function SlotDisplay({ costume: initialCostume }) {
  const [costume, setCostume] = useState(initialCostume);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [effects, setEffects] = useState(null);
  const [loading, setLoading] = useState(false);

  const refreshCostume = useCallback(async (costumeId = null) => {
    try {
      const targetId = costumeId || costume.id;
      const response = await costumesApi.getById(targetId);
      setCostume(response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to refresh costume:', error);
      alert('コスチューム情報の更新に失敗しました');
    }
  }, [costume.id]);

  // 親コンポーネントからcostumeが変更されたときに内部状態を更新
  useEffect(() => {
    let isMounted = true; // クリーンアップ用フラグ

    const initializeCostume = async () => {
      if (!initialCostume || !isMounted) return;

      setCostume(initialCostume);
      setEffects(null); // 効果表示もリセット

      // ノーマルスロットを最大レベルに設定
      if (initialCostume?.slots) {
        const normalSlots = initialCostume.slots.filter(slot => slot.slot_type === 'Normal');
        let needsRefresh = false;

        // 並列処理でパフォーマンス向上: Promise.allを使用
        const levelUpPromises = normalSlots
          .filter(slot => slot.current_level < slot.max_level)
          .map(async (slot) => {
            try {
              // 一度のAPI呼び出しで最大レベルに設定（パフォーマンス最適化）
              await slotsApi.setLevel(slot.id, slot.max_level);
              return true;
            } catch (error) {
              console.error('Failed to set slot level:', error);
              return false;
            }
          });

        if (levelUpPromises.length > 0) {
          needsRefresh = true;
          await Promise.all(levelUpPromises);
        }

        // スロット情報を更新（新しいコスチュームIDを指定）
        if (needsRefresh && isMounted) {
          await refreshCostume(initialCostume.id);
        }

        // メモリーが装備されている場合、自動的に効果を表示
        const hasEquippedMemories = initialCostume.slots.some(slot => slot.equipped_memory);
        if (hasEquippedMemories && isMounted) {
          // 少し待ってから効果を読み込む（レベル調整が完了するのを待つ）
          const timeoutId = setTimeout(async () => {
            if (!isMounted) return; // タイムアウト後もマウント状態を確認

            try {
              const response = await costumesApi.getEffects(initialCostume.id);
              if (isMounted) {
                setEffects(response.data);
              }
            } catch (error) {
              console.error('Failed to load effects:', error);
            }
          }, 500);

          // タイムアウトをクリーンアップ用に保存
          return () => {
            clearTimeout(timeoutId);
          };
        }
      }
    };

    initializeCostume();

    // クリーンアップ関数: コンポーネントのアンマウント時に実行
    return () => {
      isMounted = false;
    };
  }, [initialCostume, refreshCostume]);

  const getClassBadge = (slotClass) => {
    if (!slotClass) return null;
    return (
      <span className={`class-badge ${slotClass.toLowerCase()}`}>
        {slotClass === 'HERO' ? 'H' : 'V'}
      </span>
    );
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
        onClick={() => !loading && setSelectedSlot(slot)}
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
        <h2>{costume.name}</h2>
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
