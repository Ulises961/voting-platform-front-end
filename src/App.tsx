import Navigation from './components/Navigation'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Container } from '@mui/material'

export default function App() {  
  return (
    <ErrorBoundary>
      <Navigation />
      <Container sx={{ mt: 4 }}>
        {/* Next.js will handle routing automatically through page.tsx files */}
      </Container>
    </ErrorBoundary>
  )
}