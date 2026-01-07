// PIN hashing utilities using Web Crypto API

const SALT = "MEET_APP_PIN_SALT_2024";

export const hashPin = async (pin: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + SALT);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
};

export const verifyPin = async (
  pin: string,
  storedHash: string
): Promise<boolean> => {
  const inputHash = await hashPin(pin);
  return inputHash === storedHash;
};
