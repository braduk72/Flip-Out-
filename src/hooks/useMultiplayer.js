import { useState, useEffect, useRef, useCallback } from 'react'
import { io } from 'socket.io-client'

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'

export function useMultiplayer() {
  const socketRef            = useRef(null)
  const mySocketId           = useRef(null)
  const oppFlipHandlerRef    = useRef(null)
  const specialResultHandler = useRef(null)

  const [connected,       setConnected]       = useState(false)
  const [status,          setStatus]          = useState('idle')
  // idle | creating | waiting | searching | starting | playing | finished | error
  const [roomCode,        setRoomCode]        = useState(null)
  const [isHost,          setIsHost]          = useState(false)
  const [opponentPortrait, setOpponentPortrait] = useState(1)
  const [error,           setError]           = useState(null)
  const [prebuiltCards,   setPrebuiltCards]   = useState(null)
  const [deckId,          setDeckId]          = useState(null)
  const [difficulty,      setDifficulty]      = useState('Medium')
  const [opponentLeft,    setOpponentLeft]    = useState(false)

  function getSocket() {
    if (socketRef.current) return socketRef.current

    const sock = io(`${SERVER_URL}/flipout`, {
      transports: ['websocket'],
      autoConnect: false,
    })

    sock.on('connect',    () => { setConnected(true);  mySocketId.current = sock.id })
    sock.on('disconnect', () => { setConnected(false) })

    sock.on('fo:created', ({ code }) => {
      setRoomCode(code)
      setStatus('waiting')
    })

    sock.on('fo:searching', () => setStatus('searching'))
    sock.on('fo:cancelled', () => setStatus('idle'))

    sock.on('fo:game_start', ({ isHost: host, yourTurn, opponentPortrait: op, deckId: did, difficulty: diff, roomCode: code }) => {
      setIsHost(host)
      setOpponentPortrait(op)
      setDeckId(did)
      setDifficulty(diff)
      setRoomCode(code)
      setStatus('starting')
      // yourTurn is used by App to decide who goes first — stored via callback
      sock._yourTurn = yourTurn
    })

    // Guest receives board from host (via server relay)
    sock.on('fo:board', ({ cards }) => {
      setPrebuiltCards(cards)
      setStatus('playing')
    })

    // Opponent flipped a card
    sock.on('fo:opp_flip', ({ index }) => {
      oppFlipHandlerRef.current?.(index)
    })

    // Opponent's special card seed arrives
    sock.on('fo:special_result', ({ index, seed }) => {
      specialResultHandler.current?.({ index, seed })
    })

    // Turn changed (opponent matched, so they go again — or no-match, so we go)
    sock.on('fo:turn_change', ({ nextId }) => {
      // Clients derive turn from game state — this is a sanity signal only
      sock._myTurn = nextId === sock.id
    })

    sock.on('fo:game_over', () => setStatus('finished'))

    sock.on('fo:opponent_left', () => {
      setOpponentLeft(true)
      setStatus('finished')
    })

    sock.on('fo:error', ({ msg }) => {
      setError(msg)
      setStatus('error')
    })

    socketRef.current = sock
    return sock
  }

  const createRoom = useCallback(({ portrait, deckId, difficulty }) => {
    const sock = getSocket()
    if (!sock.connected) sock.connect()
    setStatus('creating')
    setError(null)
    sock.emit('fo:create', { portrait, deckId, difficulty })
  }, [])

  const joinRoom = useCallback(({ code, portrait }) => {
    const sock = getSocket()
    if (!sock.connected) sock.connect()
    setError(null)
    sock.emit('fo:join', { code: code.toUpperCase(), portrait })
  }, [])

  const matchmake = useCallback(({ portrait, deckId, difficulty }) => {
    const sock = getSocket()
    if (!sock.connected) sock.connect()
    setStatus('searching')
    setError(null)
    sock.emit('fo:matchmake', { portrait, deckId, difficulty })
  }, [])

  const cancelMatchmake = useCallback(() => {
    socketRef.current?.emit('fo:cancel_matchmake')
    setStatus('idle')
  }, [])

  // Host sends their generated card array so both start with identical layout
  const sendBoard = useCallback((cards) => {
    socketRef.current?.emit('fo:board', { cards })
    setStatus('playing')
  }, [])

  const sendFlip = useCallback((index) => {
    socketRef.current?.emit('fo:flip', { index })
  }, [])

  // Active player sends computed random values for a special card effect
  const sendSpecialResult = useCallback(({ index, seed }) => {
    socketRef.current?.emit('fo:special_result', { index, seed })
  }, [])

  const sendTurnResult = useCallback((matched) => {
    socketRef.current?.emit('fo:turn_result', { matched })
  }, [])

  const sendGameOver = useCallback((playerScore, opponentScore) => {
    socketRef.current?.emit('fo:game_over', { playerScore, opponentScore })
  }, [])

  const setOppFlipHandler    = useCallback((fn) => { oppFlipHandlerRef.current    = fn }, [])
  const setSpecialResultHandler = useCallback((fn) => { specialResultHandler.current = fn }, [])

  const disconnect = useCallback(() => {
    socketRef.current?.disconnect()
    socketRef.current = null
    setConnected(false)
    setStatus('idle')
    setRoomCode(null)
    setPrebuiltCards(null)
    setOpponentLeft(false)
    setError(null)
  }, [])

  // Cleanup on unmount
  useEffect(() => () => { socketRef.current?.disconnect() }, [])

  return {
    // state
    connected, status, roomCode, isHost, opponentPortrait,
    error, prebuiltCards, deckId, difficulty, opponentLeft,
    active: status === 'playing',
    // actions
    createRoom, joinRoom, matchmake, cancelMatchmake,
    sendBoard, sendFlip, sendSpecialResult, sendTurnResult, sendGameOver,
    setOppFlipHandler, setSpecialResultHandler,
    disconnect,
    getYourTurn: () => socketRef.current?._yourTurn ?? true,
  }
}
