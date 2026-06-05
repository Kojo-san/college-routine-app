import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { GoogleCalendarButton } from '../GoogleCalendarButton'

// Shared mutable ref so individual tests can control search params
let currentParams = new URLSearchParams()

vi.mock('next/navigation', () => ({
  useSearchParams: () => currentParams,
}))

beforeEach(() => {
  currentParams = new URLSearchParams()
})

// ─── Not connected ────────────────────────────────────────────────────────────

describe('GoogleCalendarButton — not connected', () => {
  it('renders a "Connecter Google Agenda" link when not connected', () => {
    render(<GoogleCalendarButton connected={false} />)
    const link = screen.getByRole('link', { name: /connecter google agenda/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/api/auth/google')
  })
})

// ─── gcal_error query param ───────────────────────────────────────────────────

describe('GoogleCalendarButton — gcal_error param', () => {
  it('renders a refusal message when gcal_error is present in URL', () => {
    currentParams = new URLSearchParams('gcal_error=access_denied')
    render(<GoogleCalendarButton />)
    expect(screen.getByText(/connexion google refusée/i)).toBeInTheDocument()
  })
})

// ─── Push flow ────────────────────────────────────────────────────────────────

describe('GoogleCalendarButton — push flow', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    fetchMock.mockReset()
  })

  it('tracer: renders "Exporter vers Google Agenda" button when connected and idle', () => {
    render(<GoogleCalendarButton connected={true} />)
    expect(
      screen.getByRole('button', { name: /exporter vers google agenda/i }),
    ).toBeInTheDocument()
  })

  it('disables the button and shows loading text while the push is in progress', async () => {
    fetchMock.mockReturnValue(new Promise(() => {})) // never resolves

    render(<GoogleCalendarButton connected={true} />)
    fireEvent.click(screen.getByRole('button', { name: /exporter vers google agenda/i }))

    const btn = await screen.findByRole('button')
    expect(btn).toBeDisabled()
    expect(btn.textContent).toMatch(/cours|chargement|…/i)
  })

  it('shows a success message with block count after a successful push', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ data: { pushed: 3 } }),
    })

    render(<GoogleCalendarButton connected={true} />)
    fireEvent.click(screen.getByRole('button', { name: /exporter/i }))

    await waitFor(() => {
      expect(screen.getByText(/3 blocs/i)).toBeInTheDocument()
      expect(screen.getByText(/google agenda/i)).toBeInTheDocument()
    })
  })

  it('shows singular success message for exactly 1 block', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ data: { pushed: 1 } }),
    })

    render(<GoogleCalendarButton connected={true} />)
    fireEvent.click(screen.getByRole('button', { name: /exporter/i }))

    await waitFor(() => {
      expect(screen.getByText(/1 bloc exporté vers google agenda/i)).toBeInTheDocument()
    })
  })

  it('shows error message when the API returns an error JSON', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Token Google expiré. Reconnectez votre compte Google Agenda.' }),
    })

    render(<GoogleCalendarButton connected={true} />)
    fireEvent.click(screen.getByRole('button', { name: /exporter/i }))

    await waitFor(() => {
      expect(screen.getByText(/token google expiré/i)).toBeInTheDocument()
    })
  })

  it('shows a generic error message when the API returns a non-JSON body (server crash)', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => { throw new SyntaxError('Unexpected token < in JSON') },
    })

    render(<GoogleCalendarButton connected={true} />)
    fireEvent.click(screen.getByRole('button', { name: /exporter/i }))

    await waitFor(() => {
      expect(screen.getByText(/erreur/i)).toBeInTheDocument()
    })
  })

  it('shows a network error message when fetch itself throws', async () => {
    fetchMock.mockRejectedValue(new Error('Failed to fetch'))

    render(<GoogleCalendarButton connected={true} />)
    fireEvent.click(screen.getByRole('button', { name: /exporter/i }))

    await waitFor(() => {
      expect(screen.getByText(/réseau|erreur/i)).toBeInTheDocument()
    })
  })
})
