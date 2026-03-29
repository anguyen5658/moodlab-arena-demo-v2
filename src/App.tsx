import MoodLabArena from "./pages/moodlab-arena-v6";
import { DeviceFrame } from "./components/DeviceFrame";
import { FloatingBackButton } from "./components/FloatingBackButton";

export default function App() {
  return (
    <>
      <DeviceFrame>
        <MoodLabArena />
      </DeviceFrame>
      <FloatingBackButton />
    </>
  );
}
