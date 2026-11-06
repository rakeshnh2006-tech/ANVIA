import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Landing from '../pages/Landing'

describe('Landing page', () => {
  it('renders the ANVIA brand name', () => {
    render(<BrowserRouter><Landing /></BrowserRouter>)
    const headings = screen.getAllByText('ANVIA')
    expect(headings.length).toBeGreaterThan(0)
  })

  it('renders the main headline', () => {
    render(<BrowserRouter><Landing /></BrowserRouter>)
    expect(screen.getByText(/Understand Your Body/i)).toBeInTheDocument()
  })

  it('renders the Get Started link', () => {
    render(<BrowserRouter><Landing /></BrowserRouter>)
    const links = screen.getAllByRole('link', { name: /get started/i })
    expect(links.length).toBeGreaterThan(0)
  })

  it('renders the medical disclaimer', () => {
    render(<BrowserRouter><Landing /></BrowserRouter>)
    const elements = screen.getAllByText(/educational/i)
    expect(elements.length).toBeGreaterThan(0)
  })
})
