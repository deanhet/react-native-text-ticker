import React, { PureComponent } from 'react'
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity
} from 'react-native'
import TextTicker from 'react-native-text-ticker'



export default class App extends PureComponent {
  renderTresholdExample = () => {
    const overlayWidth = 40
    const lineHeight = 20
    const text = "This fits but there's this view at the right obstrucating the end."
    const example1 = "shouldAnimateTreshold={0} (default value):"
    const example2 = "shouldAnimateTreshold={40} (width of obstrucating view):"
    const example3 = "shouldAnimateTreshold={40} bounce={false}:"
    return (
      <View>
        <View style={[styles.shouldAnimateTresholdContainer]}>
          <Text style={{textAlign: 'center'}}>examples for the <Text style={{fontWeight: 'bold'}}>shouldAnimateTreshold</Text> prop:</Text>
        </View>
        <Text style={{fontWeight: 'bold'}}>{example1}</Text>
        <View style={[styles.shouldAnimateTresholdContainer]}>
          <TextTicker >
            {text}
          </TextTicker>
          <View style={[styles.overlayView, {width: overlayWidth, backgroundColor: 'red'}]} />
        </View>
        <Text style={{fontWeight: 'bold'}}>{example2}</Text>
        <View style={[styles.shouldAnimateTresholdContainer]}>
          <TextTicker shouldAnimateTreshold={overlayWidth}>
            {text}
          </TextTicker>
          <View style={[styles.overlayView, {width: overlayWidth, backgroundColor: 'green'}]} />
        </View>
        <Text style={{fontWeight: 'bold'}}>{example3}</Text>
        <View style={[styles.shouldAnimateTresholdContainer]}>
          <TextTicker bounce={false} shouldAnimateTreshold={overlayWidth}>
            {text}
          </TextTicker>
          <View style={[styles.overlayView, {width: overlayWidth, backgroundColor: 'green'}]} />
        </View>
      </View>
    )
  }

  render() {
    const Spacer = () => <View style={styles.spacer} />
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={() => this.marqueeRef.startAnimation()}>
          <Text>Start Animation</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => this.marqueeRef.stopAnimation()}>
          <Text>Stop Animation</Text>
        </TouchableOpacity>

        <TextTicker marqueeOnMount={false} ref={c => this.marqueeRef = c}>
          Super long piece of text is long. The quick brown fox jumps over the lazy dog.
        </TextTicker>
        <Spacer />
        <TextTicker onMarqueeComplete={() => console.log('Scroll Completed!')}>
          Super long piece of text is long. The quick brown fox jumps over the lazy dog.
        </TextTicker>
        <Spacer />
        <TextTicker >
          This fits in its container and wont scroll
        </TextTicker>
        <Spacer />
        <TextTicker >
          This is an example that's only slightly longer so it bounces sides
        </TextTicker>
        <Spacer />
        {this.renderTresholdExample()}
      </View>
    )
  }

}

const styles = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: '#fff',
    alignItems:      'center',
    justifyContent:  'center'
  },
  spacer: {
    width:             '85%',
    borderBottomWidth: 2,
    borderColor:       'grey',
    margin:            15
  },
  overlayView: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    opacity: 0.8,
  },
  shouldAnimateTresholdContainer: {
    marginBottom: 20,
    height: 20,
  }
})
