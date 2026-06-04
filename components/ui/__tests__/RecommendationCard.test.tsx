import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RecommendationCard } from '../RecommendationCard'

const BASE_PROPS = {
  type: 'SLEEP' as const,
  message: 'Ta dette de sommeil est de 1h30. Déplace ta séance deep work à demain.',
  source: 'Walker, 2017',
  confidence: 0.87,
}

describe('RecommendationCard', () => {
  it('renders the message text', () => {
    render(<RecommendationCard {...BASE_PROPS} />)
    expect(screen.getByText(/dette de sommeil/i)).toBeInTheDocument()
  })

  it('renders bear-neon image at 48px', () => {
    render(<RecommendationCard {...BASE_PROPS} />)
    const img = screen.getByAltText('Bear Reco') as HTMLImageElement
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('width', '48')
  })

  it('renders source and confidence as percentage', () => {
    render(<RecommendationCard {...BASE_PROPS} />)
    expect(screen.getByText(/Walker, 2017/)).toBeInTheDocument()
    expect(screen.getByText(/87%/)).toBeInTheDocument()
  })

  it('renders CTA button when onAct is provided', async () => {
    const onAct = vi.fn()
    render(<RecommendationCard {...BASE_PROPS} onAct={onAct} />)
    const btn = screen.getByRole('button', { name: /faire/i })
    expect(btn).toBeInTheDocument()
    await userEvent.click(btn)
    expect(onAct).toHaveBeenCalledOnce()
  })

  it('does not render CTA button when onAct is absent', () => {
    render(<RecommendationCard {...BASE_PROPS} />)
    expect(screen.queryByRole('button', { name: /faire/i })).not.toBeInTheDocument()
  })
})
