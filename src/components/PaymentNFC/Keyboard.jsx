import React from 'react';
import './Keyboard.css';

const Keyboard = ({ onInput, onClear, onEnter, value, disabled }) => {
  const handleKeyPress = (key) => {
    if (!disabled) {
      onInput(key);
    }
  };

  const handleClear = () => {
    if (!disabled) {
      onClear();
    }
  };

  const handleEnter = () => {
    // Disabilita INVIO se l'importo è zero
    const numericAmount = parseFloat(value);
    if (!disabled && numericAmount > 0) {
      onEnter();
    }
  };

  const isAmountZero = parseFloat(value) === 0;

  return (
    <div className={`pos-keyboard ${disabled ? 'disabled' : ''}`}>
      <div className="keyboard-display">
        <span className="currency">€</span>
        <span className="amount">{value}</span>
      </div>
      
      <div className="keyboard-grid">
        <button className="key key-number" onClick={() => handleKeyPress('1')} disabled={disabled}>1</button>
        <button className="key key-number" onClick={() => handleKeyPress('2')} disabled={disabled}>2</button>
        <button className="key key-number" onClick={() => handleKeyPress('3')} disabled={disabled}>3</button>
        
        <button className="key key-number" onClick={() => handleKeyPress('4')} disabled={disabled}>4</button>
        <button className="key key-number" onClick={() => handleKeyPress('5')} disabled={disabled}>5</button>
        <button className="key key-number" onClick={() => handleKeyPress('6')} disabled={disabled}>6</button>
        
        <button className="key key-number" onClick={() => handleKeyPress('7')} disabled={disabled}>7</button>
        <button className="key key-number" onClick={() => handleKeyPress('8')} disabled={disabled}>8</button>
        <button className="key key-number" onClick={() => handleKeyPress('9')} disabled={disabled}>9</button>
        
        <button className="key key-decimal" disabled={true}>.</button>
        <button className="key key-number" onClick={() => handleKeyPress('0')} disabled={disabled}>0</button>
        <button className="key key-clear" onClick={handleClear} disabled={disabled}>C</button>
      </div>
      
      <button 
        className="enter-button" 
        onClick={handleEnter}
        disabled={disabled || isAmountZero}
      >
        INVIO
      </button>
    </div>
  );
};

export default Keyboard;