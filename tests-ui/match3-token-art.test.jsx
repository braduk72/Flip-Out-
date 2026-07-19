import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import Match3TokenImage from '../src/match3/Match3TokenImage.jsx'
import { MATCH3_TOKEN_CROPS } from '../src/match3/tokenCrops.js'
import { isMatch3TokenReviewRequest } from '../src/match3/tokenReviewAccess.js'
import Match3TokenReview from '../src/screens/Match3TokenReview.jsx'
import Match3Preview from '../src/ui/Match3Preview.jsx'

test('development token review shows every crop at all four decision sizes', () => {
  render(<Match3TokenReview onBack={vi.fn()}/>)
  expect(screen.getByRole('heading', { name: /match-3 token legibility/i })).toBeInTheDocument()
  expect(document.querySelectorAll('[data-review-size="full"]')).toHaveLength(6)
  expect(document.querySelectorAll('[data-review-size="board"]')).toHaveLength(6)
  expect(document.querySelectorAll('[data-review-size="small"]')).toHaveLength(6)
  expect(document.querySelectorAll('[data-review-size="reduced"]')).toHaveLength(6)
  expect(document.querySelectorAll('[data-review-status="approved"]')).toHaveLength(6)
  for (const token of MATCH3_TOKEN_CROPS) expect(document.querySelectorAll(`[data-source-card-id="${token.sourceCardId}"]`).length).toBeGreaterThan(0)
})

test('review access is limited to an explicit query on development hosts', () => {
  expect(isMatch3TokenReviewRequest({ hostname: 'dev.flipout.gizmogames.uk', search: '?dev=match3-tokens' }, false)).toBe(true)
  expect(isMatch3TokenReviewRequest({ hostname: 'localhost', search: '?dev=match3-tokens' }, false)).toBe(true)
  expect(isMatch3TokenReviewRequest({ hostname: 'example.com', search: '?dev=match3-tokens' }, false)).toBe(false)
  expect(isMatch3TokenReviewRequest({ hostname: 'dev.flipout.gizmogames.uk', search: '' }, false)).toBe(false)
})

test('token image uses its explicit fallback asset after a load error', () => {
  render(<Match3TokenImage tokenId="sun"/>)
  const image = screen.getByRole('img', { name: /golden retriever card portrait/i })
  expect(image.getAttribute('src')).toBe('/ui/match3/card-tokens/golden-retriever.webp')
  fireEvent.error(image)
  expect(image.getAttribute('src')).toBe('/images/back.webp')
})

test('live Home preview uses card-derived token assets instead of geometric SVGs', () => {
  render(<Match3Preview paused seed={20260719}/>)
  const tokenImages = document.querySelectorAll('[data-token-id]')
  expect(tokenImages.length).toBeGreaterThan(0)
  for (const image of tokenImages) {
    expect(image.getAttribute('src')).toContain('/ui/match3/card-tokens/')
    expect(image.getAttribute('src')).not.toMatch(/token-(sun|moon|leaf|drop|star|gem)\.svg/)
  }
})
