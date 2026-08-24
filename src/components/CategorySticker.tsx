/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import * as Icons from 'lucide-react';
import { findCategory } from '../utils/categorySystem';

interface CategoryStickerProps {
  categoryNameOrId?: string;
  iconName?: string;
  color?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showBackground?: boolean;
  className?: string;
}

const sizeMap = {
  xs: { badge: 'w-5 h-5 rounded-md p-1', icon: 'w-3 h-3' },
  sm: { badge: 'w-7 h-7 rounded-lg p-1.5', icon: 'w-4 h-4' },
  md: { badge: 'w-9 h-9 rounded-xl p-2', icon: 'w-5 h-5' },
  lg: { badge: 'w-11 h-11 rounded-2xl p-2.5', icon: 'w-6 h-6' },
  xl: { badge: 'w-14 h-14 rounded-2xl p-3', icon: 'w-8 h-8' },
};

export const CategorySticker: React.FC<CategoryStickerProps> = ({
  categoryNameOrId,
  iconName: propIconName,
  color: propColor,
  size = 'md',
  showBackground = true,
  className = '',
}) => {
  const category = categoryNameOrId ? findCategory(categoryNameOrId) : null;

  const iconName = propIconName || category?.iconName || 'Tag';
  const color = propColor || category?.color || '#3b82f6';

  // Dynamically resolve Lucide Icon
  const IconComponent = (Icons as Record<string, any>)[iconName] || Icons.Tag;

  const dims = sizeMap[size];

  if (!showBackground) {
    return (
      <IconComponent
        className={`${dims.icon} shrink-0 ${className}`}
        style={{ color }}
      />
    );
  }

  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 border border-white/10 shadow-sm transition-transform ${dims.badge} ${className}`}
      style={{
        backgroundColor: `${color}20`, // 20% opacity background badge
        color: color,
        borderColor: `${color}40`,
      }}
      title={category?.name || categoryNameOrId}
    >
      <IconComponent className={`${dims.icon} stroke-[2.2]`} />
    </div>
  );
};
