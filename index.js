import React, { PureComponent } from 'react'
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
  ScrollView,
  NativeModules,
  findNodeHandle,
  I18nManager
} from 'react-native'
import PropTypes from 'prop-types'

const { UIManager } = NativeModules

export const TextTickAnimationType = Object.freeze({
  auto: 'auto',
  scroll: 'scroll',
  bounce: 'bounce'
})

export default class TextMarquee extends PureComponent {

  static propTypes = {
    style:             Text.propTypes.style,
    duration:          PropTypes.number,
    loop:              PropTypes.bool,
    bounce:            PropTypes.bool,
    scroll:            PropTypes.bool,
    marqueeOnMount:    PropTypes.bool,
    marqueeDelay:      PropTypes.number,
    isInteraction:     PropTypes.bool,
    useNativeDriver:   PropTypes.bool,
    onMarqueeComplete: PropTypes.func,
    onScrollStart:     PropTypes.func,
    children:          PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.array
    ]),
    repeatSpacer:      PropTypes.number,
    easing:            PropTypes.func,
    animationType:     PropTypes.string, // (values should be from AnimationType, 'auto', 'scroll', 'bounce')
    bounceSpeed:       PropTypes.number, // Will be ignored if you set duration directly.
    scrollSpeed:       PropTypes.number, // Will be ignored if you set duration directly.
    shouldAnimateTreshold: PropTypes.number,
    disabled:          PropTypes.bool
  }

  static defaultProps = {
    style:             {},
    loop:              true,
    bounce:            true,
    scroll:            true,
    marqueeOnMount:    true,
    marqueeDelay:      0,
    isInteraction:     true,
    useNativeDriver:   true,
    repeatSpacer:      50,
    easing:            Easing.ease,
    animationType:     'auto',
    bounceSpeed:       50,
    scrollSpeed:       150,
    shouldAnimateTreshold: 0,
    disabled:          false
  }

  animatedValue = new Animated.Value(0)
  distance = null
  textRef = null
  containerRef = null

  state = {
    animating:    false,
    contentFits:  true,
    shouldBounce: false,
    isScrolling:  false
  }

  constructor(props) {
    super(props);
    this.calculateMetricsPromise = null
  }
  
  componentDidMount() {
    this.invalidateMetrics()
    const { disabled, marqueeDelay, marqueeOnMount } = this.props
    if (!disabled && marqueeOnMount) {
      this.startAnimation(marqueeDelay)
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props.children !== prevProps.children) {
      this.resetScroll()
    } else if (this.props.disabled !== prevProps.disabled) {
      if (!this.props.disabled && this.props.marqueeOnMount) {
        this.startAnimation(this.props.marqueeDelay)
      } else if (this.props.disabled) {
        // Cancel any promises
        if (this.calculateMetricsPromise !== null) {
          this.calculateMetricsPromise.cancel()
          this.calculateMetricsPromise = null
        }
        this.stopAnimation()
        this.clearTimeout()
      }
    }
  }

  componentWillUnmount() {
    // Cancel promise to stop setState after unmount
    if (this.calculateMetricsPromise !== null) {
      this.calculateMetricsPromise.cancel()
      this.calculateMetricsPromise = null
    }
    this.stopAnimation()
    // always stop timers when unmounting, common source of crash
    this.clearTimeout()
  }

  makeCancelable = (promise) => {
    let cancel = () => {}
    const wrappedPromise = new Promise((resolve, reject) => {
      cancel = () => {
        resolve = null
        reject = null
      };
      promise.then(
        value => {
          if (resolve) {
            resolve(value)
          }
        }, 
        error => {
          if (reject) {
            reject(error)
          }
        }
      );
    });
    wrappedPromise.cancel = cancel
    return wrappedPromise
  };

  startAnimation = (timeDelay) => {
    if (this.state.animating) {
      return
    }
    this.start(timeDelay)
  }

  animateScroll = () => {
    const {
      duration,
      marqueeDelay,
      loop,
      isInteraction,
      useNativeDriver,
      repeatSpacer,
      easing,
      children,
      scrollSpeed,
      onMarqueeComplete
    } = this.props
    this.setTimeout(() => {
      const scrollToValue = I18nManager.isRTL ? this.textWidth + repeatSpacer : -this.textWidth - repeatSpacer
      if(!isNaN(scrollToValue)) {
        Animated.timing(this.animatedValue, {
          toValue:         scrollToValue,
          duration:        duration || children.length * scrollSpeed,
          easing:          easing,
          isInteraction:   isInteraction,
          useNativeDriver: useNativeDriver
        }).start(({ finished }) => {
          if (finished) {
            if (onMarqueeComplete) {
              onMarqueeComplete()
            }
            if (loop) {
              this.animatedValue.setValue(0)
              this.animateScroll()
            }
          }
        })} else {
          this.start()
        }
    }, marqueeDelay)
  }

  animateBounce = () => {
    const {duration, marqueeDelay, loop, isInteraction, useNativeDriver, easing, children, bounceSpeed} = this.props
    this.setTimeout(() => {
      Animated.sequence([
        Animated.timing(this.animatedValue, {
          toValue:         I18nManager.isRTL ? this.distance + 10 : -this.distance - 10,
          duration:        duration || (this.distance) * bounceSpeed,
          easing:          easing,
          isInteraction:   isInteraction,
          useNativeDriver: useNativeDriver
        }),
        Animated.timing(this.animatedValue, {
          toValue:         I18nManager.isRTL ? -10 : 10,
          duration:        duration || (this.distance) * bounceSpeed,
          easing:          easing,
          isInteraction:   isInteraction,
          useNativeDriver: useNativeDriver
        })
      ]).start(({finished}) => {
        if (finished) {
          this.hasFinishedFirstLoop = true
        }
        if (loop) {
          this.animateBounce()
        }
      })
    }, this.hasFinishedFirstLoop ? 0 : marqueeDelay)
  }

  start = async (timeDelay) => {
    this.setState({ animating: true })
    this.setTimeout(async () => {
      await this.calculateMetrics()
      if (!this.state.contentFits) {
        const {onScrollStart} = this.props
        if(onScrollStart && typeof onScrollStart === "function") {
          onScrollStart()
        }
        if (this.props.animationType === 'auto') {
          if (this.state.shouldBounce && this.props.bounce) {
            this.animateBounce()
          } else {
            this.animateScroll()
          }
        } else if (this.props.animationType === 'bounce') {
          this.animateBounce()
        } else if (this.props.animationType === 'scroll') {
          this.animateScroll()
        }
      }
    }, 100)
  }

  stopAnimation() {
    this.animatedValue.setValue(0)
    this.setState({ animating: false, shouldBounce: false })
  }

  async calculateMetrics() {
    const {shouldAnimateTreshold} = this.props
    this.calculateMetricsPromise = this.makeCancelable(new Promise(async (resolve, reject) => {
      try {
        const measureWidth = node =>
          new Promise(async (resolve, reject) => {
            // nodehandle is not always there, causes crash. modified to check..
            const nodeHandle = findNodeHandle(node);
            if (nodeHandle) {
              UIManager.measure(nodeHandle, (x, y, w) => {
                // console.log('Width: ' + w)
                return resolve(w)
              })
            } else {
              return reject('nodehandle_not_found');
            }
          });
        const [containerWidth, textWidth] = await Promise.all([
          measureWidth(this.containerRef),
          measureWidth(this.textRef)
        ]);

        this.containerWidth = containerWidth
        this.textWidth = textWidth
        this.distance = textWidth - containerWidth + shouldAnimateTreshold

        // console.log(`distance: ${this.distance}, contentFits: ${this.state.contentFits}`)
        resolve({
          // Is 1 instead of 0 to get round rounding errors from:
          // https://github.com/facebook/react-native/commit/a534672
          contentFits:  this.distance <= 1,
          shouldBounce: this.distance < this.containerWidth / 8
        })
      } catch (error) {
        console.warn('react-native-text-ticker: could not calculate metrics', error);
      }
    }))
    await this.calculateMetricsPromise.then((result) => {
      this.setState({
        contentFits: result.contentFits,
        shouldBounce: result.shouldBounce,
      })
      return []
    })
  }

  invalidateMetrics = () => {
    this.distance = null
    this.setState({ contentFits: true })
  }

  clearTimeout() {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
  }

  setTimeout(fn, time = 0) {
    this.clearTimeout()
    this.timer = setTimeout(fn, time)
  }

  scrollBegin = () => {
    this.setState({ isScrolling: true })
    this.animatedValue.setValue(0)
  }

  scrollEnd = () => {
    this.setTimeout(() => {
      this.setState({ isScrolling: false })
      this.start()
    }, this.props.marqueeDelay || 3000)
  }

  resetScroll = () => {
    this.scrollBegin()
    this.scrollEnd()
  }

  render() {
    const { style, children, repeatSpacer, scroll, shouldAnimateTreshold, disabled, ... props } = this.props
    const { animating, contentFits, isScrolling } = this.state
    const additionalContainerStyle = {
      // This is useful for shouldAnimateTreshold only:
      // we use flex: 1 to make the container take all the width available
      // without this, if the children have a width smaller that this component's parent's,
      // the container would have the width of the children (the text)
      // In this case, it would be impossible to determine if animating is necessary based on the width of the container
      // (contentFits in calculateMetrics() would always be true)
      flex: shouldAnimateTreshold ? 1 : undefined
    }
    const animatedText = disabled ? null : (
      <ScrollView
        ref={c => (this.containerRef = c)}
        horizontal
        scrollEnabled={scroll ? !this.state.contentFits : false}
        scrollEventThrottle={16}
        onScrollBeginDrag={this.scrollBegin}
        onScrollEndDrag={this.scrollEnd}
        showsHorizontalScrollIndicator={false}
        style={[StyleSheet.absoluteFillObject, I18nManager.isRTL ? { flexDirection: 'row-reverse' } : null ]}
        display={animating ? 'flex' : 'none'}
        onContentSizeChange={() => this.calculateMetrics()}
      >
        <Animated.Text
          ref={c => (this.textRef = c)}
          numberOfLines={1}
          {... props}
          style={[style, { transform: [{ translateX: this.animatedValue }], width: null }]}
        >
          {this.props.children}
        </Animated.Text>
        {!contentFits && !isScrolling
          ? <View style={{ paddingLeft: repeatSpacer }}>
            <Animated.Text
              numberOfLines={1}
              {... props}
              style={[style, { transform: [{ translateX: this.animatedValue }], width: null }]}
            >
              {this.props.children}
            </Animated.Text>
          </View> : null }
      </ScrollView>
    );
    return (
      <View style={[styles.container, additionalContainerStyle]}>
        <Text
          {...props}
          numberOfLines={1}
          style={[style, { opacity: animating ? 0 : 1 }]}
        >
          {this.props.children}
        </Text>
        {animatedText}
      </View>
    )
  }

}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden'
  }
})
