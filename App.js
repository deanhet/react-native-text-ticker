import React, { PureComponent } from 'react';
import { Animated, StyleSheet, Text, View, ScrollView } from 'react-native';

class TextMarquee extends PureComponent {

  state = {
    animating: false
  }

  animatedValue = new Animated.Value(0)

  render(){
    const { children, style, ...rest } = this.props
    const { animating } = this.state
    // const { width, height } = StyleSheet.flatten(style)
    return(
      <View style={[styles.container]}>
        <Text 
          {...rest} 
          numberOfLines={1}
          style={[style, { opacity: animating ? 0 : 1 }]}
        >
          {children}
        </Text>
        <ScrollView
          horizontal
          scrollEnabled={false}
          showsHorizontalScrollIndicator={false}
          style={StyleSheet.absoluteFillObject}
          display={animating ? 'flex' : 'none'}
        >
          <Animated.Text
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
        <TextMarquee style={{ backgroundColor: 'red' }}>Super long piece of text is long. The quick brown fox jumps over the lazy dog.</TextMarquee>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden'
  }
})

const astyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
