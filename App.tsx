import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SimpleGameEngine } from './components/SimpleGameEngine';

export default function App() {
  return (
    <View style={styles.container}>
      <SimpleGameEngine />
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
