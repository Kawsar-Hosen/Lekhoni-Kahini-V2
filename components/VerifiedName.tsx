import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { AppText as Text } from '@/components/AppText';
import { useColors } from '@/hooks/useColors';

type VerifiedNameProps = {
  name: string;
  verified?: boolean;
  nameStyle?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  numberOfLines?: number;
  badgeSize?: number;
};

export function VerifiedName({
  name,
  verified = false,
  nameStyle,
  containerStyle,
  numberOfLines = 1,
  badgeSize = 14,
}: VerifiedNameProps) {
  const colors = useColors();

  return (
    <View style={[styles.row, containerStyle]}>
      <Text numberOfLines={numberOfLines} style={[styles.name, nameStyle]}>{name}</Text>
      {verified ? (
        <MaterialIcons
          name="verified"
          size={badgeSize}
          color={colors.skyText}
          accessibilityLabel="যাচাইকৃত লেখক"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4, minWidth: 0 },
  name: { flexShrink: 1 },
});