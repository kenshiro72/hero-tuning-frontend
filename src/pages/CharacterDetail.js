import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { charactersApi, costumesApi } from '../api/client';
import CostumeSelector from '../components/CostumeSelector';
import SlotDisplay from '../components/SlotDisplay';
import CostumeOptimizer from '../components/CostumeOptimizer';
import './CharacterDetail.css';

function CharacterDetail() {
  const { id } = useParams();
  const [character, setCharacter] = useState(null);
  const [selectedCostume, setSelectedCostume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const slotDisplayRef = useRef(null);

  useEffect(() => {
    fetchCharacter();
  }, [id]);

  const fetchCharacter = async () => {
    try {
      // 選択されたキャラクターを取得
      const response = await charactersApi.getById(id);
      const selectedCharacter = response.data;

      // 全キャラクターを取得
      const allCharactersResponse = await charactersApi.getAll();
      const allCharacters = allCharactersResponse.data;

      // 同じベース名を持つキャラクターを全て取得
      const baseName = selectedCharacter.name.split('（')[0];
      const sameBaseNameCharacters = allCharacters.filter(char => {
        const charBaseName = char.name.split('（')[0];
        return charBaseName === baseName;
      });

      // 同じベース名のキャラクターの詳細情報を全て取得
      const detailedCharacters = await Promise.all(
        sameBaseNameCharacters.map(char => charactersApi.getById(char.id))
      );

      // コスチュームとメモリーを統合
      const allCostumes = [];
      const allMemories = [];

      detailedCharacters.forEach(charResponse => {
        const char = charResponse.data;
        if (char.costumes) {
          allCostumes.push(...char.costumes);
        }
        if (char.memory) {
          if (Array.isArray(char.memory)) {
            allMemories.push(...char.memory);
          } else {
            allMemories.push(char.memory);
          }
        }
      });

      // 統合されたキャラクター情報を作成
      const unifiedCharacter = {
        ...selectedCharacter,
        name: baseName, // ベース名のみ
        costumes: allCostumes,
        memory: allMemories
      };

      setCharacter(unifiedCharacter);

      if (allCostumes.length > 0) {
        // コスチュームにcharacter情報を追加
        const costumeWithCharacter = {
          ...allCostumes[0],
          character: unifiedCharacter
        };
        setSelectedCostume(costumeWithCharacter);
      }
      setLoading(false);
    } catch (err) {
      setError('キャラクター情報の読み込みに失敗しました');
      setLoading(false);
    }
  };

  const handleConfigurationApplied = async (costumeId) => {
    // 構成が適用されたら、そのコスチュームの詳細を取得して表示
    try {
      // キャラクター情報を再取得（統合処理を再実行）
      await fetchCharacter();

      // 適用されたコスチュームを見つけて選択
      // fetchCharacterが完了した後に実行
      setTimeout(() => {
        setCharacter(prevCharacter => {
          const appliedCostume = prevCharacter.costumes.find(c => c.id === costumeId);
          if (appliedCostume) {
            const costumeWithCharacter = {
              ...appliedCostume,
              character: prevCharacter
            };
            setSelectedCostume(costumeWithCharacter);
          }
          return prevCharacter;
        });

        // スロット情報部分にスクロール
        if (slotDisplayRef.current) {
          slotDisplayRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }, 300);
    } catch (error) {
      console.error('Failed to refresh costume:', error);
    }
  };

  if (loading) {
    return <div className="loading">読み込み中...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!character) {
    return <div className="error">キャラクターが見つかりません</div>;
  }

  return (
    <div className="character-detail">
      <Link to="/" className="back-button">
        ← キャラクター一覧に戻る
      </Link>

      <div className="character-header">
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
