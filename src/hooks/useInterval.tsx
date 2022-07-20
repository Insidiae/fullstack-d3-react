//? https://overreacted.io/making-setinterval-declarative-with-react-hooks/
import * as React from "react";

export function useInterval(callback: () => void, delay: number) {
  const savedCallback = React.useRef<typeof callback>();

  // Remember the latest callback.
  React.useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval.
  React.useEffect(() => {
    function tick() {
      savedCallback.current?.();
    }
    if (delay !== null) {
      const id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}
