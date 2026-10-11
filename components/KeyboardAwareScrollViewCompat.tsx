import { ScrollView, type ScrollViewProps } from 'react-native';

// Expo Go compatible replacement for react-native-keyboard-controller's
// KeyboardAwareScrollView. Extra controller-specific props (e.g. bottomOffset)
// are accepted and ignored so existing call sites keep working.
type Props = ScrollViewProps & {
  bottomOffset?: number;
};

export function KeyboardAwareScrollViewCompat({
  children,
  keyboardShouldPersistTaps = 'handled',
  bottomOffset: _bottomOffset,
  ...props
}: Props) {
  return (
    <ScrollView keyboardShouldPersistTaps={keyboardShouldPersistTaps} {...props}>
      {children}
    </ScrollView>
  );
}
