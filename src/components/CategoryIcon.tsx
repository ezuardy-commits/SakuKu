import React from 'react';
import * as LucideIcons from 'lucide-react';

interface CategoryIconProps {
  name: string;
  className?: string;
  color?: string;
  size?: number;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  name,
  className = 'w-5 h-5',
  color,
  size = 20,
}) => {
  // @ts-ignore
  const IconComponent = LucideIcons[name] || LucideIcons.Tag;

  return (
    <IconComponent
      className={className}
      size={size}
      style={color ? { color } : undefined}
    />
  );
};
