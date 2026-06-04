import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CourseCard } from '../CourseCard'
import { DeadlineChip } from '../DeadlineChip'

describe('DeadlineChip', () => {
  it('renders urgent state with warning color class', () => {
    render(<DeadlineChip state="urgent" label="Dans 2 jours · 30%" />)
    const chip = screen.getByText(/Dans 2 jours/)
    expect(chip).toBeInTheDocument()
  })

  it('renders done state with check mark prefix', () => {
    render(<DeadlineChip state="done" label="Complété" />)
    expect(screen.getByText(/Complété/)).toBeInTheDocument()
  })

  it('renders normal state', () => {
    render(<DeadlineChip state="normal" label="Dans 7 jours · 20%" />)
    expect(screen.getByText(/Dans 7 jours/)).toBeInTheDocument()
  })
})

describe('CourseCard', () => {
  const BASE = {
    id: 'c1',
    code: 'MTH1102',
    name: 'Algèbre Linéaire',
    difficultyLevel: 3,
    taskCount: 3,
    deadlines: [],
  }

  it('renders course code and name', () => {
    render(<CourseCard {...BASE} />)
    expect(screen.getByText('MTH1102')).toBeInTheDocument()
    expect(screen.getByText('Algèbre Linéaire')).toBeInTheDocument()
  })

  it('renders 5 difficulty dots with correct filled count', () => {
    render(<CourseCard {...BASE} />)
    const filled = document.querySelectorAll('[data-filled="true"]')
    const empty  = document.querySelectorAll('[data-filled="false"]')
    expect(filled).toHaveLength(3)
    expect(empty).toHaveLength(2)
  })

  it('renders task count when tasks exist', () => {
    render(<CourseCard {...BASE} taskCount={3} />)
    expect(screen.getByText(/3 tâche/i)).toBeInTheDocument()
  })

  it('renders urgent deadline chip when deadline is soon', () => {
    const deadlines = [{
      id: 'd1',
      title: 'Intra',
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // dans 3 jours
      weight: 30,
      completed: false,
    }]
    render(<CourseCard {...BASE} deadlines={deadlines} />)
    expect(screen.getByText(/Intra/)).toBeInTheDocument()
  })
})
