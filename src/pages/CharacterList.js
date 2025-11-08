import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { charactersApi } from '../api/client';
import './CharacterList.css';

function CharacterList() {
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        const response = await charactersApi.getAll();
        setCharacters(response.data);
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

  return (
    <div className="character-list">
      <h1>ヒロアカ T.U.N.I.G. System</h1>
      <div className="characters-grid">
        {characters.map((character) => (
          <Link
            key={character.id}
            to={`/characters/${character.id}`}
            className="character-card"
          >
            <h2>{character.name}</h2>
            <div className="character-info">
              <p>
                <span className="label">Role:</span> {character.role}
              </p>
              <p>
                <span className="label">Class:</span> {character.character_class}
              </p>
              <p>
                <span className="label">HP:</span> {character.hp}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default CharacterList;
