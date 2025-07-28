
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
  }
];

export const FilterSelector: React.FC<FilterSelectorProps> = ({
  activeFilter,
  onFilterChange,
  disabled = false
}) => {
  return (
    <div className="absolute bottom-32 left-0 right-0 px-4">
      <div className="flex gap-2 justify-center">
        <div className="flex gap-3 bg-black/30 rounded-full px-4 py-2 backdrop-blur-sm">
          {FILTERS.map((filter) => (
            <Button
              key={filter.id}
              variant="ghost"
              size="sm"
              onClick={() => onFilterChange(filter.id)}
              disabled={disabled}
              className={`w-12 h-12 rounded-full p-0 text-2xl transition-all ${
                activeFilter === filter.id
                  ? 'bg-white/30 scale-110'
                  : 'bg-transparent hover:bg-white/20'
              }`}
            >
              {filter.icon}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};
