import Canvas from "./components/Canvas";
import ModeSelector from "./components/ModeSelector";
import MouseDisplay from "./components/MouseDisplay";
import TwoCanvas from "./components/TwoCanvas";

const App = () => {
  return (
    <div>
      <MouseDisplay/>
      <ModeSelector/>
      <TwoCanvas/>
    </div>
  )
};

export default App;
