import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Timeline } from '../Timeline'
import type { TimelineBlock } from '../Timeline'

const BLOCKS: TimelineBlock[] = [
  { id: '1', type: 'study',    startTime: '09:00', endTime: '11:00', title: 'Algèbre Linéaire', subtitle: 'Active Recall' },
  { id: '2', type: 'fitness',  startTime: '11:30', endTime: '12:30', title: 'Push Day' },
  { id: '3', type: 'recovery', startTime: '13:00', endTime: '13:20', title: 'Sieste' },
]

describe('Timeline', () => {
  it('renders all block titles', () => {
    render(<Timeline blocks={BLOCKS} startHour={8} endHour={22} />)
    expect(screen.getByText('Algèbre Linéaire')).toBeInTheDocument()
    expect(screen.getByText('Push Day')).toBeInTheDocument()
    expect(screen.getByText('Sieste')).toBeInTheDocument()
  })

  it('renders hour labels at start and end', () => {
    render(<Timeline blocks={BLOCKS} startHour={8} endHour={22} />)
    expect(screen.getByText('08:00')).toBeInTheDocument()
    expect(screen.getByText('22:00')).toBeInTheDocument()
  })

  it('renders the now indicator when nowMinutes is in range', () => {
    // 12h30 = 750min — in range [8h=480, 22h=1320]
    render(<Timeline blocks={BLOCKS} startHour={8} endHour={22} nowMinutes={750} />)
    expect(screen.getByTestId('timeline-now')).toBeInTheDocument()
  })

  it('does not render the now indicator when outside range', () => {
    // 6h = 360min — before 8h
    render(<Timeline blocks={BLOCKS} startHour={8} endHour={22} nowMinutes={360} />)
    expect(screen.queryByTestId('timeline-now')).not.toBeInTheDocument()
  })
})
