import { Component } from 'react';
export default class ErrorBoundary extends Component {
  state = { err: null };
  static getDerivedStateFromError(err) { return { err }; }
  render() {
    if (!this.state.err) return this.props.children;
    return (
      <div className="grid min-h-[60vh] place-items-center p-8 text-center">
        <div>
          <h1 className="text-2xl font-bold">Something went wrong</h1>
          <p className="mt-2 text-mute">Please reload the page. If it keeps happening, reset local data from Admin → Settings.</p>
          <button className="btn-primary mt-5" onClick={() => location.reload()}>Reload</button>
        </div>
      </div>
    );
  }
}
