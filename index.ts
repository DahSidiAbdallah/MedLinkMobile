import 'react-native-gesture-handler';
import { registerRootComponent } from 'expo';

// Guard the App import so module-eval failures don't prevent AppRegistry from
// being called. If an error occurs we register a minimal error component that
// renders the exception message — this helps surface the actual underlying
// module error on-device instead of the opaque "main has not been registered".
let App: any = null;
try {
	// eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
	App = require('./App').default;
} catch (e) {
	// eslint-disable-next-line no-console
	console.error('Failed to import ./App — rendering error fallback', e);
	const React = require('react');
	const { View, Text, ScrollView } = require('react-native');
		App = function ErrorApp() {
			const err: any = e;
			return React.createElement(
				ScrollView,
				{ contentContainerStyle: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 } },
				React.createElement(Text, { style: { color: '#b00020', fontWeight: '700', marginBottom: 12 } }, 'App failed to load'),
				React.createElement(Text, { style: { color: '#111' } }, String(err && (err.stack || err.message || err)))
			);
		};
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
