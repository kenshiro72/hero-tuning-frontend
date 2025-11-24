import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { charactersApi } from '../api/client';
import CostumeSelector from '../components/CostumeSelector';
import SlotDisplay from '../components/SlotDisplay';
import CostumeOptimizer from '../components/CostumeOptimizer';
import LoadingSpinner from '../components/LoadingSpinner';
import './CharacterDetail.css';

function CharacterDetail() {
  const { id } = useParams();
  const [character, setCharacter] = useState(null);
  const [selectedCostume, setSelectedCostume] = useState(null);
  // ローカル状態管理: メモリー装備をブラウザ内のみで管理（DB保存なし）
  const [localCostumeState, setLocalCostumeState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('easy-tuning'); // 'easy-tuning' or 'manual-selection'
  const slotDisplayRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const loadCharacter = async () => {
      try {
        // パフォーマンス最適化: バリアントを含む統合データを一度に取得
        // 以前: N回のAPI呼び出し → 現在: 1回のAPI呼び出し
        const response = await charactersApi.getWithVariants(id);
        if (!isMounted) return; // アンマウント済みなら処理を中断

        const unifiedCharacter = response.data;

        setCharacter(unifiedCharacter);

        if (unifiedCharacter.costumes && unifiedCharacter.costumes.length > 0) {
          // コスチュームにcharacter情報を追加
          const costumeWithCharacter = {
            ...unifiedCharacter.costumes[0],
            character: unifiedCharacter
          };
          setSelectedCostume(costumeWithCharacter);

          // ローカル状態を初期化（ディープコピー）
          setLocalCostumeState(JSON.parse(JSON.stringify(costumeWithCharacter)));
        }
        setLoading(false);
      } catch (err) {
        if (!isMounted) return; // アンマウント済みなら処理を中断

        setError('キャラクター情報の読み込みに失敗しました');
        setLoading(false);
      }
    };

    loadCharacter();

    // クリーンアップ関数
    return () => {
      isMounted = false;
    };
  }, [id]);

  // ローカル状態更新関数（子コンポーネントに渡す）
  const updateLocalCostumeState = useCallback((updater) => {
    setLocalCostumeState(prevState => {
      if (typeof updater === 'function') {
        return updater(prevState);
      }
      return updater;
    });
  }, []);

  const handleConfigurationApplied = (configuration, costumeId) => {
    if (!character || !character.costumes) return;

    // 検索結果のコスチュームを探す
    const targetCostume = character.costumes.find(c => c.id === costumeId);
    if (!targetCostume) {
      console.error(`Costume not found for id: ${costumeId}`);
      return;
    }

    // コスチュームにcharacter情報を追加
    const costumeWithCharacter = {
      ...targetCostume,
      character: character
    };

    // まず、コスチュームを選択
    setSelectedCostume(costumeWithCharacter);

    // ローカル状態を初期化し、メモリーを装備
    const newLocalState = JSON.parse(JSON.stringify(costumeWithCharacter));

    // configuration: [{ slot_id, memory_id, memory }, ...]
    configuration.forEach(({ slot_id, memory }) => {
      const slot = newLocalState.slots.find(s => s.id === slot_id);
      if (slot) {
        slot.equipped_memory = memory;
      }
    });

    setLocalCostumeState(newLocalState);

    // タブを手動選択に切り替え
    setActiveTab('manual-selection');

    // スロット情報部分にスクロール
    setTimeout(() => {
      if (slotDisplayRef.current) {
        slotDisplayRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    }, 100);
  };

  if (loading) {
    return <LoadingSpinner text="キャラクター情報読み込み中" variant={2} />;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!character) {
    return <div className="error">キャラクターが見つかりません</div>;
  }

  // キャラクター画像のパスを取得
  const getCharacterImage = (characterName) => {
    const baseName = characterName.split('（')[0];
    return `/images/characters/${baseName}.JPG`;
  };

  return (
    <div className="character-detail">
      <Link to="/" className="back-button">
        ← キャラクター選択に戻る
      </Link>

      <div className="character-header">
        <div className="character-avatar">
          <img
            src={getCharacterImage(character.name)}
            alt={character.name}
            className="character-header-image"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
          <div className="character-header-initial" style={{ display: 'none' }}>
            {character.name.charAt(0)}
          </div>
        </div>
        <h1>{character.name}</h1>
      </div>

      {/* タブヘッダー */}
      <div className="tab-container">
        <div className="tab-header">
          <button
            className={`tab-button ${activeTab === 'easy-tuning' ? 'active' : ''}`}
            onClick={() => setActiveTab('easy-tuning')}
          >
            お手軽チューニング
          </button>
          <button
            className={`tab-button ${activeTab === 'manual-selection' ? 'active' : ''}`}
            onClick={() => setActiveTab('manual-selection')}
          >
            手動でコスチューム選択
          </button>
        </div>

        {/* タブコンテンツ */}
        <div className="tab-content">
          {activeTab === 'easy-tuning' && (
            <CostumeOptimizer
              character={character}
              onConfigurationApplied={handleConfigurationApplied}
            />
          )}

          {activeTab === 'manual-selection' && (
            <>
              <CostumeSelector
                costumes={character.costumes}
                selectedCostume={selectedCostume}
                onSelectCostume={(costume) => {
                  // コスチュームにcharacter情報を追加
                  const costumeWithCharacter = {
                    ...costume,
                    character: character
                  };
                  setSelectedCostume(costumeWithCharacter);

                  // ローカル状態を初期化（ディープコピー）
                  setLocalCostumeState(JSON.parse(JSON.stringify(costumeWithCharacter)));

                  // スロット情報部分にスクロール
                  setTimeout(() => {
                    if (slotDisplayRef.current) {
                      slotDisplayRef.current.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                      });
                    }
                  }, 100);
                }}
              />

              <div ref={slotDisplayRef}>
                {localCostumeState && (
                  <SlotDisplay
                    initialCostume={selectedCostume}
                    localCostume={localCostumeState}
                    onUpdateLocalCostume={updateLocalCostumeState}
                  />
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default CharacterDetail;
