import React, { PureComponent } from 'react'
import { 
  Animated, 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  NativeModules, 
  findNodeHandle,
  TouchableOpacity
} from 'react-native'
import PropTypes from 'prop-types'

/* TODO:
- If text is only slightly wider than screen then bounce text instead
*/

const { UIManager } = NativeModules

class TextMarquee extends PureComponent {

  static propTypes = {
    style:           PropTypes.object,
    duration:        PropTypes.number,
    loop:            PropTypes.bool,
    marqueeOnMount:  PropTypes.bool,
    marqueeDelay:    PropTypes.number,
    useNativeDriver: PropTypes.bool,
    children:        PropTypes.string,
    repeatSpacer:    PropTypes.number
  }

  static defaultProps = {
    style:             {},
    loop:              true,
    marqueeOnMount:    true,
    marqueeDelay:      0,
    useNativeDriver:   true,
    repeatSpacer:    50
  }

  animatedValue = new Animated.Value(0)
  distance = null
  textRef = null
  containerRef = null

  state = {
    animating:   false,
    contentFits: true
  }

  componentDidMount() {
    this.invalidateMetrics()
    const { marqueeDelay, marqueeOnMount } = this.props
    // TODO: use marqueeOnStart
    if (marqueeOnMount) {
      this.startAnimation(marqueeDelay)
    }
  }

  startAnimation = (timeDelay) => {
    if (this.state.animating) {
      return
    }
    this.start(timeDelay)
  }

  animate = () => {
    const {duration, marqueeDelay, loop, useNativeDriver, repeatSpacer, children} = this.props 
    this.setTimeout(() => {
      Animated.timing(this.animatedValue, {
        toValue:         -this.textWidth - repeatSpacer,
        duration:        duration || children.length * 150,
        useNativeDriver: useNativeDriver
      }).start(({ finished }) => {
        if (finished) {
          if (loop) {
            this.animatedValue.setValue(0)
            this.animate()
          }
        }
      })
    }, marqueeDelay)
  }

  start = async (timeDelay) => {
    this.setState({ animating: true })
    this.setTimeout(async () => {
      await this.calculateMetrics()
      if (!this.state.contentFits) {
        this.animate()
      }
    }, 100)
  }

  stopAnimation() {
    this.animatedValue.setValue(0)
    this.setState({ animating: false })
  }
  
  async calculateMetrics() {
    return new Promise(async (resolve, reject) => {
      try {
        const measureWidth = node => 
          new Promise(resolve => {
            UIManager.measure(findNodeHandle(node), (x, y, w) => {
              // console.log('Width: ' + w)
              return resolve(w)
            })
          })
        
        const [containerWidth, textWidth] = await Promise.all([
          measureWidth(this.containerRef),
          measureWidth(this.textRef)
        ])
  
        this.containerWidth = containerWidth
        this.textWidth = textWidth
        this.distance = textWidth - containerWidth
        this.setState({ contentFits: this.distance < 0 })
        // console.log(`distance: ${this.distance}, contentFits: ${this.state.contentFits}`)
        resolve([])
      } catch (error) {
        console.warn(error)
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

  render() {
    const { style, children, repeatSpacer, ... props } = this.props
    const { animating, contentFits } = this.state
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
          scrollEnabled={false}
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
          {!contentFits
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

export default class App extends React.Component {

  render() {
    return (
      <View style={astyles.container}>
        <TouchableOpacity onPress={() => this.marquee.startAnimation()}>
          <Text>Start Animation</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => this.marquee.stopAnimation()}>
          <Text>Stop Animation</Text>
        </TouchableOpacity>

        <TextMarquee marqueeOnMount={false} ref={c => this.marquee = c}>
          Super long piece of text is long. The quick brown fox jumps over the lazy dog.
        </TextMarquee>

        <TextMarquee>
          Super long piece of text is long. The quick brown fox jumps over the lazy dog.
        </TextMarquee>
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
