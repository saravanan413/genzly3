
import { useState, useEffect } from 'react';
import { StoryWithTimestamp } from '../utils/storyUtils';

interface StoryHighlight {
  id: string;
  name: string;
  cover: string;
  stories: StoryWithTimestamp[];
  createdAt: number;
}

export const useStoryHighlights = () => {
  const [highlights, setHighlights] = useState<StoryHighlight[]>([]);

  // Load highlights from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('genzly_story_highlights');
      if (saved) {
        setHighlights(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading story highlights:', error);
    }
  }, []);

  const saveHighlights = (newHighlights: StoryHighlight[]) => {
    try {
      localStorage.setItem('genzly_story_highlights', JSON.stringify(newHighlights));
      setHighlights(newHighlights);
    } catch (error) {
      console.error('Error saving story highlights:', error);
    }
  };

  const createHighlight = (name: string, stories: StoryWithTimestamp[]) => {
    const newHighlight: StoryHighlight = {
      id: Date.now().toString(),
      name,
      cover: stories[0]?.image || '',
      stories,
      createdAt: Date.now()
    };
    
    const updatedHighlights = [...highlights, newHighlight];
    saveHighlights(updatedHighlights);
    return newHighlight;
  };

  const addStoryToHighlight = (highlightId: string, story: StoryWithTimestamp) => {
    const updatedHighlights = highlights.map(highlight => 
      highlight.id === highlightId 
        ? { ...highlight, stories: [...highlight.stories, story] }
        : highlight
    );
    saveHighlights(updatedHighlights);
  };

  const deleteHighlight = (highlightId: string) => {
    const updatedHighlights = highlights.filter(h => h.id !== highlightId);
    saveHighlights(updatedHighlights);
  };

  return {
    highlights,
    createHighlight,
    addStoryToHighlight,
    deleteHighlight
  };
};
