import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText as Text, AppTextInput as TextInput } from '@/components/AppText';
import { useColors } from '@/hooks/useColors';

type AuthFieldProps = {
  testID: string;
  icon: keyof typeof Feather.glyphMap;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  secureTextEntry?: boolean;
  multiline?: boolean;
  rightText?: string;
  rightIcon?: keyof typeof Feather.glyphMap;
  onRightPress?: () => void;
  keyboardType?: 'default' | 'email-address' | 'number-pad' | 'phone-pad';
  maxLength?: number;
  editable?: boolean;
};

export function AuthField({
  testID,
  icon,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  multiline = false,
  rightText,
  rightIcon,
  onRightPress,
  keyboardType = 'default',
  maxLength,
  editable = true,
}: AuthFieldProps) {
  const colors = useColors();

  return (
    <View style={[styles.field, multiline && styles.multilineField, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Feather name={icon} size={22} color={colors.mutedForeground} />
      <TextInput
        testID={testID}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        keyboardType={keyboardType}
        maxLength={maxLength}
        editable={editable}
        textAlignVertical={multiline ? 'top' : 'center'}
        selectionColor={colors.primary}
        style={[styles.input, multiline && styles.multilineInput, { color: colors.foreground }]}
      />
      {rightText ? <Text style={[styles.rightText, { color: colors.mutedForeground }]}>{rightText}</Text> : null}
      {rightIcon ? (
        <Pressable testID={`${testID}-action`} onPress={onRightPress} hitSlop={10}>
          <Feather name={rightIcon} size={22} color={colors.mutedForeground} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { minHeight: 61, borderWidth: 1, borderRadius: 20, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 14 },
  multilineField: { minHeight: 118, alignItems: 'flex-start', paddingTop: 19 },
  input: { flex: 1, minWidth: 0, fontFamily: 'serif', fontSize: 18 },
  multilineInput: { minHeight: 78, paddingTop: 0 },
  rightText: { fontFamily: 'serif', fontSize: 13 },
});