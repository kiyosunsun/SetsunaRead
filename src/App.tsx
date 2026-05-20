import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="flex gap-8 mb-8">
        <a href="https://vite.dev" target="_blank" rel="noreferrer">
          <img src={viteLogo} className="h-24 p-4 hover:drop-shadow-[0_0_2em_#646cffaa] transition-all duration-300" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank" rel="noreferrer">
          <img src={reactLogo} className="h-24 p-4 hover:drop-shadow-[0_0_2em_#61dafbaa] transition-all duration-300 animate-spin [animation-duration:20s]" alt="React logo" />
        </a>
      </div>
      <h1 className="text-5xl font-bold mb-8">Vite + React</h1>
      <div className="p-8">
        <button
          onClick={() => setCount((count) => count + 1)}
          className="rounded-lg border border-transparent px-6 py-3 text-base font-medium bg-gray-800 text-white hover:border-gray-600 transition-colors cursor-pointer focus:outline-4 focus:outline-auto focus:outline-offset-2"
        >
          count is {count}
        </button>
        <p className="mt-4 text-gray-600 dark:text-gray-400">
          Edit <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm">src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="text-gray-500">
        Click on the Vite and React logos to learn more
      </p>
    </div>
  )
}

export default App
