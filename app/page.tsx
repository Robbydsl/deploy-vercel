"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Pause, Play } from "lucide-react"

interface Zombie {
  id: number
  x: number
  y: number
  speed: number
  type: "male" | "female"
  isDying?: boolean
}

export default function ZombieGame() {
  const [score, setScore] = useState(0)
  const [zombies, setZombies] = useState<Zombie[]>([])
  const [gameStarted, setGameStarted] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [gameWon, setGameWon] = useState(false)
  const [femaleSpeedMultiplier, setFemaleSpeedMultiplier] = useState(1)
  const [globalSpeedMultiplier, setGlobalSpeedMultiplier] = useState(1)
  const zombieIdCounter = useRef(0)
  const maleAudioRef = useRef<HTMLAudioElement | null>(null)
  const femaleAudioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (score >= 1000 && gameStarted && !gameWon) {
      setGameWon(true)
      setIsPaused(true)
    }
  }, [score, gameStarted, gameWon])

  useEffect(() => {
    if (!gameStarted || isPaused) return

    const globalSpeedInterval = setInterval(() => {
      setGlobalSpeedMultiplier((prev) => Math.max(0.3, prev - 0.1))
    }, 10000)

    return () => clearInterval(globalSpeedInterval)
  }, [gameStarted, isPaused])

  useEffect(() => {
    if (!gameStarted || isPaused) return

    const speedIncreaseInterval = setInterval(() => {
      setFemaleSpeedMultiplier((prev) => prev + 0.2)
    }, 5000)

    return () => clearInterval(speedIncreaseInterval)
  }, [gameStarted, isPaused])

  useEffect(() => {
    if (!gameStarted || isPaused) return

    const maleSpawnInterval = setInterval(() => {
      const screenHeight = window.innerHeight
      const minY = screenHeight * 0.4
      const maxY = screenHeight * 0.7

      for (let i = 0; i < 3; i++) {
        const baseSpeed = 1 + Math.random() * 2

        const newZombie: Zombie = {
          id: zombieIdCounter.current++,
          x: -100,
          y: minY + Math.random() * (maxY - minY),
          speed: baseSpeed * globalSpeedMultiplier,
          type: "male",
        }

        setZombies((prev) => [...prev, newZombie])
      }
    }, 3000)

    return () => clearInterval(maleSpawnInterval)
  }, [gameStarted, isPaused, globalSpeedMultiplier])

  useEffect(() => {
    if (!gameStarted || isPaused) return

    const femaleSpawnInterval = setInterval(() => {
      const screenHeight = window.innerHeight
      const minY = screenHeight * 0.4
      const maxY = screenHeight * 0.7

      for (let i = 0; i < 2; i++) {
        const baseSpeed = (2 + Math.random() * 2) * femaleSpeedMultiplier

        const newZombie: Zombie = {
          id: zombieIdCounter.current++,
          x: -100,
          y: minY + Math.random() * (maxY - minY),
          speed: baseSpeed * globalSpeedMultiplier,
          type: "female",
        }

        setZombies((prev) => [...prev, newZombie])
      }

      if (femaleAudioRef.current) {
        femaleAudioRef.current.currentTime = 0
        femaleAudioRef.current.play().catch(() => {
          // Ignore audio play errors
        })
      }
    }, 5000)

    return () => clearInterval(femaleSpawnInterval)
  }, [gameStarted, isPaused, femaleSpeedMultiplier, globalSpeedMultiplier])

  useEffect(() => {
    if (!gameStarted || isPaused) return

    const moveInterval = setInterval(() => {
      setZombies((prev) => {
        const updated = prev.map((zombie) => ({
          ...zombie,
          x: zombie.x + zombie.speed,
        }))

        const filtered = updated.filter((zombie) => {
          if (zombie.x > window.innerWidth) {
            setScore((s) => Math.max(0, s - 2))
            return false
          }
          return true
        })

        return filtered
      })
    }, 16)

    return () => clearInterval(moveInterval)
  }, [gameStarted, isPaused])

  const handleZombieClick = useCallback((zombieId: number, zombieType: "male" | "female") => {
    setZombies((prev) => prev.map((z) => (z.id === zombieId ? { ...z, isDying: true } : z)))

    const audioRef = zombieType === "male" ? maleAudioRef : femaleAudioRef
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(() => {
        // Ignore audio play errors
      })
    }

    setTimeout(() => {
      setZombies((prev) => prev.filter((z) => z.id !== zombieId))
      setScore((s) => s + 1)
    }, 300)
  }, [])

  const startGame = () => {
    setGameStarted(true)
    setIsPaused(false)
    setGameWon(false)
    setScore(0)
    setZombies([])
    zombieIdCounter.current = 0
    setFemaleSpeedMultiplier(1)
    setGlobalSpeedMultiplier(1)
  }

  const resetGame = () => {
    setGameStarted(false)
    setIsPaused(false)
    setGameWon(false)
    setScore(0)
    setZombies([])
    zombieIdCounter.current = 0
    setFemaleSpeedMultiplier(1)
    setGlobalSpeedMultiplier(1)
  }

  const togglePause = () => {
    setIsPaused((prev) => !prev)
  }

  return (
    <div className="relative h-screen w-full overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-repeat-x"
        style={{
          backgroundImage: "url(/images/background.png)",
          backgroundSize: "auto 100%",
        }}
      />

      <audio ref={maleAudioRef} src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/zombie_groan-6BckQlWOWPszsNuWLVkQ2bc7YrBxL6.wav" preload="auto" />
      <audio ref={femaleAudioRef} src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/female_zombie.mp3-oOuurQqpe0WLXVug3NOBTIhnwEi2Zm.mp3" preload="auto" />

      <div className="absolute top-4 left-4 z-10 bg-black/70 px-6 py-3 rounded-lg">
        <p className="text-white text-2xl font-bold">Rialo: {score}$</p>
      </div>

      <div className="absolute top-4 right-4 z-10 flex gap-2">
        {gameStarted && !gameWon && (
          <Button
            onClick={togglePause}
            size="lg"
            variant="secondary"
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isPaused ? (
              <>
                <Play className="w-5 h-5 mr-2" />
                Resume
              </>
            ) : (
              <>
                <Pause className="w-5 h-5 mr-2" />
                Pause
              </>
            )}
          </Button>
        )}
        {!gameStarted ? (
          <Button onClick={startGame} size="lg" className="bg-green-600 hover:bg-green-700">
            Start Game
          </Button>
        ) : (
          <Button onClick={resetGame} size="lg" variant="destructive">
            Reset
          </Button>
        )}
      </div>

      {isPaused && !gameWon && (
        <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/50">
          <div className="bg-black/90 p-8 rounded-lg text-center">
            <h2 className="text-white text-4xl font-bold mb-4">PAUSED</h2>
            <p className="text-white text-lg mb-4">Click Resume to continue</p>
            <Button onClick={togglePause} size="lg" className="bg-blue-600 hover:bg-blue-700">
              <Play className="w-5 h-5 mr-2" />
              Resume Game
            </Button>
          </div>
        </div>
      )}

      {gameWon && (
        <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/70">
          <div className="bg-gradient-to-br from-green-900 to-green-700 p-12 rounded-lg text-center border-4 border-yellow-400 shadow-2xl">
            <h2 className="text-yellow-300 text-5xl font-bold mb-6">🎉 VICTORY! 🎉</h2>
            <p className="text-white text-2xl mb-4 leading-relaxed">Congratulations, you have won the game!</p>
            <p className="text-yellow-200 text-xl mb-8">and you are entitled to claim $Rialo</p>
            <Button onClick={startGame} size="lg" className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold">
              Play Again
            </Button>
          </div>
        </div>
      )}

      {zombies.map((zombie) => (
        <div
          key={zombie.id}
          className="absolute cursor-pointer transition-transform hover:scale-110"
          style={{
            left: `${zombie.x}px`,
            top: `${zombie.y}px`,
          }}
          onClick={() => !zombie.isDying && handleZombieClick(zombie.id, zombie.type)}
        >
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-16 h-16 flex items-center justify-center">
            <img src="/images/rialo-logo.png" alt="Rialo" className="w-10 h-10 object-contain" />
          </div>
          <img
            src={
              zombie.isDying
                ? zombie.type === "female"
                  ? "/images/dead-female-zombie.png"
                  : "/images/dead-male-zombie.png"
                : zombie.type === "female"
                  ? "/images/female-zombie.png"
                  : "/images/zombie.png"
            }
            alt="Zombie"
            className="w-24 h-24 object-contain"
            draggable={false}
          />
        </div>
      ))}
    </div>
  )
}
