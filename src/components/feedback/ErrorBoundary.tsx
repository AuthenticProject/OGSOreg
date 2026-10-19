import { Component, type ErrorInfo, type ReactNode } from 'react'
import { ErrorState } from './ErrorState'

interface Props {
  children: ReactNode
  fallbackTitle?: string
  fallbackMessage?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="py-8 px-4 max-w-2xl mx-auto">
          <ErrorState
            title={this.props.fallbackTitle || 'Terjadi Masalah Saat Memuat Halaman'}
            message={
              this.state.error?.message ||
              this.props.fallbackMessage ||
              'Sistem mendeteksi kendala pada data. Silakan coba muat ulang halaman ini.'
            }
            onRetry={this.handleReset}
          />
        </div>
      )
    }

    return this.props.children
  }
}
