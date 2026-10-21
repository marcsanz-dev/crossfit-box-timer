// Audio Session API (W3C draft). Implemented by Safari 16.4+, not in TypeScript's DOM lib yet.
// https://w3c.github.io/audio-session/

type AudioSessionType =
  | "auto"
  | "playback"
  | "transient"
  | "transient-solo"
  | "ambient"
  | "play-and-record";

interface AudioSession extends EventTarget {
  type: AudioSessionType;
}

interface Navigator {
  readonly audioSession?: AudioSession;
}
