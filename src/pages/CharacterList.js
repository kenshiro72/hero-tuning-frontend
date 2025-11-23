import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { charactersApi } from '../api/client';
import { getRoleColor } from '../utils/roleColors';
import LoadingSpinner from '../components/LoadingSpinner';
import './CharacterList.css';

function CharacterList() {
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    let isMounted = true; // メモリリーク防止用フラグ

    const fetchCharacters = async () => {
      try {
        const response = await charactersApi.getAll();

        if (!isMounted) return; // アンマウント後は状態を更新しない

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

        if (isMounted) {
          setCharacters(uniqueCharacters);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError('キャラクターの読み込みに失敗しました');
          setLoading(false);
        }
      }
    };

    fetchCharacters();

    // クリーンアップ関数
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return <LoadingSpinner text="キャラクター読み込み中" />;
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

  // フィルタリングされたキャラクターリスト
  const filteredCharacters = characters.filter((character) => {
    const baseName = character.name.split('（')[0];

    // 検索テキストでフィルタリング
    if (searchText && !baseName.toLowerCase().includes(searchText.toLowerCase())) {
      return false;
    }

    return true;
  });

  // HEROとVILLAINに分ける（character_classを使用）
  const heroCharacters = filteredCharacters.filter((character) => character.character_class === 'HERO');
  const villainCharacters = filteredCharacters.filter((character) => character.character_class === 'VILLAIN');

  const renderCharacterCards = (charactersList) => {
    return charactersList.map((character) => {
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
    });
  };

  return (
    <div className="character-list">
      <h1>ヒロアカUR T.U.N.I.N.G. 研究所</h1>

      <div className="search-section">
        <input
          type="text"
          className="character-search-input"
          placeholder="キャラクター名で検索..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>

      {filteredCharacters.length === 0 ? (
        <div className="no-results">検索結果がありません</div>
      ) : (
        <>
          {/* HEROセクション */}
          {heroCharacters.length > 0 && (
            <div className="affiliation-section hero-section">
              <div className="section-header hero-header">
                <h2>HERO</h2>
              </div>
              <div className="characters-grid">
                {renderCharacterCards(heroCharacters)}
              </div>
            </div>
          )}

          {/* VILLAINセクション */}
          {villainCharacters.length > 0 && (
            <div className="affiliation-section villain-section">
              <div className="section-header villain-header">
                <h2>VILLAIN</h2>
              </div>
              <div className="characters-grid">
                {renderCharacterCards(villainCharacters)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default CharacterList;
