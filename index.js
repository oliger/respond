import { Component, render, createElement } from './respond';

class Title extends Component {
  render() {
    return <h1>{this.props.children}</h1>
  }
}

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
        <Title>Count {this.state.count}</Title>
        <button onClick={e => this.increment()}>Increment</button>
        <button onClick={e => this.decrement()}>Decrement</button>
      </div>
    );
  }
}

render(<App />, document.getElementById('container'));
