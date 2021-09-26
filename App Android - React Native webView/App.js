import React, { Component } from 'react';
import { WebView } from 'react-native-webview';

class App extends Component {
  render() {
    return (
      <WebView
        injectedJavaScript={`document.getElementById('warning').remove()`}
        startInLoadingState={true}
        source={{ uri: 'https://script.google.com/macros/s/AKfycbx2vOrvFQ4ZyQEtefQR5I2At105yEeMR6HoxQ0RkcheBp7AgG0B_0xrs26y4z45OSc/exec' }}
        style={{ margin:0 }}
      />
      
    );
  }
}

export default App;
