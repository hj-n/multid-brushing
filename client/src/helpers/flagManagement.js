
export function setPosUpdatingFlag(flag, duration) {
  flag.posUpdating = true;
  setTimeout(() => { flag.posUpdating = false; }, duration);
}