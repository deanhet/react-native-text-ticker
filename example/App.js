import React, { PureComponent } from 'react'
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity
} from 'react-native'
import TextTicker from 'react-native-text-ticker'

export default class App extends PureComponent {

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
  }
})
