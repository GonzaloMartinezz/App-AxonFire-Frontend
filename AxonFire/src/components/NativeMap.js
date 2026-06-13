import React from 'react';
import { View, Text } from 'react-native';

export const PROVIDER_GOOGLE = 'google';

export const Marker = ({ children }) => <View>{children}</View>;

const NativeMap = React.forwardRef((props, ref) => {
  React.useImperativeHandle(ref, () => ({
    animateToRegion: () => {},
  }));

  return (
    <View style={[{ justifyContent: 'center', alignItems: 'center', backgroundColor: '#334155' }, props.style]}>
      <Text style={{ color: '#94a3b8', fontSize: 12 }}>Mapa (react-native-maps) no disponible en web.</Text>
    </View>
  );
});

export default NativeMap;
