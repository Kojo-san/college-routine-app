import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EtatCard } from '../EtatCard'

const BASE_PROPS = {
  date: 'Lundi 3 juin',
  physical: { recovery: 82, physicalFatigue: 18, sleepDebt: 0 },
  cognitive: { focus: 74, cognitiveFatigue: 26, stress: 30, motivation: 88 },
  sleep: { durationHours: 7.33, efficiency: 0.84 },
}

describe('EtatCard', () => {
  it('renders the date', () => {
    render(<EtatCard {...BASE_PROPS} />)
    expect(screen.getByText(/Lundi 3 juin/)).toBeInTheDocument()
  })

  it('renders the PHYSIQUE section with recovery gauge', () => {
    render(<EtatCard {...BASE_PROPS} />)
    expect(screen.getByText(/physique/i)).toBeInTheDocument()
    // ScoreGauge aria-label pour recovery
    expect(screen.getByRole('progressbar', { name: /récupération/i })).toBeInTheDocument()
  })

  it('renders the COGNITIF section with focus gauge', () => {
    render(<EtatCard {...BASE_PROPS} />)
    expect(screen.getByText(/cognitif/i)).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: /focus/i })).toBeInTheDocument()
  })

  it('renders sleep summary with duration and efficiency', () => {
    render(<EtatCard {...BASE_PROPS} />)
    // 7.33h → "7h20"  (0.33 * 60 ≈ 20)
    expect(screen.getByText(/7h20/i)).toBeInTheDocument()
    expect(screen.getByText(/84%/i)).toBeInTheDocument()
  })
})
