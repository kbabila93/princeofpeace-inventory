import { useEffect, useState, useRef } from 'react';

export const useBarcodeScanner = ({ onScan, minLength = 3, timeOut = 100 }) => {
  const [buffer, setBuffer] = useState('');
  const lastKeyTime = useRef(Date.now());
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTime.current;
      
      // If time between keys is too long, reset buffer (it's likely manual typing)
      if (timeDiff > timeOut && buffer.length > 0) {
        setBuffer('');
      }
      
      lastKeyTime.current = currentTime;
      
      // Ignore non-character keys (except Enter)
      if (e.key.length > 1 && e.key !== 'Enter') return;
      
      const target = e.target;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      
      // If user is typing in an input field, we might want to ignore, 
      // UNLESS it's the specific scan input. 
      // For global listener, usually we ignore if focused on input to avoid double typing.
      if (isInput) return;

      if (e.key === 'Enter') {
        if (buffer.length >= minLength) {
          e.preventDefault();
          onScan(buffer);
          setBuffer('');
        }
      } else {
        setBuffer(prev => prev + e.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [buffer, onScan, minLength, timeOut]);

  return;
};