import React, { useState, useEffect } from 'react';
import { charactersApi, costumesApi, memoriesApi } from '../api/client';
import { getRoleColor } from '../utils/roleColors';
import './CostumeOptimizer.css';

function CostumeOptimizer({ character, onConfigurationApplied }) {
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [specialSlot1Skill, setSpecialSlot1Skill] = useState('');
  const [specialSlot2Skill, setSpecialSlot2Skill] = useState('');
  const [specialSlotEitherSkill, setSpecialSlotEitherSkill] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [expandedResults, setExpandedResults] = useState({});
  const [allSpecialSkills, setAllSpecialSkills] = useState([]);
  const [loadingSpecialSkills, setLoadingSpecialSkills] = useState(true);

  // スペシャルスキルリストをAPIから取得
  useEffect(() => {
    const fetchSpecialSkills = async () => {
      try {
        setLoadingSpecialSkills(true);
        const response = await memoriesApi.getSpecialSkills();
        setAllSpecialSkills(response.data.special_skills);
      } catch (error) {
        console.error('Failed to fetch special skills:', error);
        // エラー時は空配列を設定
        setAllSpecialSkills([]);
      } finally {
        setLoadingSpecialSkills(false);
      }
    };

    fetchSpecialSkills();
  }, []);

  // 選択中のキャラクターの全メモリーのスペシャルスキルを除外
  const getCharacterMemorySkills = () => {
    const skills = [];

    // キャラクター名のベース部分を取得（「（」の前）
    const characterBaseName = character.name.split('（')[0];

    // character.memoryが配列の場合
    if (Array.isArray(character.memory)) {
      character.memory.forEach(mem => {
        if (mem.special_tuning_skill) {
          skills.push(mem.special_tuning_skill);
        }
      });
    }
    // character.memoryが単一オブジェクトの場合
    else if (character.memory?.special_tuning_skill) {
      skills.push(character.memory.special_tuning_skill);
    }

    return skills;
  };

  const characterMemorySkills = getCharacterMemorySkills();

  const specialSkills = allSpecialSkills
    .filter(skill => !characterMemorySkills.includes(skill))
    .sort();

  // レアリティに応じたスタイルを取得
  const getRarityStyle = (rarity) => {
    if (rarity === 'PUR') {
      return {
        background: 'linear-gradient(90deg, #ffb3ba, #ffdfba, #ffffba, #baffc9, #bae1ff, #e0bbff)',
      };
    }
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
    return {
      backgroundColor: getRarityColor(rarity),
    };
  };

  // CSVの順番通りのスキルリスト
  const skillOrder = [
    '最大HP＋',
    '最大GP＋',
    '最大瀕死HP＋',
    '対HP攻撃力＋',
    '対GP攻撃力＋',
    '"個性"技α攻撃力＋',
    '"個性"技β攻撃力＋',
    '"個性"技γ攻撃力＋',
    '格闘攻撃力＋',
    'HP防御力＋',
    '対"個性"技α防御力＋',
    '対"個性"技β防御力＋',
    '対"個性"技γ防御力＋',
    '対格闘攻撃防御力＋',
    '走り速度＋',
    'ダッシュ速度＋',
    '壁移動速度＋',
    '瀕死移動速度＋',
    '壁ジャンプ高さ＋',
    '前方ジャンプ高さ＋',
    '垂直ジャンプ高さ＋',
    '"個性"技αリロード＋',
    '"個性"技βリロード＋',
    '"個性"技γリロード＋',
    '特殊アクションリロード＋',
    'PU/PCリロード＋'
  ];

  const allSkills = skillOrder;

  const toggleResultDetail = (index) => {
    setExpandedResults(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const toggleSkill = (skill) => {
    setSelectedSkills(prev => {
      if (prev.includes(skill)) {
        return prev.filter(s => s !== skill);
      } else {
        return [...prev, skill];
      }
    });
  };

  // チューニング効果をCSVの順番でソート
  const sortEffects = (effects) => {
    return Object.entries(effects).sort((a, b) => {
      const indexA = skillOrder.indexOf(a[0]);
      const indexB = skillOrder.indexOf(b[0]);
      // skillOrderにないものは最後に
      if (indexA === -1 && indexB === -1) return 0;
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  };

  const getFilterTypeLabel = (mode) => {
    switch (mode) {
      case 'special_1': return 'Special 1のみ';
      case 'special_2': return 'Special 2のみ';
      case 'both': return '両方';
      case 'either': return 'どちらか';
      default: return '';
    }
  };

  const handleOptimize = async () => {
    if (selectedSkills.length === 0) {
      alert('少なくとも1つのノーマルスキルを選択してください');
      return;
    }

    // 同じスキルが選択されていないかチェック
    if (specialSlot1Skill && specialSlot2Skill && specialSlot1Skill === specialSlot2Skill) {
      alert('同じメモリーは装着できません。');
      return;
    }

    setLoading(true);
    try {
      const response = await charactersApi.optimize(
        character.id,
        selectedSkills,
        specialSlot1Skill || null,
        specialSlot2Skill || null,
        specialSlotEitherSkill || null
      );
      setResults(response.data.results);
      setShowResults(true);
    } catch (error) {
      console.error('Failed to optimize:', error);
      alert('検索に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyConfiguration = async (result) => {
    setLoading(true);
    try {
      // configuration を { slot_id: memory_id } の形式に変換
      const configuration = {};
      result.configuration.forEach(item => {
        configuration[item.slot_id] = item.memory_id;
      });

      await costumesApi.applyConfiguration(result.costume_id, configuration);

      // 親コンポーネントに通知
      if (onConfigurationApplied) {
        onConfigurationApplied(result.costume_id);
      }
    } catch (error) {
      console.error('Failed to apply configuration:', error);
      alert('構成の適用に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // キャラクター画像のパスを取得
  const getCharacterImage = (characterName) => {
    const baseName = characterName.split('（')[0];
    return `/images/characters/${baseName}.JPG`;
  };

  // スキルを分割
  const getTuningSkills = (item) => {
    if (!item.skill) return [];
    return item.skill.split('、').map(s => s.trim());
  };

  // スロット構成を表示する関数（SlotDisplayと同じ見た目）
  const renderConfiguration = (result) => {
    const normalSlots = result.configuration
      .filter((item) => item.slot_type === 'Normal')
      .sort((a, b) => a.slot_number - b.slot_number);

    const specialSlots = result.configuration
      .filter((item) => item.slot_type === 'Special')
      .sort((a, b) => a.slot_number - b.slot_number);

    const specialSlot1 = specialSlots.find((s) => s.slot_number === 11);
    const specialSlot2 = specialSlots.find((s) => s.slot_number === 12);
    const normalSlots1to5 = normalSlots.filter(
      (s) => s.slot_number >= 1 && s.slot_number <= 5
    );
    const normalSlots6to10 = normalSlots.filter(
      (s) => s.slot_number >= 6 && s.slot_number <= 10
    );

    const renderSlot = (item) => {
      const borderColor = item.role ? getRoleColor(item.role) : '#007bff';
      const skills = getTuningSkills(item);
      const isSpecial = item.slot_type === 'Special';
      const characterName = item.character_name || item.memory_name || '不明';

      return (
        <div
          key={item.slot_id}
          className={`optimizer-slot-card ${isSpecial ? 'special' : ''}`}
          style={{ borderColor: borderColor }}
        >
          {item.slot_class && (
            <span className={`class-badge ${item.slot_class.toLowerCase()}`}>
              {item.slot_class === 'HERO' ? 'H' : 'V'}
            </span>
          )}
          <div className="slot-content">
            <div className="equipped-memory">
              <div className="memory-character-avatar">
                <img
                  src={getCharacterImage(characterName)}
                  alt={characterName}
                  className="memory-character-image"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="memory-character-initial" style={{ display: 'none' }}>
                  {characterName.charAt(0)}
                </div>
              </div>
              <div className="memory-skills">
                {skills.length > 0 ? (
                  skills.map((skill, index) => (
                    <div key={index} className="skill-row">
                      {skill}
                    </div>
                  ))
                ) : (
                  <div className="skill-row">
                    {item.skill || 'スキル情報なし'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    };

    return (
      <div className="optimizer-slots-container">
        <div className="optimizer-slots-column">
          {specialSlot1 && (
            <div className="optimizer-slot-group">
              <h6>Special 1</h6>
              {renderSlot(specialSlot1)}
            </div>
          )}
          <div className="optimizer-slot-group">
            <h6>Normal 1-5</h6>
            <div className="optimizer-slots-vertical">
              {normalSlots1to5.map(renderSlot)}
            </div>
          </div>
        </div>

        <div className="optimizer-slots-column">
          {specialSlot2 && (
            <div className="optimizer-slot-group">
              <h6>Special 2</h6>
              {renderSlot(specialSlot2)}
            </div>
          )}
          <div className="optimizer-slot-group">
            <h6>Normal 6-10</h6>
            <div className="optimizer-slots-vertical">
              {normalSlots6to10.map(renderSlot)}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="costume-optimizer">
      <div className="optimizer-header">
        <h2>お手軽チューニング検索</h2>
      </div>

      {!showResults ? (
        <div className="optimizer-controls">
          {/* スペシャルスキル選択 */}
          <div className="special-skill-selection">
            <h3>発動させたいスペシャルチューニングを選択</h3>
            <div className="special-skill-dropdowns">
              <div className="dropdown-group">
                <select
                  className="special-skill-dropdown"
                  value={specialSlot1Skill}
                  onChange={(e) => {
                    setSpecialSlot1Skill(e.target.value);
                    if (e.target.value) {
                      setSpecialSlotEitherSkill('');
                    }
                  }}
                  disabled={loading || loadingSpecialSkills}
                >
                  <option value="">{loadingSpecialSkills ? '読み込み中...' : 'special1'}</option>
                  {specialSkills.map((skill) => (
                    <option key={skill} value={skill}>
                      {skill}
                    </option>
                  ))}
                </select>
              </div>

              <div className="dropdown-group">
                <select
                  className="special-skill-dropdown"
                  value={specialSlot2Skill}
                  onChange={(e) => {
                    setSpecialSlot2Skill(e.target.value);
                    if (e.target.value) {
                      setSpecialSlotEitherSkill('');
                    }
                  }}
                  disabled={loading || loadingSpecialSkills}
                >
                  <option value="">{loadingSpecialSkills ? '読み込み中...' : 'special2'}</option>
                  {specialSkills.map((skill) => (
                    <option key={skill} value={skill}>
                      {skill}
                    </option>
                  ))}
                </select>
              </div>

              <div className="dropdown-group">
                <select
                  className="special-skill-dropdown"
                  value={specialSlotEitherSkill}
                  onChange={(e) => {
                    setSpecialSlotEitherSkill(e.target.value);
                    if (e.target.value) {
                      setSpecialSlot1Skill('');
                      setSpecialSlot2Skill('');
                    }
                  }}
                  disabled={loading || loadingSpecialSkills}
                >
                  <option value="">{loadingSpecialSkills ? '読み込み中...' : 'special1or2'}</option>
                  {specialSkills.map((skill) => (
                    <option key={skill} value={skill}>
                      {skill}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ノーマルスキル選択 */}
          <div className="normal-skill-selection">
            <h3>特化させたいチューニングスキルを選択（複数可）</h3>
            <div className="skill-checkboxes">
              {allSkills.map((skill) => (
                <label key={skill} className="skill-checkbox-label">
                  <input
                    type="checkbox"
                    checked={selectedSkills.includes(skill)}
                    onChange={() => toggleSkill(skill)}
                    disabled={loading}
                  />
                  <span>{skill}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            className="optimize-button"
            onClick={handleOptimize}
            disabled={loading || selectedSkills.length === 0}
          >
            {loading ? '検索中...' : '検索'}
          </button>
        </div>
      ) : (
        <div className="optimization-results">
          <div className="results-header">
            <h3>検索結果</h3>
            <button
              className="close-optimizer-button"
              onClick={() => setShowResults(false)}
            >
              戻る
            </button>
          </div>
          <div className="search-summary">
            {(specialSlot1Skill || specialSlot2Skill || specialSlotEitherSkill) && (
              <p className="preset-info">
                スペシャルスキル指定:
                {specialSlot1Skill && ` スペシャル1: ${specialSlot1Skill}`}
                {specialSlot2Skill && ` スペシャル2: ${specialSlot2Skill}`}
                {specialSlotEitherSkill && ` どちらか: ${specialSlotEitherSkill}`}
              </p>
            )}
            <p className="preset-info">選択したノーマルスキル: {selectedSkills.join(', ')}</p>
          </div>

          {results && results.length > 0 ? (
            <div className="results-list">
              {results.map((result, index) => {
                const targetSkills = selectedSkills;
                const isExpanded = expandedResults[index];

                return (
                  <div key={index} className="result-card">
                    <div className="result-header">
                      <h4>{result.costume_name}</h4>
                      <div
                        className="result-rarity"
                        style={getRarityStyle(result.rarity)}
                      >
                        {'★'.repeat(result.star_level || 0)}
                      </div>
                    </div>

                    {/* プリセット対象スキルの効果のみ表示 */}
                    <div className="result-preset-effects">
                      {targetSkills.map((skillName) => {
                        const effect = result.effects[skillName];
                        if (!effect) return null;
                        return (
                          <div key={skillName} className="preset-effect-item">
                            <span className="skill-name">{skillName}:</span>
                            <span className="skill-value">
                              {formatEffectValue(skillName, effect.value)}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="result-accordion-header">
                      <button
                        className="accordion-toggle-button"
                        onClick={() => toggleResultDetail(index)}
                      >
                        {isExpanded ? '▼ 閉じる' : '▶ 詳細を見る'}
                      </button>
                    </div>

                    {/* 詳細表示 */}
                    {isExpanded && (
                      <div className="result-details">
                        <h5>チューニング構成</h5>
                        {renderConfiguration(result)}

                        <h5>チューニング効果</h5>
                        <div className="all-effects">
                          {sortEffects(result.effects).map(([skill, data]) => (
                            <div key={skill} className="effect-row">
                              <span className="skill-name">{skill}:</span>
                              <span className="skill-value">
                                {formatEffectValue(skill, data.value)}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="result-actions-expanded">
                          <button
                            className="apply-button"
                            onClick={() => handleApplyConfiguration(result)}
                            disabled={loading}
                          >
                            カスタマイズ
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="no-results">最適化結果が見つかりませんでした</p>
          )}
        </div>
      )}
    </div>
  );
}

function formatEffectValue(skillName, value) {
  // 倍率系スキルの判定
  const isMultiplicative = value > 0.5 && value < 1.5;

  if (isMultiplicative) {
    const percentage = ((value - 1.0) * 100).toFixed(2);
    return percentage >= 0 ? `+${percentage}%` : `${percentage}%`;
  } else {
    return `+${Math.round(value)}`;
  }
}

export default CostumeOptimizer;
