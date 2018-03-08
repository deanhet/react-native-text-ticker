import React, { PureComponent } from 'react'
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity
} from 'react-native'
import TextMarquee from './index'

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

        <TextMarquee marqueeOnMount={false} ref={c => this.marqueeRef = c}>
          Super long piece of text is long. The quick brown fox jumps over the lazy dog.
        </TextMarquee>
        <Spacer />
        <TextMarquee>
          Super long piece of text is long. The quick brown fox jumps over the lazy dog.
        </TextMarquee>
        <Spacer />
        <TextMarquee >
          This fits in its container and wont scroll
        </TextMarquee>
        <Spacer />
        <TextMarquee >
          This is an example that's only slightly longer so it bounces sides
        </TextMarquee>
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
