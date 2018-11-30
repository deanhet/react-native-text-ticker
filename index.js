import * as React                 from 'react'
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
import LinearGradient             from 'react-native-linear-gradient'

const { UIManager } = NativeModules

export default class TextMarquee extends React.PureComponent {

  static propTypes = {
    style:             Text.propTypes.style,
    duration:          PropTypes.number,
    loop:              PropTypes.bool,
    bounce:            PropTypes.bool,
    scroll:            PropTypes.bool,
    marqueeOnMount:    PropTypes.bool,
    marqueeDelay:      PropTypes.number,
    useNativeDriver:   PropTypes.bool,
    onMarqueeComplete: PropTypes.func,
    children:          PropTypes.string,
    repeatSpacer:      PropTypes.number,
    easing:            PropTypes.func,
    darkTheme:         PropTypes.bool
  }

  static defaultProps = {
    style:             {},
    loop:              true,
    bounce:            true,
    scroll:            true,
    marqueeOnMount:    true,
    marqueeDelay:      0,
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
  
  componentWillReceiveProps(nextProps){
    if(this.props.children !== nextProps.children){
      this.calculateMetrics()
    }
  }

  startAnimation = (timeDelay) => {
    if (this.state.animating) {
      this.stopAnimation()
    }
    this.start(timeDelay)
  }

  animateScroll = () => {
    const {
      duration,
      marqueeDelay,
      loop,
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
    const {duration, marqueeDelay, loop, useNativeDriver, easing, children} = this.props
    this.setTimeout(() => {
      Animated.sequence([
        Animated.timing(this.animatedValue, {
          toValue:         -this.distance - 10,
          duration:        duration || children.length * 50,
          easing:          easing,
          useNativeDriver: useNativeDriver
        }),
        Animated.timing(this.animatedValue, {
          toValue:         10,
          duration:        duration || children.length * 50,
          easing:          easing,
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
        const contentFits = this.distance <= 1

        this.setState({
          // Is 1 instead of 0 to get round rounding errors from:
          // https://github.com/facebook/react-native/commit/a534672
          contentFits:  contentFits,
          shouldBounce: this.distance < this.containerWidth / 8
        }, () => {
          if(contentFits){
            this.stopAnimation()
          }else {
            this.startAnimation()
          }
        })
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
    const { style, darkTheme, children, repeatSpacer, scroll, ... props } = this.props
    const { animating, contentFits, isScrolling } = this.state

    return <View style={[styles.container]}>
      <Text
        {...props}
        numberOfLines={1}
        style={[style, { opacity: animating ? 0 : 1}]}>
        {this.props.children}
      </Text>
      <View style={{...StyleSheet.absoluteFillObject, opacity: animating ? 1 : 0}}>
        <ScrollView
          ref={c => (this.containerRef = c)}
          horizontal
          scrollEnabled={scroll ? !this.state.contentFits : false}
          scrollEventThrottle={16}
          onScroll={this.onScroll}
          showsHorizontalScrollIndicator={false}
          style={[{opacity: animating ? 1 : 0,}, styles.animatingContainer]}
          onContentSizeChange={() => this.calculateMetrics()}
          onLayout={() => this.calculateMetrics()}>
          <Animated.Text
            ref={c => (this.textRef = c)}
            numberOfLines={1}
            {... props}
            style={[style, { transform: [{ translateX: this.animatedValue }], width: null }]}>
            {this.props.children}
          </Animated.Text>

          {!contentFits && !isScrolling
            ? <View style={{ paddingLeft: repeatSpacer }}>
              <Animated.Text
                numberOfLines={1}
                {... props}
                style={[style, { transform: [{ translateX: this.animatedValue }], width: null }]}>
                {this.props.children}
              </Animated.Text>
            </View> : null }
        </ScrollView>
        <LinearGradient start={{x: 0, y: 0}} end={{x: 1, y: 0}} locations={[.0, .02, .75, .98, 1]} colors={darkTheme ? colors.darkTheme : colors.lightTheme} style={{...StyleSheet.absoluteFillObject}}/>
      </View>
    </View>
  }

}

const colors = {
  lightTheme: ['white', 'rgba(255, 255, 255, .00)', 'rgba(255, 255, 255, .00)', 'rgba(255, 255, 255, 00)', 'white'],
  darkTheme: ['black', 'rgba(00, 00, 00, .00)', 'rgba(00, 00, 00, .00)', 'rgba(00, 00, 00, 0)', 'black']
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden'
  },
  
  animatingContainer: {
    ...StyleSheet.absoluteFillObject
  },
})
