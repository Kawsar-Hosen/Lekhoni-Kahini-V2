import React from 'react';
import {
  StyleSheet,
  Text as NativeText,
  TextInput as NativeTextInput,
  type TextInputProps,
  type TextProps,
  type TextStyle,
} from 'react-native';

function familyForStyle(style: TextStyle | undefined) {
  const currentFamily = style?.fontFamily;
  if (currentFamily && currentFamily !== 'serif') return undefined;

  switch (style?.fontWeight) {
    case '500':
      return 'NotoSerifBengali_500Medium';
    case '600':
      return 'NotoSerifBengali_600SemiBold';
    case 'bold':
    case '700':
    case '800':
    case '900':
      return 'NotoSerifBengali_700Bold';
    default:
      return 'NotoSerifBengali_400Regular';
  }
}

export function AppText({ style, ...props }: TextProps) {
  const fontFamily = familyForStyle(StyleSheet.flatten(style));
  return (
    <NativeText
      {...props}
      style={fontFamily ? [style, { fontFamily }] : style}
    />
  );
}

export function AppTextInput({ style, ...props }: TextInputProps) {
  const fontFamily = familyForStyle(StyleSheet.flatten(style));
  return (
    <NativeTextInput
      {...props}
      style={fontFamily ? [style, { fontFamily }] : style}
    />
  );
}