import React, { PureComponent } from 'react'
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
  ScrollView,
  NativeModules,
  findNodeHandle
} from 'react-native'
import PropTypes from 'prop-types'

const { UIManager } = NativeModules

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
    children:          PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.array
    ]),
    repeatSpacer:    PropTypes.number,
    easing:          PropTypes.func
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
    easing:            Easing.ease
  }

  animatedValue = new Animated.Value(0)
  distance = null
  textRef = null
  containerRef = null

  state = {
    animating:    false,
    contentFits:  false,
    shouldBounce: false,
    isScrolling:  false
  }

  componentDidMount() {
    this.invalidateMetrics()
    const { marqueeDelay, marqueeOnMount } = this.props
    if (marqueeOnMount) {
      this.startAnimation(marqueeDelay)
    }
  }

  componentWillUnmount() {
    this.stopAnimation();
    // always stop timers when unmounting, common source of crash
    this.clearTimeout();
  }

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
      onMarqueeComplete
    } = this.props
    this.setTimeout(() => {
      Animated.timing(this.animatedValue, {
        toValue:         -this.textWidth - repeatSpacer,
        duration:        duration || children.length * 150,
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
      })
    }, marqueeDelay)
  }

  animateBounce = () => {
    const {duration, marqueeDelay, loop, isInteraction, useNativeDriver, easing, children} = this.props
    this.setTimeout(() => {
      Animated.sequence([
        Animated.timing(this.animatedValue, {
          toValue:         -this.distance - 10,
          duration:        duration || children.length * 50,
          easing:          easing,
          isInteraction:   isInteraction,
          useNativeDriver: useNativeDriver
        }),
        Animated.timing(this.animatedValue, {
          toValue:         10,
          duration:        duration || children.length * 50,
          easing:          easing,
          isInteraction:   isInteraction,
          useNativeDriver: useNativeDriver
        })
      ]).start(({finished}) => {
        if (loop) {
          this.animateBounce()
        }
      })
    }, marqueeDelay)
  }

  start = async (timeDelay) => {
    this.setState({ animating: true })
    this.setTimeout(async () => {
      await this.calculateMetrics()
      if (!this.state.contentFits) {
        if (this.state.shouldBounce && this.props.bounce) {
          this.animateBounce()
        } else {
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
    return new Promise(async (resolve, reject) => {
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
        this.distance = textWidth - containerWidth

        this.setState({
          // Is 1 instead of 0 to get round rounding errors from:
          // https://github.com/facebook/react-native/commit/a534672
          contentFits:  this.distance <= 1,
          shouldBounce: this.distance < this.containerWidth / 8
        })
        // console.log(`distance: ${this.distance}, contentFits: ${this.state.contentFits}`)
        resolve([])
      } catch (error) {
        console.warn('react-native-text-ticker: could not calculate metrics', error);
      }
    })
  }

  invalidateMetrics = () => {
    this.distance = null
    this.setState({ contentFits: false })
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

  onScroll = () => {
    this.clearTimeout()
    this.setState({ isScrolling: true })
    this.animatedValue.setValue(0)
    this.setTimeout(() => {
      this.setState({ isScrolling: false })
      this.start()
    }, this.props.marqueeDelay || 3000)
  }

  render() {
    const { style, children, repeatSpacer, scroll, ... props } = this.props
    const { animating, contentFits, isScrolling } = this.state
    return (
      <View style={[styles.container]}>
        <Text
          {...props}
          numberOfLines={1}
          style={[style, { opacity: animating ? 0 : 1 }]}
        >
          {this.props.children}
        </Text>
        <ScrollView
          ref={c => (this.containerRef = c)}
          horizontal
          scrollEnabled={scroll ? !this.state.contentFits : false}
          scrollEventThrottle={16}
          onScroll={this.onScroll}
          showsHorizontalScrollIndicator={false}
          style={StyleSheet.absoluteFillObject}
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
      </View>
    )
  }

}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden'
  }
})

