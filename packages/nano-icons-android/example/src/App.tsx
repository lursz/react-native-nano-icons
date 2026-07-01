import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import NanoIconsAndroid from '../../specs/NativeNanoIconsAndroid';

export default function App() {
  const result = NanoIconsAndroid.multiply(6, 7);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>nano-icons-android</Text>
      <Text>multiply(6, 7) = {result}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
});
