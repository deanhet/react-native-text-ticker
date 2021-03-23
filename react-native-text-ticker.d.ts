declare module 'react-native-text-ticker' {
  import React from 'react';
  import { StyleProp, TextProps, TextStyle, EasingFunction } from 'react-native';

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
    bounceDelay?: number;
    isInteraction?: boolean;
    useNativeDriver?: boolean;
    repeatSpacer?: number;
    easing?: EasingFunction;
    animationType?: 'auto' | 'scroll' | 'bounce';
    scrollSpeed?: number;
    bounceSpeed?: number;
    shouldAnimateTreshold?: number;
    isRTL?: boolean;
    bouncePadding?: {
      left?: number;
      right?: number;
    }
    disabled?: boolean;
  }

  export interface TextTickerRef {
    startAnimation(): void;
    stopAnimation(): void;
  }

  export default class TextTicker extends React.Component<TextTickerProps> { }
}
