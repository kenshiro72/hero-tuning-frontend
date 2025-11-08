import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { charactersApi } from '../api/client';
import CostumeSelector from '../components/CostumeSelector';
import SlotDisplay from '../components/SlotDisplay';
import './CharacterDetail.css';

function CharacterDetail() {
  const { id } = useParams();
  const [character, setCharacter] = useState(null);
  const [selectedCostume, setSelectedCostume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCharacter = async () => {
      try {
        const response = await charactersApi.getById(id);
        setCharacter(response.data);
        if (response.data.costumes && response.data.costumes.length > 0) {
          setSelectedCostume(response.data.costumes[0]);
        }
        setLoading(false);
      } catch (err) {
        setError('キャラクター情報の読み込みに失敗しました');
        setLoading(false);
      }
    };

    fetchCharacter();
  }, [id]);

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
        <div className="character-stats">
          <div className="stat">
            <span className="stat-label">Role:</span>
            <span className="stat-value">{character.role}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Class:</span>
            <span className="stat-value">{character.character_class}</span>
          </div>
          <div className="stat">
            <span className="stat-label">HP:</span>
            <span className="stat-value">{character.hp}</span>
          </div>
          <div className="stat">
            <span className="stat-label">α Damage:</span>
            <span className="stat-value">{character.alpha_damage}</span>
          </div>
          <div className="stat">
            <span className="stat-label">β Damage:</span>
            <span className="stat-value">{character.beta_damage}</span>
          </div>
          <div className="stat">
            <span className="stat-label">γ Damage:</span>
            <span className="stat-value">{character.gamma_damage}</span>
          </div>
        </div>

        {character.memory && (
          <div className="memory-info">
            <h3>メモリー</h3>
            <p>
              <strong>
                {character.memory.role} / {character.memory.memory_class}
              </strong>
            </p>
            <p>{character.memory.effect}</p>
          </div>
        )}
      </div>

      <CostumeSelector
        costumes={character.costumes}
        selectedCostume={selectedCostume}
        onSelectCostume={setSelectedCostume}
      />

      {selectedCostume && <SlotDisplay costume={selectedCostume} />}
    </div>
  );
}

export default CharacterDetail;
