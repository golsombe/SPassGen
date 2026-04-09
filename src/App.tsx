import React, { useState, useEffect, useCallback } from 'react';
import './App.css'; // Assuming you have an App.css for styling

// Helper for secure random integer generation using Web Crypto API
// This function avoids modulo bias, ensuring a uniform distribution.
function getRandomInt(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  const range = max - min;

  if (range <= 0) {
    return min; // Or throw an error, depending on desired behavior for invalid range
  }

  // Calculate the number of bits needed for the range
  // e.g., if range is 10, we need ceil(log2(10)) = 4 bits (0-15)
  const numBits = Math.ceil(Math.log2(range));
  // Calculate the number of bytes needed
  const numBytes = Math.ceil(numBits / 8);

  if (numBytes === 0) {
    return min; // Should not happen if range > 0
  }

  const randomBytes = new Uint8Array(numBytes);
  let randomNumber;
  let maxValidValue;

  do {
    window.crypto.getRandomValues(randomBytes);
    randomNumber = 0;
    for (let i = 0; i < numBytes; i++) {
      randomNumber = (randomNumber << 8) | randomBytes[i];
    }
    // Mask to get only the relevant bits, if numBits is not a multiple of 8
    const mask = (1 << numBits) - 1;
    randomNumber &= mask;

    // Avoid modulo bias by re-rolling if the number is out of the valid range
    // maxValidValue is the largest multiple of 'range' that fits within 2^numBits
    maxValidValue = Math.floor((2 ** numBits) / range) * range;
  } while (randomNumber >= maxValidValue);

  return min + (randomNumber % range);
}

// Define standard character sets
const UPPERCASE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE_CHARS = 'abcdefghijklmnopqrstuvwxyz';
const NUMERIC_CHARS = '0123456789';
const UNICODE_START = 0xA01; // Starting Unicode character U+A01
const UNICODE_COUNT = 32;    // Total 32 characters, so up to U+A20

interface CharacterSetOption {
  id: string;
  label: string;
  chars: string;
  enabled: boolean;
}

function App() {
  const [password, setPassword] = useState('');
  const [length, setLength] = useState(12); // Default password length
  const [characterSetOptions, setCharacterSetOptions] = useState<CharacterSetOption[]>([
    { id: 'uppercase', label: 'A-Z', chars: UPPERCASE_CHARS, enabled: true },
    { id: 'lowercase', label: 'a-z', chars: LOWERCASE_CHARS, enabled: true },
    { id: 'numbers', label: '0-9', chars: NUMERIC_CHARS, enabled: true },
    { id: 'unicode', label: `Unicode (U+${UNICODE_START.toString(16).toUpperCase()}-U+${(UNICODE_START + UNICODE_COUNT - 1).toString(16).toUpperCase()})`, chars: '', enabled: false },
  ]);

  // Function to dynamically generate the Unicode characters string
  const getUnicodeCharsString = useCallback(() => {
    let unicodeChars = '';
    for (let i = 0; i < UNICODE_COUNT; i++) {
      unicodeChars += String.fromCharCode(UNICODE_START + i);
    }
    return unicodeChars;
  }, []);

  // Initialize Unicode characters once when the component mounts
  useEffect(() => {
    setCharacterSetOptions(prevOptions =>
      prevOptions.map(option =>
        option.id === 'unicode' ? { ...option, chars: getUnicodeCharsString() } : option
      )
    );
  }, [getUnicodeCharsString]);

  // Function to generate the password based on current settings
  const generatePassword = useCallback(() => {
    const enabledSets = characterSetOptions.filter(set => set.enabled);
    if (enabledSets.length === 0) {
      setPassword('Please select at least one character set.');
      return;
    }

    let allAvailableChars = '';
    enabledSets.forEach(set => {
      allAvailableChars += set.chars;
    });

    if (allAvailableChars.length === 0) {
      setPassword('No characters available in selected sets. Adjust Unicode range or other options.');
      return;
    }

    let newPassword = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = getRandomInt(0, allAvailableChars.length);
      newPassword += allAvailableChars[randomIndex];
    }
    setPassword(newPassword);
  }, [length, characterSetOptions]);

  // Regenerate password when length or character sets change
  useEffect(() => {
    generatePassword();
  }, [generatePassword]);

  // Handler for password length slider change
  const handleLengthChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLength(Number(event.target.value));
  };

  // Handler for character set checkbox change
  const handleCharacterSetChange = (id: string) => {
    setCharacterSetOptions(prevOptions =>
      prevOptions.map(option =>
        option.id === id ? { ...option, enabled: !option.enabled } : option
      )
    );
  };

  // Function to copy the generated password to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(password);
      alert('Password copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy password: ', err);
      alert('Failed to copy password. Please check browser permissions or try manually.');
    }
  };

  return (
    <div className="App">
      <header className="banner">
        <img src="spassgen.png" alt="Sec Pass Gen" className="banner-image" />
      </header>
      <div className="password-display-section">
        <input type="text" value={password} readOnly className="password-input" />
        <button onClick={copyToClipboard} className="copy-button">Copy</button>
      </div>

      <div className="controls-section">
        <div className="control-group">
          <label htmlFor="password-length">Password Length: <span>{length}</span></label>
          <input
            id="password-length"
            type="range"
            min="6"
            max="33"
            value={length}
            onChange={handleLengthChange}
            className="length-slider"
          />
        </div>

        <div className="control-group">
          <h3>Include Characters:</h3>
          <div className="character-sets-group">
            {characterSetOptions.map(option => (
              <div key={option.id} className="checkbox-item">
                <label htmlFor={option.id}>{option.label}</label>
                <input
                  type="checkbox"
                  id={option.id}
                  checked={option.enabled}
                  onChange={() => handleCharacterSetChange(option.id)}
                />
              </div>
            ))}
          </div>
        </div>

        <button onClick={generatePassword} className="generate-button">Generate New Password</button>
      </div>
    </div>
  );
}

export default App;