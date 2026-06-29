export function isUpgradeRequired(status: number, error?: string) {
  return status === 402 || /credits|buy more|upgrade|used up/i.test(error ?? "");
}

export function notifyUpgradeRequired() {
  window.dispatchEvent(new Event("devoice:open-upgrade"));
}
