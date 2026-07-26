import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  label: string;
};

type State = {
  error: Error | null;
};

export class SectionErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("A progressive section failed to render.", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800"
        >
          <h2 className="font-semibold">
            {this.props.label} could not be opened.
          </h2>
          <p className="mt-2 text-sm">{this.state.error.message}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white"
          >
            Reload the page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
