
import React from 'react';
import { Button } from '@/components/ui/button';

interface Filter {
  id: string;
  name: string;
  icon: string;
  preview: string;
}

interface FilterSelectorProps {
  activeFilter: string;
  onFilterChange: (filterId: string) => void;
  disabled?: boolean;
}

const FILTERS: Filter[] = [
  {
    id: 'normal',
    name: 'Normal',
    icon: '😊',
    preview: '👤'
  },
  {
    id: 'dog',
    name: 'Dog',
    icon: '🐶',
    preview: '🐕'
  },
  {
    id: 'cat',
    name: 'Cat',
    icon: '🐱',
    preview: '🐈'
  },
  {
    id: 'glasses',
    name: 'Glasses',
    icon: '🤓',
    preview: '👓'
  },
  {
    id: 'heart',
    name: 'Heart Eyes',
    icon: '😍',
    preview: '💕'
  }
];

export const FilterSelector: React.FC<FilterSelectorProps> = ({
  activeFilter,
  onFilterChange,
  disabled = false
}) => {
  return (
    <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center px-4">
      {/* Left side filters */}
      <div className="flex items-center gap-2 mr-4">
        {FILTERS.slice(0, 2).map((filter) => (
          <Button
            key={filter.id}
            variant="ghost"
            size="sm"
            onClick={() => onFilterChange(filter.id)}
            disabled={disabled}
            className={`w-14 h-14 rounded-full p-0 text-2xl transition-all duration-200 ${
              activeFilter === filter.id
                ? 'bg-white/40 scale-110 shadow-lg'
                : 'bg-black/20 hover:bg-white/30'
            }`}
          >
            <div className="flex flex-col items-center">
              <span className="text-lg">{filter.icon}</span>
              {activeFilter === filter.id && (
                <div className="w-1 h-1 bg-white rounded-full mt-1 animate-pulse" />
              )}
            </div>
          </Button>
        ))}
      </div>

      {/* Center capture button with filter preview */}
      <div className="relative">
        <div className="w-20 h-20 rounded-full border-4 border-white bg-white/10 backdrop-blur-sm flex items-center justify-center">
          {activeFilter !== 'normal' && (
            <div className="absolute inset-2 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
              <span className="text-lg">
                {FILTERS.find(f => f.id === activeFilter)?.preview || ''}
              </span>
            </div>
          )}
          <div className={`w-12 h-12 rounded-full transition-all duration-200 ${
            activeFilter !== 'normal' ? 'bg-white/60' : 'bg-white'
          }`} />
        </div>
        
        {/* Filter indicator ring */}
        {activeFilter !== 'normal' && (
          <div className="absolute inset-0 rounded-full border-2 border-blue-400 animate-pulse" />
        )}
      </div>

      {/* Right side filters */}
      <div className="flex items-center gap-2 ml-4">
        {FILTERS.slice(2).map((filter) => (
          <Button
            key={filter.id}
            variant="ghost"
            size="sm"
            onClick={() => onFilterChange(filter.id)}
            disabled={disabled}
            className={`w-14 h-14 rounded-full p-0 text-2xl transition-all duration-200 ${
              activeFilter === filter.id
                ? 'bg-white/40 scale-110 shadow-lg'
                : 'bg-black/20 hover:bg-white/30'
            }`}
          >
            <div className="flex flex-col items-center">
              <span className="text-lg">{filter.icon}</span>
              {activeFilter === filter.id && (
                <div className="w-1 h-1 bg-white rounded-full mt-1 animate-pulse" />
              )}
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
};
