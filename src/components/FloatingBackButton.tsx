type MoodLabWindow = Window & {
  __moodlabGoBack?: () => void;
};

export function FloatingBackButton() {
  const handleClick = () => {
    const moodLabWindow = window as MoodLabWindow;
    if (typeof moodLabWindow.__moodlabGoBack === "function") {
      moodLabWindow.__moodlabGoBack();
      return;
    }
    window.location.reload();
  };

  return (
    <button id="back-btn" onClick={handleClick}>
      ←
    </button>
  );
}
