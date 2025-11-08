import React from 'react';
import './SlotDisplay.css';

function SlotDisplay({ costume }) {
  const getRoleColor = (role) => {
    switch (role) {
      case 'Strike':
        return '#dc3545';
      case 'Rapid':
        return '#ffc107';
      case 'Support':
        return '#28a745';
      case 'Assault':
        return '#6f42c1';
      case 'Technical':
        return '#17a2b8';
      default:
        return '#6c757d';
    }
  };

  const getClassBadge = (slotClass) => {
    if (!slotClass) return null;
    return (
      <span className={`class-badge ${slotClass.toLowerCase()}`}>
        {slotClass === 'HERO' ? 'H' : 'V'}
      </span>
    );
  };

  const normalSlots = costume.slots
    ?.filter((slot) => slot.slot_type === 'Normal')
    .sort((a, b) => a.slot_number - b.slot_number) || [];

  const specialSlots = costume.slots
    ?.filter((slot) => slot.slot_type === 'Special')
    .sort((a, b) => a.slot_number - b.slot_number) || [];

  return (
    <div className="slot-display">
      <h2>{costume.name} - スロット情報</h2>

      <div className="slots-section">
        <h3>Normal Slots</h3>
        <div className="slots-grid">
          {normalSlots.map((slot) => (
            <div
              key={slot.id}
              className="slot-card"
              style={{ borderColor: getRoleColor(slot.role) }}
            >
              <div className="slot-header">
                <span className="slot-number">Slot {slot.slot_number}</span>
                {getClassBadge(slot.slot_class)}
              </div>
              <div
                className="slot-role"
                style={{ backgroundColor: getRoleColor(slot.role) }}
              >
                {slot.role}
              </div>
              <div className="slot-level">Max Lv. {slot.max_level}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="slots-section">
        <h3>Special Slots</h3>
        <div className="slots-grid">
          {specialSlots.map((slot) => (
            <div
              key={slot.id}
              className="slot-card special"
              style={{ borderColor: getRoleColor(slot.role) }}
            >
              <div className="slot-header">
                <span className="slot-number">
                  Special {slot.slot_number - 10}
                </span>
                {getClassBadge(slot.slot_class)}
              </div>
              <div
                className="slot-role"
                style={{ backgroundColor: getRoleColor(slot.role) }}
              >
                {slot.role}
              </div>
              <div className="slot-level">Max Lv. {slot.max_level}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SlotDisplay;
