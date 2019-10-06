declare module 'react-native-text-ticker' {
  import React from 'react';
  import { StyleProp, TextProps, TextStyle } from 'react-native';

  export interface TextTickerProps extends TextProps {
    duration?: number;
    onMarqueeComplete?: () => void;
    onScrollStart?: () => void;
    style?: StyleProp<TextStyle>;
    loop?: boolean;
    bounce?: boolean;
    scroll?: boolean;
    marqueeOnMount?: boolean;
    marqueeDelay?: number;
    isInteraction?: boolean;
    useNativeDriver?: boolean;
    repeatSpacer?: number;
    easing?: (value: number) => number;
    animationType?: string;
    scrollSpeed?: number;
    bounceSpeed?: number;
    shouldAnimateTreshold?: number;
  }

  export default class TextTicker<T> extends React.Component<TextTickerProps> { }
}
