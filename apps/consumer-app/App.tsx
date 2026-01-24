import { registerRootComponent } from 'expo';
import { StyleSheet, Text, View } from 'react-native';
// In a real app, we would import from @app/ui-kit and @app/core here
// import { config } from '@app/ui-kit';

function App() {
    return (
        <View style={styles.container}>
            <Text>StyleSwipe: Industrial-Grade Monorepo Initialized</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
});

registerRootComponent(App);
