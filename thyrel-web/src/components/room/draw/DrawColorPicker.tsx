import React from 'react';
import { Box } from '@material-ui/core';
import ShuffleIcon from '@material-ui/icons/Shuffle';

type DrawColorPickerProps = {
  flexDirection?: 'row' | 'column';
  colors: string[];
  currentColor: string;
  randomColor: string;
  onColorChange?: (color: string) => void;
  onRandomColorClick?: () => void;
};

export default function DrawColorPicker({
  flexDirection = 'column',
  colors,
  currentColor,
  onColorChange,
  randomColor,
  onRandomColorClick,
}: DrawColorPickerProps) {
  return (
    <Box
      display="flex"
      flexWrap="wrap"
      borderRadius={30}
      border={1}
      width={flexDirection === 'row' ? '100%' : 124}
      height={flexDirection === 'row' ? '100%' : 377}
      borderColor="#000000"
      justifyContent="center"
      bgcolor="#272B31"
      padding={1}>
      {colors.map(color => {
        const isSelected = color === currentColor;
        const isRandomColor = color === randomColor;
        return isRandomColor ? (
          <Box
            component="button"
            key={randomColor}
            onClick={() => {
              onColorChange?.(color);
              onRandomColorClick?.();
            }}
            border={isSelected ? 2 : 0}
            m={0.5}
            bgcolor={randomColor}
            borderColor={isSelected ? '#FFF6F6' : '#000000'}
            width={42}
            height={42}
            borderRadius="50%"
            className="cursor-pointer">
            <ShuffleIcon></ShuffleIcon>
          </Box>
        ) : (
          <Box
            component="button"
            key={color}
            onClick={() => onColorChange?.(color)}
            border={isSelected ? 2 : 0}
            m={0.5}
            bgcolor={color}
            borderColor={isSelected ? '#FFF6F6' : '#000000'}
            width={42}
            height={42}
            borderRadius="50%"
            className="cursor-pointer"
          />
        );
      })}
    </Box>
  );
}
