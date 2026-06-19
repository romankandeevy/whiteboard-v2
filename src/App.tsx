import { ReactSketchCanvas } from 'react-sketch-canvas'
import './App.css'

function App() {
  return (
    <div className="board">
      <ReactSketchCanvas
        strokeColor="#000000"
        strokeWidth={3}
        canvasColor="#ffffff"
      />
    </div>
  )
}

export default App
