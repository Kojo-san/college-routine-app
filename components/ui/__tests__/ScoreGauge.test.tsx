import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ScoreGauge } from '../ScoreGauge'

describe('ScoreGauge', () => {
  it('renders the numeric value', () => {
    render(<ScoreGauge value={82} accent="recovery" label="Récupération" />)
    expect(screen.getByText('82')).toBeInTheDocument()
  })

  it('has progressbar role with correct aria attributes', () => {
    render(<ScoreGauge value={74} accent="study" label="Focus" />)
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuenow', '74')
    expect(bar).toHaveAttribute('aria-valuemin', '0')
    expect(bar).toHaveAttribute('aria-valuemax', '100')
    expect(bar).toHaveAttribute('aria-label', 'Focus : 74')
  })

  it('fill width corresponds to the value percentage', () => {
    render(<ScoreGauge value={60} accent="fitness" label="Énergie" />)
    const fill = document.querySelector('[data-testid="gauge-fill"]') as HTMLElement
    expect(fill.style.width).toBe('60%')
  })
})
