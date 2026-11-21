export type CountdownParts = {
  complete: boolean;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

export function getCountdownParts(targetTime: number, now: number): CountdownParts {
  const remainingSeconds = Math.floor((targetTime - now) / 1000);

  if (remainingSeconds <= 0) {
    return { complete: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  return {
    complete: false,
    days: Math.floor(remainingSeconds / 86_400),
    hours: Math.floor((remainingSeconds % 86_400) / 3_600),
    minutes: Math.floor((remainingSeconds % 3_600) / 60),
    seconds: remainingSeconds % 60,
  };
}