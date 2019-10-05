declare module 'react-native-text-ticker' {
  import React from 'react';
  import { StyleProp, TextProps, TextStyle } from 'react-native';

  export interface TextTickerProps extends TextProps {
    style?: StyleProp<TextStyle>;
    duration: number;
    loop?: boolean;
    bounce?: boolean;
    scroll?: boolean;
    marqueeOnMount?: boolean;
    marqueeDelay?: number;
    isInteraction?: boolean;
    useNativeDriver?: boolean;
    onMarqueeComplete: () => void;
    onScrollStart: () => void;
    repeatSpacer?: number;
    easing?: (value: number) => number;
    animationType?: string;
    scrollingSpeed?: number;
    shouldAnimateTreshold?: number;
  }

  export default class TextTicker<T> extends React.Component<TextTickerProps> { }
}
