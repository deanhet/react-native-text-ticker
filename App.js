import React, { PureComponent } from 'react'
import { 
  Animated, 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  NativeModules, 
  findNodeHandle 
} from 'react-native'

const { UIManager } = NativeModules

class TextMarquee extends PureComponent {

  static defaultProps = {
    style:             {},
    duration:          5000,
    loop:              true,
    marqueeOnStart:    false,
    marqueeDelay:      0,
    marqueeResetDelay: 0,
    onMarqueeComplete: () => {},
    useNativeDriver:   true
  }

  animatedValue = new Animated.Value(0)
  contentFits = false
  distance = null;
  textRef = null;
  containerRef = null;

  state = {
    animating: false
  }

  componentDidMount() {
    this.invalidateMetrics()
    const { marqueeDelay, marqeeOnStart } = this.props
    // TODO: use marqueeOnStart
    if (true) {
      this.startAnimation(marqueeDelay)
    }
    // this.animatedValue.addListener((e) => console.log(e))
  }

  resetAnimation() {
    const marqueeResetDelay = Math.max(100, this.props.marqueeResetDelay)
    this.animatedValue.setValue(this.containerWidth)
    this.setState({ animating: false }, () => {
      this.startAnimation(marqueeResetDelay)
    })
  }

  startAnimation = (timeDelay) => {
    if (this.state.animating) {
      return
    }
    console.log('in startAnimation')
    this.start(timeDelay)
  }

  animate = () => {
    Animated.timing(this.animatedValue, {
      toValue:         -this.distance - this.containerWidth,
      duration:        this.props.duration,
      useNativeDriver: true
    }).start(({ finished }) => {
      if (finished) {
        this.animatedValue.setValue(this.containerWidth)
        this.animate()
      }
    })
  }

  start = async (timeDelay) => {
    const { duration, loop, onMarqueeComplete, useNativeDriver } = this.props 
    this.setState({ animating: true })
    this.setTimeout(async () => {
      await this.calculateMetrics()
      if (!this.contentFits) {
        this.animate()
      }
    }, 100)
  }

  stop() {
    this.animatedValue.setValue(0)
    this.setState({ animating: false })
  }
  
  async calculateMetrics() {
    return new Promise(async (resolve, reject) => {
      try {
        const measureWidth = node => 
          new Promise(resolve => {
            UIManager.measure(findNodeHandle(node), (x, y, w) => {
              console.log('Width: ' + w)
              return resolve(w)
            })
          })
        
        const [containerWidth, textWidth] = await Promise.all([
          measureWidth(this.containerRef),
          measureWidth(this.textRef)
        ])
  
        this.containerWidth = containerWidth
        this.distance = textWidth - containerWidth
        this.contentFits = this.distance < 0
        console.log(`distance: ${this.distance}, contentFits: ${this.contentFits}`)
        resolve([])

      } catch (error) {
        console.warn(error)
      }
    })
  }

  invalidateMetrics = () => {
    this.distance = null
    this.contentFits = false
  }

  clearTimeout() {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
      // console.log("Currently running timeout is cleared!!!");
    }
  }

  setTimeout(fn: Function, time: number = 0) {
    this.clearTimeout()
    this.timer = setTimeout(fn, time)
  }
  

  render() {
    const { children, style, ... rest } = this.props
    const { animating } = this.state
    // const { width, height } = StyleSheet.flatten(style)
    return (
      <View style={[styles.container]}>
        <Text 
          {...rest} 
          numberOfLines={1}
          style={[style, { opacity: animating ? 0 : 1 }]}
        >
          {children}
        </Text>
        <ScrollView
          ref={c => (this.containerRef = c)}
          horizontal
          scrollEnabled={false}
          showsHorizontalScrollIndicator={false}
          style={StyleSheet.absoluteFillObject}
          display={animating ? 'flex' : 'none'}
          onContentSizeChange={() => this.calculateMetrics()}
        >
          <Animated.Text
            ref={c => (this.textRef = c)}
            numberOfLines={1}
            {... rest}
            style={[style, { transform: [{ translateX: this.animatedValue }], width: null }]}
          >
            {children}
          </Animated.Text>
        </ScrollView>
      </View>
    )
  }

}

export default class App extends React.Component {

  render() {
    return (
      <View style={astyles.container}>
        <TextMarquee>Super long piece of text is long. The quick brown fox jumps over the lazy dog.</TextMarquee>
      </View>
    )
  }

}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden'
  }
})

const astyles = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: '#fff',
    alignItems:      'center',
    justifyContent:  'center'
  }
})
