import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() { return this.state.hasError ? <div className="p-6">Something went wrong.</div> : this.props.children; }
}
