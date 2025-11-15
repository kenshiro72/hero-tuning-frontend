import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { charactersApi } from '../api/client';
import { getRoleColor } from '../utils/roleColors';
import './CharacterList.css';

function CharacterList() {
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        const response = await charactersApi.getAll();

        // キャラクターをベース名でグループ化
        const characterMap = new Map();

        response.data.forEach((character) => {
          // ベース名を取得（「（」の前の部分）
          const baseName = character.name.split('（')[0];

          // まだこのベース名が登録されていない場合のみ追加
          if (!characterMap.has(baseName)) {
            characterMap.set(baseName, character);
          }
        });

        // Map から配列に変換
        const uniqueCharacters = Array.from(characterMap.values());

        setCharacters(uniqueCharacters);
        setLoading(false);
      } catch (err) {
        setError('キャラクターの読み込みに失敗しました');
        setLoading(false);
      }
    };

    fetchCharacters();
  }, []);

  if (loading) {
    return <div className="loading">読み込み中...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  const getCharacterImage = (characterName) => {
    // ベース名を取得
    const baseName = characterName.split('（')[0];
    return `/images/characters/${baseName}.JPG`;
  };

  const handleImageError = (e) => {
    // 画像が見つからない場合、非表示にする
    e.target.style.display = 'none';
    e.target.nextSibling.style.display = 'flex'; // フォールバックの頭文字を表示
  };

  return (
    <div className="character-list">
      <h1>ヒロアカ T.U.N.I.G. System</h1>
      <div className="characters-grid">
        {characters.map((character) => {
          const baseName = character.name.split('（')[0];
          const initial = baseName.charAt(0);

          return (
            <Link
              key={character.id}
              to={`/characters/${character.id}`}
              className="character-card"
              style={{
                backgroundColor: getRoleColor(character.role),
                color: 'white',
                textDecoration: 'none'
              }}
            >
              <div className="character-card-content">
                <img
                  src={getCharacterImage(character.name)}
                  alt={baseName}
                  className="character-image"
                  onError={handleImageError}
                />
                <div className="character-initial" style={{ display: 'none' }}>
                  {initial}
                </div>
                <h2 style={{ color: 'white' }}>{baseName}</h2>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default CharacterList;
