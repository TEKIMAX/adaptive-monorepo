
import React, { useState, useEffect } from 'react';
import { generateFuturisticIllustration } from '../services/imageService';

interface Props {
  prompt: string;
  className?: string;
  placeholderAlt?: string;
}

const FuturisticIllustration: React.FC<Props> = ({ prompt, className = "", placeholderAlt = "Illustration" }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadImage = async () => {
      setLoading(true);
      const url = await generateFuturisticIllustration(prompt);
      if (isMounted) {
        setImageUrl(url);
        setLoading(false);
      }
    };
    loadImage();
    return () => { isMounted = false; };
  }, [prompt]);

  return (
    <div className={`relative overflow-hidden bg-tekimax-navy/5 flex items-center justify-center ${className}`}>
      {loading ? (
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-tekimax-orange/10 border-t-tekimax-orange rounded-full animate-spin"></div>
          <span className="text-[10px] uppercase tracking-[0.3em] text-tekimax-dark/30 font-bold">Synthesizing Visual...</span>
        </div>
      ) : imageUrl ? (
        <img src={imageUrl} alt={placeholderAlt} className="w-full h-full object-cover transition-opacity duration-1000 opacity-100" />
      ) : (
        <div className="text-tekimax-dark/10 text-[10px] uppercase tracking-widest font-bold">Asset Placeholder</div>
      )}
    </div>
  );
};

export default FuturisticIllustration;
