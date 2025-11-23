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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const slotDisplayRef = useRef(null);

  const fetchCharacter = useCallback(async (isMounted) => {
    try {
      // パフォーマンス最適化: バリアントを含む統合データを一度に取得
      // 以前: N回のAPI呼び出し → 現在: 1回のAPI呼び出し
      const response = await charactersApi.getWithVariants(id);
      if (!isMounted || !isMounted.current) return; // マウント状態確認

      const unifiedCharacter = response.data;

      if (isMounted && isMounted.current) {
        setCharacter(unifiedCharacter);

        if (unifiedCharacter.costumes && unifiedCharacter.costumes.length > 0) {
          // コスチュームにcharacter情報を追加
          const costumeWithCharacter = {
            ...unifiedCharacter.costumes[0],
            character: unifiedCharacter
          };
          setSelectedCostume(costumeWithCharacter);
        }
        setLoading(false);
      }
    } catch (err) {
      if (isMounted && isMounted.current) {
        setError('キャラクター情報の読み込みに失敗しました');
        setLoading(false);
      }
    }
  }, [id]);

  useEffect(() => {
    const isMountedRef = { current: true }; // Refを使用してマウント状態を追跡

    fetchCharacter(isMountedRef);

    // クリーンアップ関数
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchCharacter]);

  const handleConfigurationApplied = async (costumeId) => {
    // 構成が適用されたら、そのコスチュームの詳細を取得して表示
    try {
      // キャラクター全体の情報を再取得
      const isMountedRef = { current: true };
      const response = await charactersApi.getWithVariants(id);

      if (!isMountedRef.current) return;

      const unifiedCharacter = response.data;
      setCharacter(unifiedCharacter);

      // 適用されたコスチュームを見つけて選択
      const appliedCostume = unifiedCharacter.costumes.find(c => c.id === costumeId);
      if (appliedCostume) {
        const costumeWithCharacter = {
          ...appliedCostume,
          character: unifiedCharacter
        };
        setSelectedCostume(costumeWithCharacter);

        // スロット情報部分にスクロール
        setTimeout(() => {
          if (slotDisplayRef.current) {
            slotDisplayRef.current.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });
          }
        }, 100);
      }
    } catch (error) {
      console.error('Failed to refresh costume:', error);
    }
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

      <CostumeOptimizer
        character={character}
        onConfigurationApplied={handleConfigurationApplied}
      />

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
        {selectedCostume && <SlotDisplay costume={selectedCostume} />}
      </div>
    </div>
  );
}

export default CharacterDetail;
