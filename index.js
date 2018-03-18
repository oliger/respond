import { Component, render, createElement } from './respond';

class App extends Component {
  constructor(props) {
    super(props);

    this.state = { count: 0 };
  }

  increment() {
    this.setState({ count: this.state.count + 1 });
  }

  decrement() {
    this.setState({ count: this.state.count - 1 });
  }

  render() {
    return (
      <div>
        <h1>Count {this.state.count}</h1>
        <button onClick={e => this.increment()}>Increment</button>
        <button onClick={e => this.decrement()}>Decrement</button>
      </div>
    );
  }
}

render(<App />, document.getElementById('container'));
